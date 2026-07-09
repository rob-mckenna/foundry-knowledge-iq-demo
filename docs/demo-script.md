# Demo Script — HealthBridge Knowledge IQ

**Product:** Knowledge IQ in Azure AI Foundry  
**Audience:** Healthcare payor — technical and business decision makers  
**Brand:** HealthBridge Insurance Plan (HealthBridge Insurance)  
**Version:** 1.1 | Updated: 2026-07-09 | Issue: #10

> **⚠️ Fabric Data Agent is BLOCKED** — The `healthbridge-fabric-connection` has no Fabric workspace GUID yet. Prompts 4 & 5 from `demo-flow.md` (claims analytics, provider quality scores) are **not available**. Use the Fabric-free script below and acknowledge it as "coming soon" if asked. See `docs/connection-status.md`.

---

## Before You Start

**Checklist — complete this 10 minutes before the audience arrives:**
- [ ] Browser open at [ai.azure.com](https://ai.azure.com), signed in, project **proj-healthbridge**
- [ ] `healthbridge-assistant` open in the **Playground** tab
- [ ] **Citations** panel enabled (toggle in upper-right of Playground)
- [ ] **Trace** view available but **closed** (open only on request)
- [ ] Demo script open on a second screen or printed — do not flip tabs during demo
- [ ] Run smoke test S1–S4 from `docs/demo-readiness-checklist.md` — confirm all pass
- [ ] Confirm Fabric is still blocked; remove Fabric talking points from mental script

> **⛔ If any smoke test fails:** stop and fix before the audience arrives. Do not present with a broken environment. See **Fallback Procedures** at the bottom of this document.

**Know your member scenario:**
> John A. Hartwell (member ID: MBR-2024-001234) is a 42-year-old enrolled in the HealthBridge PPO Gold plan. His physician has referred him to an orthopedic surgeon for a knee issue, which may require an MRI and possibly lumbar surgery. He is also managing Type 2 diabetes and takes a GLP-1 medication.

---

## 3-Minute Version — Quick Hits

*Use when: short meeting slot, or warming up a skeptical audience before a deeper dive.*  
*Total budget: 3 min — do not go over. Cut Hit 3 if running short.*

---

### Slide / Setup — 0:00–0:30

> "I want to show you something that took about an hour to set up. This is a Knowledge Base in the new Azure AI Foundry — it connects three completely different types of data sources into a single queryable surface. Let me run three prompts."

> 📝 **Presenter note:** Say "three" not "four" — Fabric is blocked. If asked about the fourth source, say: *"We also have a Fabric Data Agent integration coming — that connects the live claims analytics warehouse."*

---

### Hit 1 — Provider network from AI Search — 0:30–1:15

Type in Playground:
```
Is Dr. Patricia Chen an in-network provider for my plan?
```

**Say while waiting (5–10 sec):**
> "This is hitting our provider directory — an Azure AI Search index."

**When response appears:**
> "Notice it returned her specialty, her location, her network tier, and whether she's accepting new patients. One question, one answer, source cited."

> 📝 **Presenter note:** Point explicitly to the Citations panel and read the source name aloud. This is what differentiates Knowledge IQ from a generic chatbot — every answer is traceable.

> 📸 *[Screenshot: provider response with citation panel showing ai-search-providers]*

---

### Hit 2 — Formulary from AI Search — 1:15–2:00

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

### Hit 3 — Benefits from Blob Storage — 2:00–2:45

Type in Playground:
```
What is the out-of-pocket maximum for the PPO Gold plan this year?
```

**Say while waiting:**
> "Third source — this one's a PDF, a Summary of Benefits document sitting in Blob Storage."

**When response appears:**
> "Individual max, family max, what counts toward it. All from a plan document that required zero preprocessing — we just uploaded the file."

---

### Close — 2:45–3:00

> "Three sources. Three formats. One agent. That's Knowledge IQ. If you want to see the full member scenario — including prior auth — give me ten minutes."

---

---

## 10-Minute Version — The John Hartwell Story

*Use when: dedicated demo slot. Builds a narrative around a single patient journey.*  
*Total budget: 10 min. Target pace: 1–1.5 min per act.*

---

### Act 1 — Frame the Problem — 0:00–1:00

> "Before I show you the technology, let me describe a moment your care management team lives in every day."
>
> "A care coordinator gets a call from John Hartwell — PPO Gold member, 42 years old. He's been referred for an MRI on his knee. Maybe lumbar surgery. He's also been on Ozempic for his Type 2 diabetes and just got a renewal notice. He has questions about what's covered, what needs prior auth, and whether his orthopedic surgeon is in-network."
>
> "Answering those four questions from existing tools means opening three different systems, two policy documents, and probably a phone call to the pharmacy team. The coordinator context-switches for fifteen minutes before she can help John."
>
> "I'm going to answer all of John's questions in about three minutes, grounded in your plan data, citing every source."

> 📸 *[Screenshot: opening Playground — blank agent ready to go]*

> 📝 **Presenter note:** Pause here. Let the audience recognize the problem. If someone nods or says "yep, that's us" — acknowledge it and move on. Don't rush the framing — it pays off the rest of the demo.

---

### Act 2 — Is His Doctor In-Network? — 1:00–2:30

Type in Playground:
```
Is Dr. Patricia Chen an in-network provider for my plan?
```

**While waiting (5–10 sec):**
> "John's referral is to Dr. Chen. Let's check the provider directory."

**When response appears, point to citations:**
> "Provider directory — Azure AI Search index. She's Tier 1 Preferred, Internal Medicine, 1450 Medical Center Drive in Springfield, accepting new patients. Her NPI and phone number are right there."
>
> "This is your data. It came from your provider directory. The Knowledge Base didn't copy it — it connected to it."

> 📸 *[Screenshot: provider response with citation showing source document name]*

> 📝 **Presenter note:** Read the citation source name aloud. It's a small moment but signals provenance — critical for compliance audiences. If no citation appears, see Fallback Procedures.

---

### Act 3 — Does the MRI Need Prior Auth? — 2:30–4:30

Type in Playground:
```
John has been referred for an MRI of his knee. Does he need prior authorization, and who submits the request?
```

**While waiting:**
> "This one touches two sources — the MCP server for live prior auth policy lookup, and the plan documents in Blob Storage."

**When response appears:**
> "Prior auth required. CPT 73721. Ordering provider submits. Standard turnaround is three business days."
>
> "The fact from the MCP server — our real-time prior auth system — is the live requirement. The turnaround and submission process came from a policy document in Blob Storage. The agent pulled both, reconciled them, and gave John one coherent answer."

> 📸 *[Screenshot: prior auth response with two citations from different sources]*

> 📝 **Presenter note — this is the wow moment.** Two sources, one response. Point to both citations explicitly. For a technical audience add: *"The MCP server is running as a Container App. In production, you'd wrap your Epic or Facets PA system with the same MCP pattern."*

---

### Act 4 — The Formulary Question — 4:30–6:30

Type in Playground:
```
John is taking Ozempic for Type 2 diabetes. What tier is it on the formulary, and is there a preferred alternative?
```

**While waiting:**
> "Now we're in the formulary — AI Search index, vector plus semantic search."

**When response appears:**
> "Tier 4 Specialty. Prior auth required. The agent also surfaced that there are preferred alternatives — generic semaglutide options — which may be relevant for John's renewal."
>
> "This is the kind of answer that normally requires your pharmacy team. It's now available to every care coordinator, in plain language, with source citations."

> 📸 *[Screenshot: formulary response with tier, PA status, and alternatives]*

> 📝 **Presenter note:** For a clinical/business audience, emphasize "preferred alternatives" — that's a cost-of-care moment. For a technical audience, note the hybrid vector + semantic search strategy.

---

### Act 5 — What's Covered? — 6:30–8:00

Type in Playground:
```
If John needs lumbar fusion surgery, what are the coverage criteria, and what is his out-of-pocket exposure on the PPO Gold plan?
```

**While waiting:**
> "This is a blend — clinical criteria from the prior auth policies, cost-sharing from the benefits summary PDF."

**When response appears:**
> "Coverage criteria from the clinical policy. Out-of-pocket from the Summary of Benefits document. Two different file types, two different sources, one structured answer."

> 📸 *[Screenshot: multi-source response with two citation types visible]*

---

### Act 6 — Show the Trace — 8:00–9:00

Click the **Trace** icon on any previous response.

> "Let me show you what happened behind the scenes."

Point to the retrieval steps:
> "The agent rewrote John's question into a structured query. It retrieved from three sources, reranked the results by relevance, and composed the response. The reranker score tells you how confident it was in each citation."
>
> "Every step is logged, traceable, auditable. For a healthcare payor, that's not a nice-to-have — it's a compliance requirement."

> 📸 *[Screenshot: Trace panel open showing retrieval steps, reranker scores, source names]*

> 📝 **Presenter note:** Only show Trace if you have time and the audience is technical or compliance-focused. Skip to Act 7 if you're at 8:30 or later.

---

### Act 7 — The Architecture, One Slide — 9:00–9:30

> "Here's what you just saw: three active data sources, zero ETL."
>
> "The MCP server is your real-time operational data — live PA requirements, eligibility. AI Search is your governed document corpus — formulary, clinical guidelines, provider directory. Blob Storage is your existing file library — benefits summaries, policy PDFs. Each one stays in place. The Knowledge Base connects to them."
>
> "We're also adding a Fabric Data Agent source — that connects the claims analytics warehouse for questions like 'what are our top denial codes?' — available in a future sprint."
>
> "Your team can add a new source — another search index, a new document container — without touching the agent."

> 📝 **Presenter note:** Mention Fabric briefly as "coming soon" — do not dwell on it. Move to close.

---

### Close — 9:30–10:00

> "John got answers to all four of his questions in about three minutes. More importantly, every answer is traceable to a specific plan document or data record. Your coordinators get faster answers. Your compliance team gets full provenance. Your IT team didn't move any data."
>
> "That's Knowledge IQ."

---

---

## Key Talking Points — Healthcare Payor Audience

Use these in response to natural audience reactions.

### "Does it copy our data into Azure?"

> "No. Foundry indexes metadata and connects at query time. The underlying data never moves — it stays in your Search index, your blob container, or behind your MCP endpoint. You control access at the source."

### "What about HIPAA / PHI?"

> "All demo data is synthetic. In production, your existing data residency, access controls, and RBAC apply. The Knowledge Base respects the permissions of the underlying sources — if a user can't read a document directly, the agent can't read it for them."

### "Can we connect Epic, Facets, or our claims warehouse?"

> "Any system accessible via MCP, REST API, or exportable to Blob/Search/Fabric can be connected. MCP is an open protocol — if your team can wrap a system in an endpoint, it becomes a Knowledge Base source."

### "How fresh is the data?"

> "MCP and Fabric Data Agent are real-time — they respond to queries live. Blob Storage and AI Search refresh on a schedule you define, from near-real-time to nightly."

### "What model is powering this?"

> "The Knowledge Base is model-agnostic. The demo uses GPT-4o, but Foundry supports any deployed model — including models you fine-tune or host yourself. The retrieval layer is independent of the model."

### "What about the MCP server — is that a Microsoft standard?"

> "MCP (Model Context Protocol) is an open standard from Anthropic, now widely adopted. Azure AI Foundry has native MCP support. Any MCP-compliant server connects directly."

### "What does this cost?"

> "Pricing varies by tier and usage. Core components are Azure AI Foundry (per-token), AI Search (per-index-unit), Blob Storage (per-GB), and your LLM deployment. Demo environment is typically under $50/month."

### "What about the Fabric / claims analytics piece?"

> "Great question — the Fabric Data Agent integration that connects the claims warehouse is in our next sprint. That enables natural-language analytics questions like 'what are our top denial codes in orthopedics?' directly over the claims lakehouse, without moving data."

---

## Screenshot Placeholder Notes

The following screenshots should be captured from a running demo environment and inserted at the marked locations above:

| # | What to Capture | Location in Script |
|---|---|---|
| 1 | Provider response with citation panel showing `ai-search-providers` | 3-min Hit 1 / Act 2 |
| 2 | Formulary response with tier + prior auth status | 3-min Hit 2 / Act 4 |
| 3 | OOP max response with blob storage citation | 3-min Hit 3 |
| 4 | Prior auth response with two citations (MCP + blob) | Act 3 |
| 5 | Formulary multi-source response (tier, PA, alternatives) | Act 4 |
| 6 | Multi-source response with two citation types | Act 5 |
| 7 | Trace panel open — retrieval steps, reranker scores, source names | Act 6 |
| 8 | Knowledge Base setup screen — three active sources (Blob, AI Search ×2, MCP) | Architecture slide |

> **Note:** Screenshot #8 shows three active sources, not four — Fabric is blocked. Update caption accordingly.

> **Tip for capturing screenshots:** Enable **Citations** panel before any response screenshot. Enable **Trace** for the audit slide. Browser zoom 90% for cleaner slides.

---

## Fallback Procedures

*Run through these before the demo. If a smoke test fails, use the matching fallback.*

### Fallback A — Agent returns "I wasn't able to find information"

1. Check index status: in Foundry → Build → Knowledge → `payor-knowledge-base` → Sources → look for error icons
2. If index shows pending/error: wait 5–10 min, then retry. Indexing can take up to 15 min after a change.
3. If still failing: open a fresh Playground session and clear conversation history (residual context can confuse retrieval).
4. **Live fallback:** If one prompt fails during the demo, move to the next prompt — don't linger. Say: *"Let me show you a different query while that catches up."*

### Fallback B — No citations appear

1. Verify Citations toggle is enabled — upper-right corner of Playground.
2. If toggle is on but no citations: the agent system prompt may not be requesting citations. Check `agent/system-prompt.md` — it must include citation instructions.
3. **Live fallback:** Open Trace instead — it shows source documents even when citations are suppressed. Say: *"Let me show you the full retrieval trace — you can see exactly which documents it pulled."*

### Fallback C — MCP tool calls fail (prior auth / eligibility prompts return nothing)

1. Check MCP server health: navigate to the Container Apps URL + `/health` — should return HTTP 200.
2. If unhealthy: check Container Apps logs in Azure Portal → `ca-healthbridge-mcp` → Log stream.
3. **Live fallback:** Skip Act 3 (MRI prior auth). Pivot to: *"The MCP source connects live operational data — prior auth status, eligibility. We're keeping that for a follow-up. Let me show you the formulary and benefits instead."* Then go directly to Act 4.

### Fallback D — AI Search returns empty results

1. Confirm indexes exist: Azure Portal → `srch-healthbridge-demo` → Indexes — should show `healthbridge-formulary-index` and `healthbridge-provider-index` with document counts > 0.
2. If document count is 0: re-upload sample data and re-run the indexer from the Azure Portal.
3. **Live fallback:** If provider or formulary prompts fail, pivot to the OOP max / benefits summary prompt (Blob Storage) — this is independent of AI Search and should still work.

### Fallback E — Slow response / timeout during demo

1. First response in a session is often slower (cold start). Run S1 smoke test before the audience arrives to warm up.
2. If a response takes >15 seconds: narrate while waiting — talk about how the agent is querying across sources. This is normal "look ma, no SQL" time.
3. **Hard timeout (>30 sec):** Press Stop, say *"Let me try a slightly different phrasing"*, retype the same prompt. Sometimes rephrasing breaks a stuck query.

---

## Common Setup Issues

| Symptom | Likely Cause | Fix |
|---|---|---|
| Agent returns "I wasn't able to find information" | KB not indexed yet or MCP unreachable | See Fallback A / C above |
| No citations appear | Citations toggle off or system prompt missing citation instruction | See Fallback B above |
| Provider/formulary queries return nothing | AI Search index empty or indexer didn't run | See Fallback D above |
| MCP tool calls fail | MCP Container App unhealthy | See Fallback C above |
| Blob responses are generic | Wrong container name in connection | Confirm connection points to `healthcare-docs` container |
| Can't sign in to ai.azure.com | Wrong tenant / session | Clear cookies, use InPrivate window, sign in with demo account |
| Fabric prompt attempted by mistake | Presenter followed old demo-flow.md script | Skip immediately: *"That source is coming in the next sprint."* |

---

*Demo Script version: 1.1 | Updated: 2026-07-09 | Issue: #10 | New Azure AI Foundry (ai.azure.com) only*
