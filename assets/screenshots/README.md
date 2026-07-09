# Screenshot Capture Guide — HealthBridge Knowledge IQ Demo

**8 screenshots required.** Capture from a live `proj-healthbridge` environment at [ai.azure.com](https://ai.azure.com).

## Before You Start

- Browser zoom: **90%** (cleaner for slides)
- **Citations panel ON** for all response screenshots (toggle in Playground upper-right)
- **Dark/Light mode:** Use whatever your slide deck uses — just be consistent
- Recommended resolution: 1920×1080 or Retina equivalent
- Format: **PNG**, named exactly as listed below

---

## Screenshot 1 — Provider response with citation

| Field | Value |
|-------|-------|
| **File name** | `01-provider-dr-chen.png` |
| **Demo location** | 3-Minute Version, Hit 1 / 10-Minute Version, Act 2 |
| **Prompt to run** | `Is Dr. Patricia Chen an in-network provider for my plan?` |
| **What to capture** | Full Playground window: response text + Citations panel expanded, showing source `ai-search-providers` |
| **Key elements visible** | Tier 1 Preferred, specialty, location, accepting new patients, NPI; citation badge visible |

---

## Screenshot 2 — Formulary response (tier + PA status)

| Field | Value |
|-------|-------|
| **File name** | `02-formulary-ozempic.png` |
| **Demo location** | 3-Minute Version, Hit 2 / 10-Minute Version, Act 4 |
| **Prompt to run** | `Is Ozempic covered on my formulary, and is prior authorization required?` |
| **What to capture** | Full Playground window: response text + Citations panel showing `ai-search-formulary` |
| **Key elements visible** | Tier 4 Specialty, "prior authorization required", step therapy note; citation source name visible |

---

## Screenshot 3 — Out-of-pocket max from Blob Storage

| Field | Value |
|-------|-------|
| **File name** | `03-oop-max-ppo-gold.png` |
| **Demo location** | 3-Minute Version, Hit 3 |
| **Prompt to run** | `What is the out-of-pocket maximum for the PPO Gold plan this year?` |
| **What to capture** | Full Playground window: response text + Citations panel showing a Blob Storage document source (e.g. `ppo-gold-summary-of-benefits.pdf` or similar) |
| **Key elements visible** | Individual OOP figure, family OOP figure, citation points to a PDF in Blob Storage |

---

## Screenshot 4 — Prior auth response with two citations (MCP + Blob)

| Field | Value |
|-------|-------|
| **File name** | `04-prior-auth-mri-knee.png` |
| **Demo location** | 10-Minute Version, Act 3 |
| **Prompt to run** | `Marcus has been referred for an MRI of his knee. Does he need prior authorization, and who submits the request?` |
| **What to capture** | Full Playground window: response text + Citations panel showing **two** source types — one MCP citation and one Blob Storage citation |
| **Key elements visible** | "PA required", CPT 73721, ordering provider submits; two distinct citation badges visible |

---

## Screenshot 5 — Formulary with alternatives (multi-source)

| Field | Value |
|-------|-------|
| **File name** | `05-formulary-ozempic-alternatives.png` |
| **Demo location** | 10-Minute Version, Act 4 |
| **Prompt to run** | `Marcus is taking Ozempic for Type 2 diabetes. What tier is it on the formulary, and is there a preferred alternative?` |
| **What to capture** | Full Playground window: response text listing tier, PA status, and preferred alternatives; Citations panel visible |
| **Key elements visible** | Tier 4, "prior auth required", preferred alternative drugs named; citation source visible |

---

## Screenshot 6 — Multi-source response (lumbar surgery + OOP)

| Field | Value |
|-------|-------|
| **File name** | `06-lumbar-surgery-coverage.png` |
| **Demo location** | 10-Minute Version, Act 5 |
| **Prompt to run** | `If Marcus needs lumbar fusion surgery, what are the coverage criteria, and what is his out-of-pocket exposure on the PPO Gold plan?` |
| **What to capture** | Full Playground window: response text + Citations panel showing **two** citation types — one from clinical policy (AI Search), one from benefits PDF (Blob Storage) |
| **Key elements visible** | Coverage criteria listed, OOP dollar amounts present, two different source types in citations panel |

---

## Screenshot 7 — Trace panel (retrieval steps + reranker scores)

| Field | Value |
|-------|-------|
| **File name** | `07-trace-panel-retrieval.png` |
| **Demo location** | 10-Minute Version, Act 6 |
| **How to capture** | Click the **Trace** icon on any multi-source response (Act 3 or Act 5 responses work best) |
| **What to capture** | Trace panel open, showing: query rewrite step, retrieval from multiple sources, reranker scores, source document names |
| **Key elements visible** | At least 2 sources in retrieval list, reranker scores visible (decimals), source names legible |

---

## Screenshot 8 — Knowledge Base setup screen (all sources connected)

| Field | Value |
|-------|-------|
| **File name** | `08-knowledge-base-sources.png` |
| **Demo location** | Architecture slide (Act 7 / closing) |
| **How to capture** | Navigate to **Knowledge IQ → healthbridge-knowledge-base → Data sources tab** |
| **What to capture** | The data sources list showing all four connections: Blob Storage, AI Search ×2 (formulary + provider), MCP Server; status indicators green |
| **Key elements visible** | All four source tiles/rows visible, connection names legible, status shows connected/indexed |

---

## Naming & Placement

Save all 8 PNGs in this directory (`assets/screenshots/`). Reference them in slide decks by relative path or embed directly.

```
assets/screenshots/
  01-provider-dr-chen.png
  02-formulary-ozempic.png
  03-oop-max-ppo-gold.png
  04-prior-auth-mri-knee.png
  05-formulary-ozempic-alternatives.png
  06-lumbar-surgery-coverage.png
  07-trace-panel-retrieval.png
  08-knowledge-base-sources.png
```

## Mapping to demo-script.md

| Script screenshot marker | File |
|---|---|
| Act 2 / Hit 1 — provider + citation | `01-provider-dr-chen.png` |
| Act 4 / Hit 2 — formulary | `02-formulary-ozempic.png` |
| Hit 3 — OOP max | `03-oop-max-ppo-gold.png` |
| Act 3 — prior auth two citations | `04-prior-auth-mri-knee.png` |
| Act 4 — formulary + alternatives | `05-formulary-ozempic-alternatives.png` |
| Act 5 — multi-source coverage | `06-lumbar-surgery-coverage.png` |
| Act 6 — trace panel | `07-trace-panel-retrieval.png` |
| Architecture slide | `08-knowledge-base-sources.png` |

---

*Capture guide version: 1.0 · Issue: #8 · Owner: Presenter (captured) / Mouth (guide)*
