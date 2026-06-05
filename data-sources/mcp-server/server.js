import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { z } from "zod";
import { readFileSync, readdirSync } from "fs";
import { createServer } from "http";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { randomUUID } from "crypto";

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

// ── Tool: get_prior_auth_requirements ─────────────────────────────────────────
server.tool(
  "get_prior_auth_requirements",
  "Returns prior authorization requirements for a procedure code (CPT/HCPCS) or service category. Searches HealthBridge PA policies and returns covered indications, criteria, review timeframes, and any plan-specific overrides.",
  {
    procedureCode: z
      .string()
      .optional()
      .describe("CPT or HCPCS procedure code (e.g. '27447', '70553')"),
    serviceCategory: z
      .string()
      .optional()
      .describe("Human-readable service category (e.g. 'MRI', 'Physical Therapy', 'Knee Replacement')"),
    planId: z
      .string()
      .optional()
      .describe("Optional plan identifier to check plan-specific PA rules (e.g. 'BP-PPO-GOLD-2026')"),
  },
  async ({ procedureCode, serviceCategory, planId }) => {
    if (!procedureCode && !serviceCategory) {
      return {
        content: [{ type: "text", text: "Please provide at least one of: procedureCode or serviceCategory." }],
      };
    }

    const policies = loadDirectory("policies");
    const policyTexts = [
      loadText("policies/prior-auth-policy.md"),
      loadText("policies/coverage-criteria.md"),
      loadText("policies/formulary-guidelines.md"),
    ].filter(Boolean);

    const searchTerms = [procedureCode, serviceCategory, planId].filter(Boolean);
    const results = [];

    for (const text of policyTexts) {
      const lines = text.split("\n");
      for (const term of searchTerms) {
        const keyword = term.toLowerCase();
        const matchingLines = lines.filter((l) => l.toLowerCase().includes(keyword));
        if (matchingLines.length > 0) {
          // Return a window of context around each match
          const matchedWithContext = matchingLines.slice(0, 20);
          results.push(`## Matches for "${term}":\n${matchedWithContext.join("\n")}`);
        }
      }
    }

    if (results.length === 0) {
      const notFoundMsg = [
        `No prior authorization requirements found for:`,
        procedureCode ? `  Procedure Code: ${procedureCode}` : null,
        serviceCategory ? `  Service Category: ${serviceCategory}` : null,
        planId ? `  Plan: ${planId}` : null,
        "",
        "This service may not require prior authorization under HealthBridge policy, or the code may not be listed.",
        "Contact Provider Services at 555-0190 for confirmation.",
      ]
        .filter((l) => l !== null)
        .join("\n");
      return { content: [{ type: "text", text: notFoundMsg }] };
    }

    const header = [
      `## Prior Authorization Requirements — HealthBridge Insurance Plan`,
      procedureCode ? `**Procedure Code:** ${procedureCode}` : null,
      serviceCategory ? `**Service Category:** ${serviceCategory}` : null,
      planId ? `**Plan:** ${planId}` : null,
      "",
    ]
      .filter((l) => l !== null)
      .join("\n");

    return {
      content: [{ type: "text", text: `${header}\n${results.join("\n\n")}` }],
    };
  }
);

// ── Tool: get_clinical_coverage_criteria ──────────────────────────────────────
server.tool(
  "get_clinical_coverage_criteria",
  "Returns medical necessity and clinical coverage criteria for a service code or ICD-10 diagnosis code. Searches HealthBridge clinical policies for covered indications, step therapy requirements, and exclusions.",
  {
    serviceCode: z
      .string()
      .optional()
      .describe("CPT or HCPCS service code (e.g. '93306', '73721')"),
    diagnosisCode: z
      .string()
      .optional()
      .describe("ICD-10-CM diagnosis code (e.g. 'M17.11', 'I50.9')"),
  },
  async ({ serviceCode, diagnosisCode }) => {
    if (!serviceCode && !diagnosisCode) {
      return {
        content: [{ type: "text", text: "Please provide at least one of: serviceCode or diagnosisCode." }],
      };
    }

    const criteriaText = loadText("policies/coverage-criteria.md");
    const paText = loadText("policies/prior-auth-policy.md");
    const policyTexts = [criteriaText, paText].filter(Boolean);

    const searchTerms = [serviceCode, diagnosisCode].filter(Boolean);
    const results = [];

    for (const text of policyTexts) {
      const lines = text.split("\n");
      for (const term of searchTerms) {
        const keyword = term.toLowerCase();
        // Find lines matching the term and capture surrounding section context
        const matchIndices = lines
          .map((l, i) => (l.toLowerCase().includes(keyword) ? i : -1))
          .filter((i) => i >= 0);

        for (const idx of matchIndices.slice(0, 3)) {
          // Grab up to 15 lines of context around the match
          const start = Math.max(0, idx - 2);
          const end = Math.min(lines.length, idx + 15);
          const excerpt = lines.slice(start, end).join("\n");
          results.push(`## Coverage Criteria — "${term}" (lines ${start + 1}–${end}):\n${excerpt}`);
        }
      }
    }

    if (results.length === 0) {
      return {
        content: [
          {
            type: "text",
            text: [
              `No specific clinical coverage criteria found for:`,
              serviceCode ? `  Service Code: ${serviceCode}` : null,
              diagnosisCode ? `  Diagnosis Code: ${diagnosisCode}` : null,
              "",
              "This service may be covered under general medical necessity standards.",
              "Refer to HealthBridge Clinical Policy CP-2026-MED-001 for full criteria.",
            ]
              .filter((l) => l !== null)
              .join("\n"),
          },
        ],
      };
    }

    const header = [
      `## Clinical Coverage Criteria — HealthBridge Insurance Plan`,
      serviceCode ? `**Service Code:** ${serviceCode}` : null,
      diagnosisCode ? `**Diagnosis Code:** ${diagnosisCode}` : null,
      "",
    ]
      .filter((l) => l !== null)
      .join("\n");

    return {
      content: [{ type: "text", text: `${header}\n${results.join("\n\n")}` }],
    };
  }
);

