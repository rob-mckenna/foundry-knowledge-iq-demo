# Demo Script & Presenter Notes — HealthBridge Knowledge IQ

**Product:** Knowledge IQ in Azure AI Foundry  
**Audience:** Healthcare payor — IT leadership, operations, medical management  
**Brand:** HealthBridge Insurance Plan  
**Presenter Role:** Microsoft seller delivering consultative demo  
**Total Duration:** 5 minutes (live demo) + 2–3 minutes (close + Q&A)

---

## PRESENTER PRE-DEMO CHECKLIST

### 15 Minutes Before Demo Starts

1. **Verify infrastructure is live** (see `docs/demo-readiness-checklist.md` Part I & II):
   - [ ] Azure AI Foundry project (`proj-healthbridge`) accessible at ai.azure.com
   - [ ] MCP server health check passes (should respond in < 2 seconds)
   - [ ] Knowledge Base (`payor-knowledge-base`) status = **Ready**
   - [ ] Agent (`healthbridge-assistant`) deployed and responsive

2. **Have these open:**
   - **Tab 1:** Azure AI Foundry → healthbridge-assistant → Playground (with **Citations** enabled)
   - **Tab 2:** Backup slide deck / architecture diagram (fallback for live demo failure)
   - **Tab 3:** `docs/demo-readiness-checklist.md` (emergency procedures reference)

3. **Configure Playground:**
   - [ ] **Citations** panel: **enabled** (upper-right toggle)
   - [ ] **Trace** view: closed but available (open during Q&A if asked)
   - [ ] Browser zoom: **90%** (readable demo)
   - [ ] Clear previous messages (start with fresh playground)

4. **Internalize the member story:**
   > **Sarah Nguyen** (MBR-2024-002891, HMO Silver) — just had knee replacement surgery (April 28th). Claim: $18,200 allowed, she owes $6,510 ($1,500 ded + $5,010 coinsurance @ 30%). Questions: (1) Am I still eligible? (2) Why do I owe $6,510? (3) Do I need approval for PT? (4) What will celecoxib cost? (5) Where can I find a PT? Her PCP: Dr. Patricia M. Chen (in-network). **This narrative links all 5 Acts and all 4 data sources.**

---

# LIVE DEMO SCRIPT: "The Sarah Nguyen Story"

**Tone:** Consultative, confident, payor-literate. You are solving a real problem your customer faces daily.

---

## OPENING (45 seconds)

### What You Say

> "Today I want to show you something that normally takes your care coordinators about 15 minutes to answer — but it takes us about three minutes."
>
> "Sarah Nguyen is a member who just had knee surgery. She's got questions about her bill, her coverage, her medications, and where to get physical therapy. She's calling in, or going to your member portal."
>
> "Answering all of her questions — across four different knowledge sources, zero ETL — is what I want to show you right now. We're using Azure AI Foundry's Knowledge IQ to connect your data where it sits."

### What Audience Sees

- Foundry playground visible on screen, blank/ready
- Your credentials/member photo slide (optional — humanizes the scenario)

### Transition Cue

> "Let's start with the first question every member asks: Am I still covered?"

---

## ACT 1: ELIGIBILITY CHECK (45 seconds)

**Data Sources:** Fabric Data Agent (live member records)  
**Timing:** 0:45 – 1:30  
**Primary talking point:** Real-time eligibility without manual lookup

### The Prompt (Type/Paste This)

```
Hi, I'm Sarah Nguyen. My member ID is MBR-2024-002891. 
I just want to make sure I'm still covered before I book a follow-up appointment.
```

### What You Say While Waiting

> "This is hitting our member data in real time. The agent is calling the Fabric Data Agent — our analytics warehouse — looking up Sarah's eligibility status, her plan, her deductible."

### Expected Response Summary

Agent should return:
- ✅ **Status:** ACTIVE
- ✅ **Plan:** HealthBridge HMO Silver
- ✅ **Deductible:** $1,500 (or "fully met" if already satisfied)
- ✅ **Primary Care Physician:** Dr. Patricia M. Chen
- ✅ **Citation:** Fabric Data Agent

