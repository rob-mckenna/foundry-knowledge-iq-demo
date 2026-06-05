// Quick smoke-test for the data loading functions and tool logic.
// Run: node test-tools.mjs
import { readFileSync, readdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SAMPLE_DATA = join(__dirname, "..", "..", "sample-data");

function loadDirectory(subdir) {
  const dir = join(SAMPLE_DATA, subdir);
  return readdirSync(dir)
    .filter((f) => f.endsWith(".json"))
    .map((f) => JSON.parse(readFileSync(join(dir, f), "utf8")));
}

function loadText(relativePath) {
  try {
    return readFileSync(join(SAMPLE_DATA, relativePath), "utf8");
  } catch {
    return null;
  }
}

function benefitsSummaryFile(planType, metalTier) {
  return `benefits/${planType?.toLowerCase()}-${metalTier?.toLowerCase()}-benefit-summary.md`;
}

let passed = 0;
let failed = 0;

function assert(label, condition) {
  if (condition) {
    console.log(`  ✅ ${label}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${label}`);
    failed++;
  }
}

// ── Members ───────────────────────────────────────────────────────────────────
console.log("\n── lookup_member ──");
const members = loadDirectory("members");
assert("loads 3 members", members.length === 3);
assert("members have memberId (camelCase)", members.every((m) => !!m.memberId));
assert("members have subscriber.firstName", members.every((m) => !!m.subscriber?.firstName));

const byId = members.filter((m) => m.memberId?.toLowerCase().includes("mbr-2024-001234"));
assert("find MBR-2024-001234 by id", byId.length === 1);
assert("MBR-2024-001234 is Hartwell", byId[0]?.subscriber?.lastName === "Hartwell");

const byName = members.filter((m) =>
  `${m.subscriber?.firstName} ${m.subscriber?.lastName}`.toLowerCase().includes("nguyen")
);
assert("find Nguyen by name", byName.length === 1);
assert("Nguyen memberId is MBR-2024-002891", byName[0]?.memberId === "MBR-2024-002891");

// ── Claims ────────────────────────────────────────────────────────────────────
console.log("\n── lookup_claim ──");
const claims = loadDirectory("claims");
assert("loads 3 claims", claims.length === 3);
assert("claims have claimId (camelCase)", claims.every((c) => !!c.claimId));
assert("claims have claimStatus (camelCase)", claims.every((c) => !!c.claimStatus));

const byClaimId = claims.filter((c) => c.claimId?.toLowerCase().includes("clm-2026-0054321"));
assert("find CLM-2026-0054321", byClaimId.length === 1);

const byMember = claims.filter((c) => c.memberId?.toLowerCase().includes("mbr-2024-001234"));
assert("claims for MBR-2024-001234", byMember.length >= 1);

const byStatus = claims.filter((c) => c.claimStatus?.toLowerCase() === "paid");
assert("at least one PAID claim", byStatus.length > 0);

// ── Providers ─────────────────────────────────────────────────────────────────
console.log("\n── lookup_provider ──");
const providers = loadDirectory("providers");
assert("loads 3 providers", providers.length === 3);
assert("providers have npi", providers.every((p) => !!p.npi));

const byNpi = providers.filter((p) => p.npi?.includes("1234567890"));
assert("find NPI-1234567890", byNpi.length === 1);
assert("NPI-1234567890 is Dr. Chen", byNpi[0]?.individual?.lastName === "Chen");

const bySpecialty = providers.filter((p) =>
  p.taxonomy?.some((t) => t.description?.toLowerCase().includes("cardiology"))
);
assert("find cardiology provider", bySpecialty.length >= 1);

// ── Benefits ──────────────────────────────────────────────────────────────────
console.log("\n── check_benefits ──");
const hartwell = members.find((m) => m.memberId === "MBR-2024-001234");
const nguyenMember = members.find((m) => m.memberId === "MBR-2024-002891");
const thompson = members.find((m) => m.memberId === "MBR-2024-003456");

const hartwellFile = benefitsSummaryFile(hartwell.planInfo.planType, hartwell.planInfo.metalTier);
const hartwellBenefits = loadText(hartwellFile);
assert("PPO Gold benefit summary found for Hartwell", hartwellBenefits !== null);
assert("PPO Gold summary contains deductible info", hartwellBenefits?.includes("Deductible"));

const nguyenFile = benefitsSummaryFile(nguyenMember.planInfo.planType, nguyenMember.planInfo.metalTier);
const nguyenBenefits = loadText(nguyenFile);
assert("HMO Silver benefit summary found for Nguyen", nguyenBenefits !== null);

const thompsonFile = benefitsSummaryFile(thompson.planInfo.planType, thompson.planInfo.metalTier);
const thompsonBenefits = loadText(thompsonFile);
assert("Platinum plan gracefully returns null (no file yet)", thompsonBenefits === null);

// ── Summary ───────────────────────────────────────────────────────────────────
console.log(`\n── Results: ${passed} passed, ${failed} failed ──`);
if (failed > 0) process.exit(1);