// ── Tool: check_formulary ─────────────────────────────────────────────────────
server.tool(
  "check_formulary",
  "Look up a drug in the HealthBridge formulary. Returns tier assignment, prior auth requirements, step therapy requirements, quantity limits, specialty pharmacy designation, and formulary notes.",
  {
    drugName: z
      .string()
      .optional()
      .describe("Drug brand or generic name (partial match, e.g. 'humira', 'atorvastatin')"),
    therapeuticClass: z
      .string()
      .optional()
      .describe("Therapeutic drug class (e.g. 'TNF Inhibitor', 'Statin', 'SGLT2 Inhibitor')"),
  },
  async ({ drugName, therapeuticClass }) => {
    if (!drugName && !therapeuticClass) {
      return {
        content: [{ type: "text", text: "Please provide at least one of: drugName or therapeuticClass." }],
      };
    }

    const formulary = loadDirectory("formulary");

    if (formulary.length === 0) {
      // Fall back to formulary guidelines text if JSON data not yet loaded
      const guidelinesText = loadText("policies/formulary-guidelines.md");
      if (guidelinesText) {
        const searchTerm = (drugName || therapeuticClass || "").toLowerCase();
        const lines = guidelinesText.split("\n");
        const matchingLines = lines.filter((l) => l.toLowerCase().includes(searchTerm));
        if (matchingLines.length > 0) {
          return {
            content: [
              {
                type: "text",
                text: `## Formulary Information (from guidelines) — "${drugName || therapeuticClass}"\n\n${matchingLines.slice(0, 20).join("\n")}`,
              },
            ],
          };
        }
      }
      return {
        content: [
          {
            type: "text",
            text: `Formulary data is not yet loaded. No records found for "${drugName || therapeuticClass}". Contact pharmacy benefits at 555-0188.`,
          },
        ],
      };
    }

    let results = formulary;
    if (drugName) {
      const keyword = drugName.toLowerCase();
      results = results.filter(
        (d) =>
          d.drugName?.toLowerCase().includes(keyword) ||
          d.genericName?.toLowerCase().includes(keyword)
      );
    }
    if (therapeuticClass) {
      const keyword = therapeuticClass.toLowerCase();
      results = results.filter((d) =>
        d.therapeuticClass?.toLowerCase().includes(keyword)
      );
    }

    if (results.length === 0) {
      return {
        content: [
          {
            type: "text",
            text: `No formulary entries found for ${drugName ? `drug "${drugName}"` : ""}${drugName && therapeuticClass ? " / " : ""}${therapeuticClass ? `therapeutic class "${therapeuticClass}"` : ""}. The drug may be non-formulary or require a formulary exception.`,
          },
        ],
      };
    }

    return {
      content: [{ type: "text", text: JSON.stringify(results, null, 2) }],
    };
  }
);

// ── Start server ──────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const transportFlag = args.find((a) => a.startsWith("--transport="))?.split("=")[1] ??
  (args.includes("--transport") ? args[args.indexOf("--transport") + 1] : "stdio");
const useHttp = transportFlag === "http";

if (useHttp) {
  const PORT = 3000;

  const httpServer = createServer(async (req, res) => {
    // Only handle POST /mcp — respond 404 for anything else
    if (req.method === "POST" && req.url === "/mcp") {
      // Buffer the request body for passing as parsedBody
      const chunks = [];
      for await (const chunk of req) chunks.push(chunk);
      const body = Buffer.concat(chunks).toString("utf8");
      let parsedBody;
      try {
        parsedBody = JSON.parse(body);
      } catch {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Invalid JSON body" }));
        return;
      }

      const transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: () => randomUUID(),
      });
      await server.connect(transport);
      await transport.handleRequest(req, res, parsedBody);
    } else if (req.method === "GET" && req.url === "/health") {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ status: "ok", server: "healthcare-payor-mcp", version: "1.0.0" }));
    } else {
      res.writeHead(404, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Not found. Use POST /mcp for MCP requests." }));
    }
  });

  httpServer.listen(PORT, () => {
    console.error(`[healthcare-payor-mcp] HTTP transport listening on http://localhost:${PORT}`);
    console.error(`[healthcare-payor-mcp] MCP endpoint: POST http://localhost:${PORT}/mcp`);
    console.error(`[healthcare-payor-mcp] Health check: GET  http://localhost:${PORT}/health`);
  });
} else {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}