### What You Say When Response Appears

> "Done in seconds. Sarah is active on HMO Silver. Her PCP is Dr. Chen. And notice — every fact has a citation. We're not guessing; we're pulling from her enrollment record."
>
> "This is the first question your call center answers manually every single day. Now it's instant, accurate, and auditable."

### Transition Cue

> "Next question: Sarah got her surgical bill. She's confused about the numbers. Let's explain her EOB."

---

## ACT 2: EOB EXPLANATION (60 seconds)

**Data Sources:** Fabric Data Agent (claims + adjudication)  
**Timing:** 1:30 – 2:30  
**Primary talking point:** Claims explanation in plain language

### The Prompt (Type/Paste This)

```
I had my right knee replacement on April 28th. I got an EOB in the mail 
but I don't understand the numbers. It says I owe $6,510 — is that right?
```

### What You Say While Waiting

> "Now the agent is looking up her claim from the surgery. It's going to pull the billed amount, the allowed amount, what's been paid, and what Sarah owes — the thing that drives your call center crazy."

### Expected Response Summary

Agent should return:
- ✅ **Service Date:** April 28, 2026
- ✅ **Billed Amount:** $32,000 (or similar)
- ✅ **Allowed Amount:** $18,200
- ✅ **Deductible:** $1,500 (fully applied)
- ✅ **Coinsurance:** 30% of remaining = $5,010
- ✅ **Total Patient Responsibility:** $6,510
- ✅ **Citation:** Fabric Data Agent (claim CLM-2026-0061872)

### What You Say When Response Appears

> "Okay, so the hospital billed $32,000, but the allowed amount is $18,200. Out of that, Sarah's HMO Silver plan covers 70% after the deductible. So: $1,500 deductible, then 30% of the remaining $16,700 — that's $5,010. Total she owes: $6,510. The math is right."
>
> "More importantly, the agent just turned a 12-minute call into a 60-second text. Your coordinator can send this to Sarah instantly, with the full math. She sees it, understands it, and moves on. Your hold time drops. Your member satisfaction goes up."

### Transition Cue

> "Sarah's recovering now. Her surgeon wants to start physical therapy three times a week. But does that need approval?"

---

## ACT 3: PRIOR AUTHORIZATION POLICY (60 seconds)

**Data Sources:** MCP Server (prior auth policies) + Blob Storage (policy documents)  
**Timing:** 2:30 – 3:30  
**Primary talking point:** Live policy lookup + clinical policy context

### The Prompt (Type/Paste This)

```
My surgeon wants me to start physical therapy three times a week. 
Do I need prior authorization for that, and what happens if I exceed the limit?
```

### What You Say While Waiting

> "This question touches two sources: the MCP server — which has our real-time prior auth requirements — and the policy documents in Blob Storage. Let's see what the policy says."

### Expected Response Summary

Agent should return:
- ✅ **PA for PT Visits 1–20:** Not required
- ✅ **PA for PT Visits 21+:** Required
- ✅ **How PA is submitted:** Ordering provider submits; 3 business day turnaround
- ✅ **For Sarah's scenario:** Proactively notes she will likely exceed 20 visits post-op; explains when/how PA will be needed
- ✅ **Citations:** MCP Server + policy document from Blob Storage

### What You Say When Response Appears

> "Here's what I love about this: the agent didn't just say 'PA required' — it said PA is not required for the first 20 visits, but will be required after. It looked at Sarah's post-surgical recovery needs and told her, 'Hey, you're going to need that PA in week four.' That's knowledge, not just data."
>
> "The first 20 visits — covered. Her PT provider submits the PA in week four for visits 21+. Three business days to approval. Sarah knows exactly what to expect."

### Transition Cue

> "Speaking of medication — Sarah's surgeon prescribed celecoxib for pain. Let's check the formulary coverage and cost."

---

## ACT 4: FORMULARY & PHARMACY TIER (45 seconds)

**Data Sources:** Azure AI Search (formulary index)  
**Timing:** 3:30 – 4:15  
**Primary talking point:** Instant drug tier + coverage lookup

### The Prompt (Type/Paste This)

