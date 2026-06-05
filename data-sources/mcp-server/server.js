import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { readFileSync, readdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SAMPLE_DATA = join(__dirname, "..", "..", "sample-data");

// Reads all .json files in sample-data/{subdir}/ and returns them as an array.
function loadDirectory(subdir) {
  try {
    const dir = join(SAMPLE_DATA, subdir);
    return readdirSync(dir)
      .filter((f) => f.endsWith(".json"))
      .map((f) => {
        try {
          return JSON.parse(readFileSync(join(dir, f), "utf8"));
        } catch {
          return null;
        }
      })
      .filter(Boolean);
  } catch {
    return [];
  }
}

// Reads a single text file (e.g. markdown) from sample-data/{relativePath}.
function loadText(relativePath) {
  try {
    return readFileSync(join(SAMPLE_DATA, relativePath), "utf8");
  } catch {
    return null;
  }
}

// Maps a plan's type and metal tier to its benefit-summary markdown filename.
function benefitsSummaryFile(planType, metalTier) {
  const type = planType?.toLowerCase() ?? "";
  const tier = metalTier?.toLowerCase() ?? "";
  return `benefits/${type}-${tier}-benefit-summary.md`;
}

const server = new McpServer({
  name: "healthcare-payor-mcp",
  version: "1.0.0",
});

// ── Tool: lookup_member ────────────────────────────────────────────────────────
server.tool(
  "lookup_member",
  "Look up a health plan member by member ID or name. Returns demographics, plan enrollment, and eligibility status.",
  {
    member_id: z.string().optional().describe("Member ID (e.g. MBR-00123)"),
    name: z.string().optional().describe("Member full name (partial match)"),
  },
  async ({ member_id, name }) => {
    const members = loadDirectory("members");

    let results = members;
    if (member_id) {
      results = results.filter((m) =>
        m.memberId?.toLowerCase().includes(member_id.toLowerCase())
      );
    }
    if (name) {
      const fullName = (m) =>
        `${m.subscriber?.firstName ?? ""} ${m.subscriber?.lastName ?? ""}`.trim();
      results = results.filter((m) =>
        fullName(m).toLowerCase().includes(name.toLowerCase())
      );
    }

    if (results.length === 0) {
      return {
        content: [{ type: "text", text: "No members found matching the criteria." }],
      };
    }

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(results, null, 2),
        },
      ],
    };
  }
);

// ── Tool: lookup_claim ────────────────────────────────────────────────────────
server.tool(
  "lookup_claim",
  "Look up claims for a member or by claim ID. Returns claim status, adjudication details, billed/allowed/paid amounts, and denial reasons if applicable.",
  {
    claim_id: z.string().optional().describe("Claim ID (e.g. CLM-20240001)"),
    member_id: z.string().optional().describe("Member ID to retrieve all claims for a member"),
    status: z
      .enum(["paid", "denied", "pending", "under_review"])
      .optional()
      .describe("Filter by claim status"),
  },
  async ({ claim_id, member_id, status }) => {
    const claims = loadDirectory("claims");

    let results = claims;
    if (claim_id) {
      results = results.filter((c) =>
        c.claimId?.toLowerCase().includes(claim_id.toLowerCase())
      );
    }
    if (member_id) {
      results = results.filter((c) =>
        c.memberId?.toLowerCase().includes(member_id.toLowerCase())
      );
    }
    if (status) {
      results = results.filter(
        (c) => c.claimStatus?.toLowerCase() === status.toLowerCase()
      );
    }

    if (results.length === 0) {
      return {
        content: [{ type: "text", text: "No claims found matching the criteria." }],
      };
    }

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(results, null, 2),
        },
      ],
    };
  }
);

// ── Tool: check_benefits ──────────────────────────────────────────────────────
server.tool(
  "check_benefits",
  "Check benefit coverage and eligibility for a member. Returns in-network/out-of-network coverage, deductibles, copays, coinsurance, and prior auth requirements.",
  {
    member_id: z.string().describe("Member ID to check benefits for"),
    service_category: z
      .string()
      .optional()
      .describe(
        "Service category to filter (e.g. 'mental_health', 'pharmacy', 'preventive', 'specialist', 'emergency')"
      ),
  },
  async ({ member_id, service_category }) => {
    // Resolve the member's plan so we can find the right benefit summary.
    const members = loadDirectory("members");
    const member = members.find((m) =>
      m.memberId?.toLowerCase().includes(member_id.toLowerCase())
    );

    if (!member) {
      return {
        content: [{ type: "text", text: `Member ${member_id} not found.` }],
      };
    }

    const { planType, metalTier, planId, planName } = member.planInfo ?? {};
    const filePath = benefitsSummaryFile(planType, metalTier);
    let benefitsText = loadText(filePath);

    if (!benefitsText) {
      return {
        content: [
          {
            type: "text",
            text: `No benefit summary found for ${member.subscriber?.firstName} ${member.subscriber?.lastName} (${planId} — ${planName}). Plan type: ${planType}, tier: ${metalTier}.`,
          },
        ],
      };
    }

    // If a service category is requested, surface a relevant excerpt.
    if (service_category) {
      const keyword = service_category.toLowerCase().replace(/_/g, " ");
      const lines = benefitsText.split("\n");
      const matchingLines = lines.filter((l) =>
        l.toLowerCase().includes(keyword)
      );
      if (matchingLines.length > 0) {
        benefitsText = `## Benefits for "${service_category}" — ${planName} (${planId})\n\n${matchingLines.join("\n")}`;
      } else {
        benefitsText = `No specific benefit lines found for service category "${service_category}" on ${planName}.\n\nFull benefit summary follows:\n\n${benefitsText}`;
      }
    }

    return {
      content: [
        {
          type: "text",
          text: `Member: ${member.subscriber?.firstName} ${member.subscriber?.lastName} (${member.memberId})\nPlan: ${planName} (${planId})\n\n${benefitsText}`,
        },
      ],
    };
  }
);

// ── Tool: lookup_provider ─────────────────────────────────────────────────────
server.tool(
  "lookup_provider",
  "Look up a healthcare provider by NPI, name, or specialty. Returns network status, practice locations, accepting new patients, and quality metrics.",
  {
    npi: z.string().optional().describe("Provider NPI number"),
    name: z.string().optional().describe("Provider or practice name (partial match)"),
    specialty: z.string().optional().describe("Specialty or taxonomy description (partial match)"),
  },
  async ({ npi, name, specialty }) => {
    const providers = loadDirectory("providers");

    let results = providers;
    if (npi) {
      results = results.filter((p) =>
        p.npi?.toLowerCase().includes(npi.toLowerCase())
      );
    }
    if (name) {
      results = results.filter((p) => {
        const individualName = `${p.individual?.firstName ?? ""} ${p.individual?.lastName ?? ""}`.trim();
        const practiceName = p.practice?.name ?? "";
        return (
          individualName.toLowerCase().includes(name.toLowerCase()) ||
          practiceName.toLowerCase().includes(name.toLowerCase())
        );
      });
    }
    if (specialty) {
      results = results.filter((p) =>
        p.taxonomy?.some((t) =>
          t.description?.toLowerCase().includes(specialty.toLowerCase())
        )
      );
    }

    if (results.length === 0) {
      return {
        content: [{ type: "text", text: "No providers found matching the criteria." }],
      };
    }

    return {
      content: [{ type: "text", text: JSON.stringify(results, null, 2) }],
    };
  }
);

// ── Start server ──────────────────────────────────────────────────────────────
const transport = new StdioServerTransport();
await server.connect(transport);
