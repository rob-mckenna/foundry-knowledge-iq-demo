/**
 * Comprehensive MCP tool test using the MCP SDK Client over stdio.
 * Exercises all 7 tools: lookup_member, lookup_claim, check_benefits,
 * lookup_provider, get_prior_auth_requirements, get_clinical_coverage_criteria,
 * check_formulary.
 *
 * Run: node test-tools.mjs  (or: npm test)
 */
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SERVER_PATH = join(__dirname, "server.js");

let passed = 0;
let failed = 0;

function assert(label, condition, detail = "") {
  if (condition) {
    console.log(`  ✅ ${label}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${label}${detail ? " — " + detail : ""}`);
    failed++;
  }
}

async function callTool(client, name, args) {
  const result = await client.callTool({ name, arguments: args });
  const text = result.content?.[0]?.text ?? "";
  return { result, text };
}

// ── Bootstrap client ──────────────────────────────────────────────────────────
const transport = new StdioClientTransport({
  command: "node",
  args: [SERVER_PATH],
});

const client = new Client(
  { name: "test-client", version: "1.0.0" },
  { capabilities: { tools: {} } }
);

await client.connect(transport);

// Verify tool list
const { tools } = await client.listTools();
const toolNames = tools.map((t) => t.name);
const EXPECTED_TOOLS = [
  "lookup_member",
  "lookup_claim",
  "check_benefits",
  "lookup_provider",
  "get_prior_auth_requirements",
  "get_clinical_coverage_criteria",
  "check_formulary",
];
console.log("\n── Tool registration ──");
for (const name of EXPECTED_TOOLS) {
  assert(`tool "${name}" is registered`, toolNames.includes(name));
}

// ── lookup_member ─────────────────────────────────────────────────────────────
console.log("\n── lookup_member ──");
{
  const { text } = await callTool(client, "lookup_member", { member_id: "MBR-2024-001234" });
  const data = JSON.parse(text);
  assert("find MBR-2024-001234 by ID", Array.isArray(data) && data.length === 1);
  assert("MBR-2024-001234 is Hartwell", data[0]?.subscriber?.lastName === "Hartwell");
}
{
  const { text } = await callTool(client, "lookup_member", { name: "nguyen" });
  const data = JSON.parse(text);
  assert("find Nguyen by name", data.some((m) => m.memberId === "MBR-2024-002891"));
}
{
  const { text } = await callTool(client, "lookup_member", { member_id: "NOTEXIST-999" });
  assert("no-match returns friendly message", text.includes("No members found"));
}

// ── lookup_claim ──────────────────────────────────────────────────────────────
console.log("\n── lookup_claim ──");
{
  const { text } = await callTool(client, "lookup_claim", { claim_id: "CLM-2026-0054321" });
  const data = JSON.parse(text);
  assert("find CLM-2026-0054321 by claim ID", Array.isArray(data) && data.length >= 1);
}
{
  const { text } = await callTool(client, "lookup_claim", { member_id: "MBR-2024-001234" });
  const data = JSON.parse(text);
  assert("find claims for MBR-2024-001234", Array.isArray(data) && data.length >= 1);
}
{
  const { text } = await callTool(client, "lookup_claim", { status: "paid" });
  const data = JSON.parse(text);
  assert("filter by status=paid returns results", Array.isArray(data) && data.length >= 1);
  assert("all returned claims are paid", data.every((c) => c.claimStatus?.toLowerCase() === "paid"));
}

// ── check_benefits ────────────────────────────────────────────────────────────
console.log("\n── check_benefits ──");
{
  const { text } = await callTool(client, "check_benefits", { member_id: "MBR-2024-001234" });
  assert("benefits for Hartwell include member name", text.includes("Hartwell"));
  assert("benefits response includes plan info", text.includes("Plan:"));
}
{
  const { text } = await callTool(client, "check_benefits", {
    member_id: "MBR-2024-001234",
    service_category: "pharmacy",
  });
  assert("pharmacy benefit filter returns content", text.length > 0);
}
{
  const { text } = await callTool(client, "check_benefits", { member_id: "NOTEXIST-999" });
  assert("unknown member returns not-found message", text.includes("not found"));
}