```
My doctor prescribed celecoxib for pain after surgery. 
What tier is it on the formulary, and what will I pay?
```

### What You Say While Waiting

> "Azure AI Search is indexing our formulary — hundreds of drugs, tiers, PA requirements, quantity limits. This is a semantic search, so even if the doctor said 'generic naproxen alternative,' the agent would find celecoxib."

### Expected Response Summary

Agent should return:
- ✅ **Drug:** Celecoxib
- ✅ **Tier:** Tier 2
- ✅ **Prior Auth:** Not required
- ✅ **Copay:** $45 retail per 30-day supply / $110 mail order per 90-day supply
- ✅ **Quantity Limit:** None or standard daily limit
- ✅ **Note:** Deductible already met, so copay only applies
- ✅ **Citation:** AI Search formulary index

### What You Say When Response Appears

> "Tier 2 — that's $45 retail per 30-day supply, or $110 if she does mail order for 90 days, which is way cheaper for a long-term medication post-surgery. No PA required. Copay applies since her deductible is already met from the surgery. Instant answer. Your pharmacy call volume drops again."

### Transition Cue

> "Last question: Sarah needs physical therapy. Where can she find a PT in-network near her home?"

---

## ACT 5: PROVIDER NETWORK SEARCH (60 seconds)

**Data Sources:** Azure AI Search (provider directory)  
**Timing:** 4:15 – 5:15  
**Primary talking point:** Semantic provider search + network verification

### The Prompt (Type/Paste This)

```
Can you help me find a physical therapist near Naperville, Illinois 
who is in-network and accepting new patients?
```

### What You Say While Waiting

> "This is AI Search again, but on the provider directory index. Semantic search means the agent understands 'physical therapist,' 'PT,' 'rehabilitation specialist' — and 'Naperville,' 'near me,' 'ZIP code area' — all as equivalent."

### Expected Response Summary

Agent should return:
- ✅ **At least one provider:** Midwest Physical & Occupational Therapy LLC (example)
- ✅ **Location:** Naperville, IL (or nearby)
- ✅ **Network Status:** In-network
- ✅ **Accepting New Patients:** Yes
- ✅ **Phone & Hours:** (if available in index)
- ✅ **Helpful note:** "As an HMO member, you'll need a referral from Dr. Chen before your first visit"
- ✅ **Citation:** AI Search provider directory

### What You Say When Response Appears

> "Midwest PT in Naperville. In-network. Taking new patients. Here's her number."
>
> "Notice the agent also reminded Sarah — because she's HMO Silver — that she needs a referral from her PCP first. That's intelligence, not just retrieval. The agent knows the plan rules and the member's specific scenario."

### Transition Cue to Close

> "We just answered five questions in about five minutes. Let me show you what happened behind the scenes."

---

## OPTIONAL: TRACE VIEW (Advanced, for technical audience) — 30 seconds

**Do this only if audience asks "how does the Knowledge Base actually work?"**

Click the **Trace** icon on any previous response.

### What You Say

> "When Sarah asked her question, here's what happened: The agent rewrote her question into structured queries. It fanned out to all four sources simultaneously — Fabric, MCP, AI Search, Blob — and retrieved the relevant chunks. The semantic reranker scored each chunk for relevance. You see the score here — 0.87 means we were 87% confident that chunk was relevant. The agent then composed the answer grounded only in the highest-scoring chunks."
>
> "Every step is logged. Every source is traceable. For a healthcare payor, that's not a feature — that's a compliance requirement."

---

## CLOSE: BUSINESS VALUE SUMMARY (2–3 minutes)

### What You Say (Confident, direct, payor-focused)

