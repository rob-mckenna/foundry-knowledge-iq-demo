# Demo Script — HealthBridge Knowledge IQ

**Product:** Knowledge IQ in Azure AI Foundry  
**Audience:** Healthcare payor — technical and business decision makers  
**Brand:** HealthBridge Insurance Plan (HealthBridge Insurance)

---

## Before You Start

**Have these open and ready:**
- Azure AI Foundry portal at [ai.azure.com](https://ai.azure.com), signed in, on **proj-healthbridge**
- The `healthbridge-assistant` agent open in the **Playground** tab
- **Citations** panel enabled (toggle in upper-right of Playground)
- **Trace** view available but closed (open it on request)

**Know your member scenario:**
> Marcus Hartwell (member ID: MBR-2024-001234) is a 42-year-old enrolled in the HealthBridge PPO Gold plan. His physician has referred him to an orthopedic surgeon for a knee issue, which may require an MRI and possibly lumbar surgery. He is also managing Type 2 diabetes and takes a GLP-1 medication.

---

## 3-Minute Version — Quick Hits

*Use when: you have a short slot at a meeting, or need to warm up a skeptical audience before a deeper dive.*

---

### Slide / Setup (30 sec)

> "I want to show you something that took about an hour to set up. This is a Knowledge Base in the new Azure AI Foundry — it connects four completely different types of data sources into a single queryable surface. Let me run three prompts."

---

### Hit 1 — Provider network from AI Search (45 sec)

Type in Playground:
```
Is Dr. Patricia Chen an in-network provider for my plan?
```

**Say while waiting:**
> "This is hitting our provider directory — an Azure AI Search index."

**When response appears:**
> "Notice it returned her specialty, her location, her network tier, and whether she's accepting new patients. One question, one answer, source cited."

> 📸 *[Screenshot: provider response with citation panel showing ai-search-providers]*

---

### Hit 2 — Formulary from AI Search (45 sec)

Type in Playground:
```
Is Ozempic covered on my formulary, and is prior authorization required?
```

**Say while waiting:**
> "Different source now — our formulary index."

**When response appears:**
> "Tier 4, specialty. Prior auth required. Step therapy may apply. All pulled from the formulary in real time."

> 📸 *[Screenshot: formulary response showing tier + prior auth status]*

---

### Hit 3 — Benefits from Blob Storage (45 sec)

Type in Playground:
```
What is the out-of-pocket maximum for the PPO Gold plan this year?
```

**Say while waiting:**
> "Third source — this one's a PDF, a Summary of Benefits document sitting in Blob Storage."

**When response appears:**
> "Individual max, family max, what counts toward it. All from a plan document that required zero preprocessing — we just uploaded the file."

---

### Close (15 sec)

> "Three sources. Three formats. One agent. That's Knowledge IQ. If you want to see the full member scenario — including prior auth and claims — give me ten minutes."

---

---

## 10-Minute Version — The Marcus Hartwell Story

*Use when: you have a dedicated demo slot. This version builds a narrative with a single patient journey across all data sources.*

---

### Act 1 — Frame the Problem (1 min)

> "Before I show you the technology, let me describe a moment your care management team lives in every day."
>
> "A care coordinator gets a call from Marcus Hartwell — PPO Gold member, 42 years old. He's been referred for an MRI on his knee. Maybe lumbar surgery. He's also been on Ozempic for his Type 2 diabetes and just got a renewal notice. He has questions about what's covered, what needs prior auth, and whether his orthopedic surgeon is in-network."
>
> "Answering those four questions from existing tools means opening three different systems, two policy documents, and probably a phone call to the pharmacy team. The coordinator context-switches for fifteen minutes before she can help Marcus."
>
> "I'm going to answer all of Marcus's questions in about three minutes, grounded in your plan data, citing every source."

> 📸 *[Screenshot: opening Playground — blank agent ready to go]*

---

### Act 2 — Is His Doctor In-Network? (1.5 min)

Type in Playground:
```
Is Dr. Patricia Chen an in-network provider for my plan?
```

**While waiting:**
> "Marcus's referral is to Dr. Chen. Let's check the provider directory."

**When response appears, point to citations:**
> "Provider directory — Azure AI Search index. She's Tier 1 Preferred, Internal Medicine, 1450 Medical Center Drive in Springfield, accepting new patients. Her NPI and phone number are right there."
>
> "This is your data. It came from your provider directory. The Knowledge Base didn't copy it — it connected to it."

> 📸 *[Screenshot: provider response with citation showing source document name]*

---

### Act 3 — Does the MRI Need Prior Auth? (2 min)

Type in Playground:
```
Marcus has been referred for an MRI of his knee. Does he need prior authorization, and who submits the request?
```

**While waiting:**
> "This one touches two sources — the MCP server for live prior auth policy lookup, and the plan documents in Blob Storage."

**When response appears:**
> "Prior auth required. CPT 73721. Ordering provider submits. Standard turnaround is three business days."
>
> "The fact that came from the MCP server — our real-time prior auth system — is the live requirement. The turnaround and submission process came from a policy document in Blob Storage. The agent pulled both, reconciled them, and gave Marcus one coherent answer."

> 📸 *[Screenshot: prior auth response with two citations from different sources]*

**Talking point for technical audience:**
> "The MCP server is running as an Azure Container App. It's a Node.js service wrapping our synthetic data. In production, you'd wrap your Epic or Facets PA system with the same MCP pattern — and this capability follows."

---

### Act 4 — The Formulary Question (2 min)

Type in Playground:
```
Marcus is taking Ozempic for Type 2 diabetes. What tier is it on the formulary, and is there a preferred alternative?
```

**While waiting:**
> "Now we're in the formulary — AI Search index, vector + semantic search."

**When response appears:**
> "Tier 4 Specialty. Prior auth required. The agent also surfaced that there are preferred alternatives — in this case, generic semaglutide options — which may be relevant for Marcus's renewal."
>
> "This is the kind of answer that normally requires your pharmacy team. It's now available to every care coordinator, in plain language, with source citations."

> 📸 *[Screenshot: formulary response with tier, PA status, and alternatives]*

---

### Act 5 — What's Covered? (1.5 min)

Type in Playground:
```
If Marcus needs lumbar fusion surgery, what are the coverage criteria, and what is his out-of-pocket exposure on the PPO Gold plan?
```

**While waiting:**
> "This is a blend — clinical criteria from the prior auth policies, cost-sharing from the benefits summary PDF."

**When response appears:**
> "Coverage criteria from the clinical policy. Out-of-pocket from the Summary of Benefits document. Two different file types, two different sources, one structured answer."

> 📸 *[Screenshot: multi-source response with two citation types visible]*

---

### Act 6 — Show the Trace (1 min)

Click the **Trace** icon on any previous response.

> "Let me show you what happened behind the scenes."

Point to the retrieval steps:
> "The agent rewrote Marcus's question into a structured query. It retrieved from three sources, reranked the results by relevance, and composed the response. The reranker score tells you how confident it was in each citation."
>
> "Every step is logged, traceable, auditable. For a healthcare payor, that's not a nice-to-have — it's a compliance requirement."

> 📸 *[Screenshot: Trace panel open showing retrieval steps, reranker scores, source names]*

---

### Act 7 — The Architecture, One Slide (1 min)

> "Here's what you just saw: four data sources, zero ETL."
>
> "The MCP server is your real-time operational data — live PA requirements, eligibility. AI Search is your governed document corpus — formulary, clinical guidelines. Blob Storage is your existing file library — benefits summaries, policy PDFs. Fabric Data Agent is your analytics warehouse — claims history, utilization. Each one stays in place. The Knowledge Base connects to them."
>
> "Your team can add a fifth source tomorrow — another MCP endpoint, another search index, a new document container — without touching the agent."

---

### Close (30 sec)

> "Marcus got answers to all four of his questions in about three minutes. More importantly, every answer is traceable to a specific plan document or data record. Your coordinators get faster answers. Your compliance team gets full provenance. Your IT team didn't move any data."
>
> "That's Knowledge IQ."

---

---

## Key Talking Points — Healthcare Payor Audience

Use these in response to natural audience reactions.

### "Does it copy our data into Azure?"

> "No. Foundry indexes metadata and connects at query time. The underlying data never moves — it stays in your Search index, your blob container, your Fabric lakehouse, or behind your MCP endpoint. You control access at the source."

### "What about HIPAA / PHI?"

> "All demo data is synthetic. In production, your existing data residency, access controls, and RBAC apply. The Knowledge Base respects the permissions of the underlying sources — if a user can't read a document directly, the agent can't read it for them."

### "Can we connect Epic, Facets, or our claims warehouse?"

> "Any system accessible via MCP, REST API, or exportable to Blob/Search/Fabric can be connected. MCP is an open protocol — if your team can wrap a system in an endpoint, it becomes a Knowledge Base source. We've done this pattern with major payor systems."

### "How fresh is the data?"

> "MCP and Fabric Data Agent are real-time — they respond to queries live. Blob Storage and AI Search can be refreshed on a schedule you define, from near-real-time to nightly, depending on your SLA."

### "What model is powering this?"

> "The Knowledge Base is model-agnostic. The demo uses GPT-4o, but Foundry supports any deployed model — including models you fine-tune or host yourself. The Knowledge Base retrieval layer is independent of the model."

### "What about the MCP server — is that a Microsoft standard?"

> "MCP (Model Context Protocol) is an open standard from Anthropic, now widely adopted across the industry. Azure AI Foundry has native MCP support. Any MCP-compliant server — built by your team or a vendor — connects directly."

### "What does this cost?"

> "Pricing varies by resource tier and usage. The core components are Azure AI Foundry (per-token), AI Search (per-index-unit), Blob Storage (per-GB), and your chosen LLM deployment. For a demo environment, total cost is typically under $50/month."

---

## Screenshot Placeholder Notes

The following screenshots should be captured from a running demo environment and inserted at the marked locations above:

| # | What to Capture | Location in Script |
|---|---|---|
| 1 | Provider response with citation panel showing `ai-search-providers` | Act 2 / Hit 1 |
| 2 | Formulary response with tier + prior auth status | Act 4 / Hit 2 |
| 3 | OOP max response with blob storage citation | Hit 3 |
| 4 | Prior auth response with two citations (MCP + blob) | Act 3 |
| 5 | Formulary multi-source response (tier, PA, alternatives) | Act 4 |
| 6 | Multi-source response with two citation types | Act 5 |
| 7 | Trace panel open — retrieval steps, reranker scores, source names | Act 6 |
| 8 | Knowledge Base setup screen — all four sources connected | Architecture slide |

> **Tip for capturing screenshots:** Enable **Citations** panel before capturing any response screenshot. Enable the **Trace** view for the architecture/audit slide. Use a browser zoom of 90% for cleaner screenshots in presentation slides.

---

## Common Setup Issues

| Symptom | Likely Cause | Fix |
|---|---|---|
| Agent returns "I wasn't able to find information" | Knowledge Base not indexed yet | Wait 15 min after saving; check index status in KB settings |
| No citations appear | Citations toggle off | Enable in Playground upper-right toolbar |
| Provider/formulary queries return nothing | AI Search index empty | Confirm documents were uploaded and indexer ran (check portal) |
| MCP tool calls fail | MCP server not reachable | Verify Container Apps URL, check health endpoint |
| Blob responses are generic | Wrong container name in connection | Confirm connection points to `healthcare-docs` container |

---

*Demo Script version: 1.0 | Created: 2026-06-05 | New Azure AI Foundry (ai.azure.com) only*
