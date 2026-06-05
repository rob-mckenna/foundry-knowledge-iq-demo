# Demo Flow — Knowledge IQ in Azure AI Foundry
### Audience: Healthcare Payor (Health Insurance) — Technical & Business Decision Makers
### Duration: ~45 minutes

---

## The Story We're Telling

> *"Your organization already has the knowledge — in your claims systems, your policy documents, your provider directories, your analytics platform. Knowledge IQ in Azure AI Foundry brings it all together into a single, governed, AI-queryable Knowledge Base. You stop copying data and start connecting it."*

The demo moves from **breadth** (look how many sources we can connect) to **depth** (watch it answer a real question that would otherwise take three systems and two phone calls).

---

## Act 1 — The Problem (5 min)

**What to say:**
> Healthcare payors sit on enormous amounts of knowledge — but it's fragmented. Claims data lives in one system, medical policies in SharePoint, provider directories in a portal, analytics in a data warehouse. When a care manager needs to answer "is this prior auth approvable?", they context-switch across four tools.

**What to show:**
- A mock screenshot or whiteboard of the fragmented landscape (optional)
- The Knowledge IQ concept slide: one Knowledge Base, many sources

**Audience takeaway:** This problem is real and familiar. The audience has felt this pain.

---

## Act 2 — Building the Knowledge Base (15 min)

### 2a — Open Azure AI Foundry → Knowledge IQ

Navigate to **Knowledge IQ** in the new Azure AI Foundry (not Azure AI Studio). Create a new Knowledge Base named `payor-knowledge-base`.

**Talking point:** This is the new Foundry — unified AI development, not the classic Studio experience.

### 2b — Add Azure Blob Storage (3 min)

Connect the `knowledge-iq-demo` Blob Storage container. Point to the `benefits-summaries/` and `provider-directories/` folders.

> "These are the documents your member services team already has — PDFs, Word docs, text files. No reformatting required."

### 2c — Add Azure AI Search (3 min)

Connect the pre-built AI Search index containing clinical guidelines and medical policies.

> "Your compliance and medical management team owns these policies. They already live in Search — we're just connecting the Knowledge Base to them."

### 2d — Add Fabric Data Agent (4 min)

Connect the Fabric Data Agent endpoint over the claims and member analytics lakehouse.

> "This is your structured data — claims history, utilization, member cohorts. The Fabric Data Agent lets the Knowledge Base ask it questions in natural language without moving the data."

### 2e — Add MCP Server (3 min)

Connect the MCP server endpoint serving live eligibility, PA status, and formulary lookups.

> "This is your operational data — real-time eligibility checks, live PA status. MCP is an open protocol; any system your team can wrap in an API can become a Knowledge Base source."

**Audience takeaway:** Four fundamentally different data types, connected in minutes, without ETL.

---

## Act 3 — The Agent in Action (20 min)

### 3a — Deploy the Prompt Agent

Open the **Agents** section of Foundry. Import `agent/agent-definition.json`. Connect it to `payor-knowledge-base`. Deploy.

**Talking point:** The agent's system prompt scopes it to payor workflows. It cites sources on every answer.

### 3b — Demo Prompt Sequence

Run these prompts in order. Each one is designed to visibly pull from a different source combination.

---

**Prompt 1 — Eligibility + Benefits** *(Blob Storage + MCP Server)*
> "Is member M-10042 currently eligible, and what is their deductible status for the current plan year?"

*What it shows:* Real-time eligibility from MCP crossed with benefits summary from Blob Storage.

---

**Prompt 2 — Prior Authorization** *(MCP Server + AI Search)*
> "Member M-10042 has been referred for lumbar fusion surgery (CPT 22612). What are the prior authorization criteria, and is there an open PA request?"

*What it shows:* Live PA lookup from MCP grounded against clinical criteria from AI Search. This is the "wow moment" — the agent pulls the policy text and the live status in one response.

---

**Prompt 3 — Formulary + Step Therapy** *(MCP Server + AI Search)*
> "The member's physician wants to prescribe Humira for rheumatoid arthritis. What tier is it on the formulary, and is step therapy required before approval?"

*What it shows:* Formulary data from MCP, step therapy policy from AI Search medical policies.

---

**Prompt 4 — Claims Analytics** *(Fabric Data Agent)*
> "What are the top five denial reason codes for our PPO plan members in the orthopedics specialty over the last 12 months?"

*What it shows:* Fabric Data Agent answering an analytics question in natural language — no SQL, no dashboard navigation.

---

**Prompt 5 — Provider Network** *(Blob Storage + Fabric Data Agent)*
> "I need an in-network orthopedic surgeon near ZIP code 98101 who has a quality score above 85."

*What it shows:* Provider directory from Blob Storage combined with quality scores from Fabric analytics.

---

### 3c — Show Source Citations

For at least one response, expand the **source citations** panel to show which document or data source each fact came from.

**Talking point:** Every answer is traceable. This matters for compliance, audit, and member appeals.

---

## Act 4 — Governance & Next Steps (5 min)

**What to cover:**
- Access control: the Knowledge Base respects the permissions of the underlying sources
- No data duplication: Foundry connects to sources; it does not copy them
- Extensibility: any new data source (new MCP server, new blob container) can be added without rebuilding the agent

**Closing line:**
> "You already have the knowledge. Knowledge IQ just makes it answerable."

---

## Anticipated Questions

| Question | Answer |
|----------|--------|
| "Does it copy our data into Azure?" | No. Foundry indexes metadata and connects at query time. Data stays in source systems. |
| "What about PHI?" | All demo data is fully synthetic. In production, your existing data residency and access controls apply. |
| "Can we connect our Epic/Facets system?" | Any system accessible via MCP, REST API, or exportable to Blob/Search/Fabric can be connected. |
| "How fresh is the data?" | MCP and Fabric Data Agent are real-time. Blob and AI Search can be refreshed on a schedule you define. |
| "What model is powering this?" | The Knowledge Base is model-agnostic. The demo uses the default Foundry model; customers choose their own. |