> "Let me connect what you just saw to your business."
>
> **[TALKING POINT 1 — Speed]**
> "Your call center handles about 200 member calls per day. Twenty-five percent of those calls are 'I don't understand my bill' or 'What's my deductible' or 'Is this covered?' Sarah's questions took three minutes to resolve here. In your call center today, that's one agent for 12–15 minutes. Multiply that by 50 calls per day. That's 6–8 hours of agent time per day. Knowledge IQ doesn't eliminate those calls, but it gives your coordinators instant, accurate answers to provide — and many members solve it self-service from the portal."
>
> **[TALKING POINT 2 — Trust & Compliance]**
> "Every answer is cited. Every citation points to a specific document or data record — the formulary index, the policy PDF, the claims adjudication record. When a member appeals, or your compliance team audits, you have full provenance. That's audit-ready from day one."
>
> **[TALKING POINT 3 — No Data Migration]**
> "You didn't have to copy your claims data into Azure. It's still in your Fabric lakehouse. Your policies are still in your document store. Your formulary is still in your search index. The Knowledge Base connects to them. Your data governance, your access controls, your compliance framework — all still apply. Nothing moved."
>
> **[TALKING POINT 4 — Extensibility]**
> "Tomorrow, if you want to add your provider credentialing system, or your quality scorecards, or your analytics warehouse — you add another MCP endpoint or search index. You don't rebuild the agent. The Knowledge Base grows as your architecture grows."
>
> **[TALKING POINT 5 — The Real Win]**
> "But here's what matters most: your members get faster, more accurate answers. Your coordinators stop context-switching across three systems. Your compliance team gets audit trails. Your IT team didn't have to migrate anything. That's Knowledge IQ."

### Closing Hook

> "Sarah started confused. She ended with a solution: a referral to a PT in-network, confirmation of her costs, and certainty that her coverage is active. She got all of that in five minutes. That's the member experience you can deliver with Knowledge IQ."

---

## Q&A PREP — Expected Questions & Answers

### Q: "Does this copy our data into Azure?"

**A:** "No. Foundry indexes metadata and connects at query time. The underlying data never moves. It stays in your Search index, your blob container, your Fabric lakehouse, or behind your MCP endpoint. You control access at the source. Your RBAC, your data residency, your encryption — all still in place."

### Q: "What about HIPAA and PHI?"

**A:** "All demo data is synthetic. In production, your existing access controls apply. If a call center rep can't read a member record, the agent can't read it for them. The Knowledge Base inherits the permissions of the underlying sources."

### Q: "Can we connect Epic, Facets, or our claims warehouse?"

**A:** "Any system accessible via MCP, REST API, or exportable to Blob/Search/Fabric can be connected. MCP is an open protocol — if your team can wrap a system in an endpoint, it becomes a Knowledge Base source. We've done this with major payor systems in production."

### Q: "How fresh is the data?"

**A:** "MCP and Fabric Data Agent are real-time. Blob Storage and AI Search refresh on a schedule you define — near-real-time to nightly, depending on your SLA. For member-facing queries, real-time sources (MCP, Fabric) are queried live. For policy documents, you control the refresh."

### Q: "What model is powering this?"

**A:** "The Knowledge Base is model-agnostic. This demo uses GPT-4o, but Foundry supports any deployed model — including models you fine-tune. You're not locked into OpenAI; you can use other models or private models if you prefer."

### Q: "How much does this cost?"

**A:** "Pricing depends on resource tier and usage. Core components: Azure AI Foundry (per-token), AI Search (per-index-unit), Blob Storage (per-GB), and your chosen LLM deployment. For a production environment across all four sources, estimate $500–$2K per month depending on query volume. Demo environment is typically under $50/month."

### Q: "How long to deploy this in production?"

**A:** "Deployment is three phases: (1) Validate your data sources and ensure Foundry can connect to them — 1–2 weeks. (2) Build and test the agent with your system prompts and guardrails — 2–3 weeks. (3) Soft-launch to a pilot group, collect feedback, tune — 2–4 weeks. Total: 6–10 weeks for a production launch. The good news: you're not building new data pipelines; you're connecting existing sources."

### Q: "What if the MCP server times out during the demo?"

**A:** "Good question — that's why we have fallback procedures in the `demo-readiness-checklist.md`. If MCP times out, we skip Act 3 and show the remaining acts through AI Search (formulary, provider) and Blob (policy docs). The core Knowledge IQ story — multiple sources, multiple formats, one agent — is still intact."

---

## FALLBACK PROCEDURES

**If something goes wrong during the demo, reference `docs/demo-readiness-checklist.md` Part V for specific recovery steps.**

