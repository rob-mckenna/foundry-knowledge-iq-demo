# Presenter Quick-Reference Card — HealthBridge Knowledge IQ

**Demo:** Knowledge IQ in Azure AI Foundry | **Member:** Sarah Nguyen · MBR-2024-002891 · HMO Silver

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

## 10-Minute Version — The Sarah Nguyen Story

### Member Context (say at top)
> "Sarah Nguyen, post-knee surgery. Just had TKA on April 28th. Confused about her bill.
> Questions about PT approval, medication cost, finding a PT provider. Five questions, five minutes."

---

**Act 2 — Is Dr. Chen in-network?** *(AI Search)*
```
Is Dr. Patricia Chen an in-network provider for my plan?
```
> Say while waiting: "Hitting the provider directory — AI Search."
> Callout: Tier 1 Preferred, Internal Medicine, Chicago IL, accepting new patients, NPI.
> 📸 Screenshot 1

---

**Act 3 — Does PT need prior auth?** *(MCP + Blob)*
```
My surgeon wants me to start physical therapy three times a week.
Does she need prior authorization?
```
> Say while waiting: "Two sources — MCP server (live PA policy) + policy PDF in Blob."
> Callout: PA not required first 20 visits, required after; two citation badges.
> 📸 Screenshot 4

---

**Act 4 — Celecoxib formulary** *(AI Search)*
```
My doctor prescribed celecoxib for pain after surgery.
What tier is it on the formulary?
```
> Say while waiting: "Formulary index — vector + semantic search."
> Callout: Tier 1, no PA, copay only.
> 📸 Screenshot 5

---

**Act 5 — Find PT provider** *(AI Search)*
```
Can you help me find a physical therapist near Naperville who's in-network
and accepting new patients?
```
> Callout: Midwest PT, Naperville IL, in-network, accepting, plus HMO referral requirement from Dr. Chen.
> 📸 Screenshot 6

---

**Act 6 — Show the Trace** *(click Trace icon on any prior response)*
> Open Trace on the PT provider response.
> Point to: query rewrite → retrieval from multiple sources → reranker scores → source names.
> Say: "Every step is logged and auditable. That's a compliance requirement."
> 📸 Screenshot 7

---

**Act 7 — Architecture wrap-up**
> Navigate to KB → Data sources tab. Show all four sources connected and green.
> Say: "Four sources. Zero ETL. Sarah got all her questions answered in five minutes."
> 📸 Screenshot 8

---

**Close:**
> "Sarah started confused about a \$3,654 bill and ended it with a PT referral, confirmed prescription cost,
> and a plan for recovery—all without holding for a rep.
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
