# Presenter Quick-Reference Card — HealthBridge Knowledge IQ

**Demo:** Knowledge IQ in Azure AI Foundry | **Member:** Marcus Hartwell · MBR-2024-001234 · PPO Gold

---

## Pre-Flight (do before anyone walks in)

- [ ] Signed in to [ai.azure.com](https://ai.azure.com) → `proj-healthbridge`
- [ ] `healthbridge-assistant` open in **Playground** tab
- [ ] **Citations** panel ON (toggle upper-right)
- [ ] **Trace** panel closed (open only when you want to show it)
- [ ] Browser zoom at **90%**
- [ ] This card open on a second screen or printed

---

## 3-Minute Version — Copy-Paste Prompts

Run in order. Each should respond in < 10 seconds.

```
Is Dr. Patricia Chen an in-network provider for my plan?
```
> Say: "Provider directory — AI Search index."
> Callout: Tier 1, specialty, NPI, accepting new patients, citation visible.

```
Is Ozempic covered on my formulary, and is prior authorization required?
```
> Say: "Formulary — different AI Search index."
> Callout: Tier 4 Specialty, PA required, step therapy.

```
What is the out-of-pocket maximum for the PPO Gold plan this year?
```
> Say: "PDF in Blob Storage — zero preprocessing."
> Callout: Individual + family OOP, citation points to PDF.

**Close:** *"Three sources. Three formats. One agent. That's Knowledge IQ."*

---

## 10-Minute Version — The Marcus Hartwell Story

### Member Context (say at top)
> "Marcus Hartwell, 42, PPO Gold. Referred for a knee MRI, possibly lumbar surgery.
> Also on Ozempic for Type 2 diabetes. Four questions, three minutes."

---

**Act 2 — Is Dr. Chen in-network?** *(AI Search)*
```
Is Dr. Patricia Chen an in-network provider for my plan?
```
> Say while waiting: "Hitting the provider directory — AI Search."
> Callout: Tier 1 Preferred, 1450 Medical Center Drive, accepting new patients, NPI.
> 📸 Screenshot 1

---

**Act 3 — Does the MRI need prior auth?** *(MCP + Blob)*
```
Marcus has been referred for an MRI of his knee.
Does he need prior authorization, and who submits the request?
```
> Say while waiting: "Two sources — MCP server (live PA system) + policy PDF in Blob."
> Callout: PA required, CPT 73721, ordering provider submits, two citation badges.
> 📸 Screenshot 4

---

**Act 4 — Ozempic formulary** *(AI Search)*
```
Marcus is taking Ozempic for Type 2 diabetes.
What tier is it on the formulary, and is there a preferred alternative?
```
> Say while waiting: "Formulary index — vector + semantic search."
> Callout: Tier 4, PA required, preferred alternatives listed.
> 📸 Screenshot 5

---

**Act 5 — Lumbar surgery coverage + OOP** *(AI Search + Blob)*
```
If Marcus needs lumbar fusion surgery, what are the coverage criteria,
and what is his out-of-pocket exposure on the PPO Gold plan?
```
> Callout: Clinical criteria (AI Search) + OOP from benefits PDF (Blob), two citation types.
> 📸 Screenshot 6

---

**Act 6 — Show the Trace** *(click Trace icon on any prior response)*
> Open Trace on the lumbar surgery response.
> Point to: query rewrite → retrieval from multiple sources → reranker scores → source names.
> Say: "Every step is logged and auditable. That's a compliance requirement."
> 📸 Screenshot 7

---

**Act 7 — Architecture wrap-up**
> Navigate to KB → Data sources tab. Show all four sources connected and green.
> Say: "Four sources. Zero ETL. Your team can add a fifth tomorrow without touching the agent."
> 📸 Screenshot 8

---

**Close:**
> "Marcus got answers to all four questions in about three minutes.
> Every answer is traceable to a source. Your coordinators are faster.
> Your compliance team has provenance. Your IT team moved no data.
> That's Knowledge IQ."

---

## Key Q&A — One-Line Answers

| Question | Answer |
|----------|--------|
| Does it copy our data? | No. Foundry connects at query time. Data stays in place. |
| HIPAA / PHI? | Demo data is synthetic. In production, your existing RBAC and residency apply. |
| Can we connect Epic / Facets? | Yes — via MCP, REST, or export to Blob/Search/Fabric. |
| How fresh is the data? | MCP and Fabric are real-time. Blob + Search on your schedule. |
| What model? | GPT-4o. Knowledge Base is model-agnostic. |
| What does it cost? | Typically under $50/month for a demo environment. |

---

## If Something Breaks

| Symptom | Quick Fix |
|---------|-----------|
| "I wasn't able to find information" | KB still indexing — wait 5 min, re-run |
| No citations visible | Citations toggle is OFF — enable upper-right |
| MCP calls failing | MCP Container App health check at its `/health` endpoint |
| Formulary/Provider returns nothing | AI Search indexer may not have run — check portal |
| Blob responses generic | Confirm connection points to `healthcare-docs` container |

---

## Fabric-Dependent Prompts ⚠️

> **Skip these until Fabric connection is live:**
> - "Top five denial reason codes for PPO plan in orthopedics over last 12 months"
> - "In-network orthopedic surgeon near ZIP 98101 with quality score above 85"
>
> If asked: *"That's a great use case — the Fabric Data Agent source enables exactly that.
> We're finishing the connection and can demo it in a follow-up."*

---

*Version: 1.0 · Issue: #8 · Created: 2026-07-09*