// ── lookup_provider ───────────────────────────────────────────────────────────
console.log("\n── lookup_provider ──");
{
  const { text } = await callTool(client, "lookup_provider", { npi: "1234567890" });
  const data = JSON.parse(text);
  assert("find provider by NPI 1234567890", data[0]?.individual?.lastName === "Chen");
}
{
  const { text } = await callTool(client, "lookup_provider", { specialty: "cardiology" });
  const data = JSON.parse(text);
  assert("find cardiology providers", data.length >= 1);
}
{
  const { text } = await callTool(client, "lookup_provider", { name: "NONEXISTENT-XYZ-999" });
  assert("no-match returns friendly message or empty", text.includes("No providers") || text.includes("[]"));
}

// ── get_prior_auth_requirements ───────────────────────────────────────────────
console.log("\n── get_prior_auth_requirements ──");
{
  const { text } = await callTool(client, "get_prior_auth_requirements", {
    procedureCode: "27447",
  });
  assert("CPT 27447 (knee arthroplasty) returns PA requirements", text.includes("27447") || text.includes("Knee"));
}
{
  const { text } = await callTool(client, "get_prior_auth_requirements", {
    serviceCategory: "Physical Therapy",
  });
  assert("Physical Therapy returns PA content", text.toLowerCase().includes("physical therapy") || text.toLowerCase().includes("therapy"));
}
{
  const { text } = await callTool(client, "get_prior_auth_requirements", {
    procedureCode: "99999",
    serviceCategory: "NonExistentService",
  });
  assert("unknown code returns no-match message", text.includes("No prior authorization") || text.includes("not listed") || text.includes("not found") || text.includes("555-0190"));
}
{
  const { text } = await callTool(client, "get_prior_auth_requirements", {});
  assert("missing args returns guidance message", text.includes("Please provide"));
}

// ── get_clinical_coverage_criteria ────────────────────────────────────────────
console.log("\n── get_clinical_coverage_criteria ──");
{
  const { text } = await callTool(client, "get_clinical_coverage_criteria", {
    serviceCode: "93306",
  });
  assert("echocardiography CPT 93306 returns criteria", text.includes("93306") || text.toLowerCase().includes("echo") || text.toLowerCase().includes("cardiac"));
}
{
  const { text } = await callTool(client, "get_clinical_coverage_criteria", {
    diagnosisCode: "M17.11",
  });
  assert("ICD-10 M17.11 (knee osteoarthritis) returns coverage criteria", text.includes("M17.11") || text.toLowerCase().includes("knee") || text.toLowerCase().includes("arthr"));
}
{
  const { text } = await callTool(client, "get_clinical_coverage_criteria", {
    serviceCode: "99999",
    diagnosisCode: "Z00.00",
  });
  assert("unknown codes return no-criteria message", text.toLowerCase().includes("no specific") || text.toLowerCase().includes("not found") || text.toLowerCase().includes("general medical"));
}
{
  const { text } = await callTool(client, "get_clinical_coverage_criteria", {});
  assert("missing args returns guidance message", text.includes("Please provide"));
}

// ── check_formulary ───────────────────────────────────────────────────────────
console.log("\n── check_formulary ──");
{
  // Formulary JSON may or may not exist yet — test both paths
  const { text } = await callTool(client, "check_formulary", { drugName: "atorvastatin" });
  assert(
    "atorvastatin lookup returns content (or graceful fallback)",
    text.length > 0 && !text.includes("Please provide")
  );
}
{
  const { text } = await callTool(client, "check_formulary", { therapeuticClass: "Statin" });
  assert(
    "Statin therapeutic class lookup returns content (or graceful fallback)",
    text.length > 0 && !text.includes("Please provide")
  );
}
{
  const { text } = await callTool(client, "check_formulary", {});
  assert("missing args returns guidance message", text.includes("Please provide"));
}

// ── Teardown ──────────────────────────────────────────────────────────────────
await client.close();

console.log(`\n── Results: ${passed} passed, ${failed} failed ──\n`);
if (failed > 0) process.exit(1);