### Scenario 1: MCP Server Times Out

- **Quick check:** `curl -v https://ca-mcp-healthbridge.lemoncoast-f3f8df5d.eastus.azurecontainerapps.io/health`
- **If response:**  Continue with Acts 4-5 (formulary + provider search still work)
- **If no response:** Skip to "The Architecture Slide" (see backup)

### Scenario 2: AI Search Returns Empty

- **Quick check:** Manual search in Azure Portal → AI Search → `srch-healthbridge-demo` → Search explorer
- **If manual search works:** Retry the agent prompt (may be a query rewriting issue)
- **If manual search fails:** Show the Knowledge Base configuration diagram; explain: "In production, your indexes would be populated nightly. This demonstrates the architecture."

### Scenario 3: Agent Unavailable

- **Try:** Refresh browser tab, re-open playground
- **If still broken:** Click to **Backup Slide 2 — Full Demo Video** (should be prerecorded and queued)
- **Narrate:** "Here's what that live demo looks like..." and play the video

### Scenario 4: Live Demo Fails Entirely

- **Graceful exit:** "The live environment isn't cooperating today — classic demo gods. But I want to show you the architecture that makes this work." (Click to backup slides)
- **Pivot:** "Let me walk you through how this would work with your data..." and use diagrams + talking points

---

## PRESENTER NOTES — Key Reminders

- **Show citations at least once.** This is the Knowledge IQ differentiator. "Every answer is traceable."
- **Mention the four data sources explicitly:** "Fabric for claims, MCP for policies, AI Search for formulary and providers, Blob for documents — all without ETL."
- **Pause after each response.** Let audience see the citation panel. Read the response aloud if needed — don't rush.
- **Use healthcare payor language:** Don't say "knowledge chunks," say "benefit information." Don't say "retrieval," say "lookup." Don't say "LLM," say "agent" or "assistant."
- **Connect to their pain:** Every Act should reference a real call driver. ("EOB confusion," "prior auth submission," "formulary questions")
- **End strong.** The closing hook is not technical; it's business. Faster answers. Fewer calls. Better compliance. That's why they should care.

---

## APPENDIX: Data Reference for Demo

| Item | Value | Source |
|---|---|---|
| **Member Name** | Sarah L. Nguyen | MCP Server / Fabric |
| **Member ID** | MBR-2024-002891 | Fabric Data Agent |
| **Plan** | HealthBridge HMO Silver | Fabric Data Agent |
| **Status** | ACTIVE | Fabric Data Agent |
| **Deductible** | $1,500 | Blob Storage (benefits doc) |
| **Coinsurance** | 30% | Blob Storage (benefits doc) |
| **OOP Max** | $5,000 | Blob Storage (benefits doc) |
| **PCP** | Dr. Patricia M. Chen (NPI 1234567890) | Fabric Data Agent |
| **Claim ID** | CLM-2026-0061872 | Fabric Data Agent |
| **Service** | Total knee replacement (TKA) | Fabric Data Agent |
| **DOS** | 2026-04-28 | Fabric Data Agent |
| **Billed** | $32,000 | Fabric Data Agent |
| **Allowed** | $18,200 | Fabric Data Agent |
| **Patient Resp** | $6,510 | Fabric Data Agent (calculated) |
| **Prior Auth** | PA-2026-087341 | Claim record |
| **PT Policy** | No PA ≤ 20 visits; PA > 20 visits | MCP Server / policy doc |
| **Drug** | Celecoxib | AI Search formulary |
| **Tier** | Tier 2 | AI Search formulary |
| **Copay** | $45 retail per 30-day / $110 mail per 90-day | Blob benefit doc |
| **PT Provider Name** | Midwest Physical & Occupational Therapy LLC | AI Search provider index |
| **PT Location** | Naperville, IL (ZIP 60540) | AI Search provider index |
| **PT Network Status** | ACTIVE_IN_NETWORK | AI Search provider index |
| **PT Accepting New** | Yes | AI Search provider index |

---

**Demo Script version: 2.0 | Finalized: 2026-07-09 | Presenter-ready with full fallback procedures**
