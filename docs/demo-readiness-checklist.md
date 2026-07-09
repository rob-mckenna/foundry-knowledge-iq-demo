# HealthBridge Knowledge IQ — Demo Readiness Checklist

**Version:** 1.0  
**Date Created:** 2026-07-09  
**Target Audience:** HealthBridge Sales / Presenter  
**For:** Live demonstration to healthcare payor decision-makers

---

## Overview

This checklist verifies that all infrastructure, configurations, data, and workflows are ready for a live demo of Knowledge IQ in Azure AI Foundry. The demo is ~45 minutes and requires all four data sources to be live, with sample data verified to be correct and complete.

**High-risk items** (marked ⚠️) can block the demo if not ready. Fallback procedures are provided below.

---

## Part I: Pre-Demo Infrastructure Checks

### Azure Resource Group & Subscription

- [ ] **Subscription access:** Verify you can log into Azure CLI and see `rg-knowledge-iq-demo` resource group
  ```bash
  az group show --name rg-knowledge-iq-demo
  ```
- [ ] **Required resource providers registered:**
  ```bash
  az provider show --namespace Microsoft.Search --query registrationState
  az provider show --namespace Microsoft.CognitiveServices --query registrationState
  ```

### Azure OpenAI Deployment

- [ ] **Embedding model deployed:** `text-embedding-3-small` with at least 10K TPM available
  ```bash
  az cognitiveservices account deployment list \
    --name foundry-healthbridge-demo \
    --resource-group rg-knowledge-iq-demo
  ```
  Expected: `text-embedding-3-small` in STANDARD deployment mode, status `Succeeded`

- [ ] **Completion model deployed:** `gpt-4o` with at least 20K TPM available (used by both agent and knowledge base synthesis)
  ```bash
  # Same command as above; look for gpt-4o in the deployment list
  ```

### ⚠️ MCP Server — Azure Container Apps

- [ ] **Container App is running:**
  ```bash
  az containerapp show --name ca-mcp-healthbridge \
    --resource-group rg-knowledge-iq-demo \
    --query "properties.provisioningState"
  ```
  Expected: `Succeeded`

- [ ] **MCP Server responds to health check (< 3 seconds):**
  ```bash
  curl -s https://ca-mcp-healthbridge.lemoncoast-f3f8df5d.eastus.azurecontainerapps.io/health | jq .
  ```
  Expected:
  ```json
  {
    "status": "ok",
    "server": "healthcare-payor-mcp",
    "version": "1.0.0"
  }
  ```

- [ ] **Sample data loaded in MCP:** Verify at least 5 sample members are present
  ```bash
  curl -s "https://ca-mcp-healthbridge.lemoncoast-f3f8df5d.eastus.azurecontainerapps.io/tools/lookup_member?memberId=MBR-2024-001234" | jq .
  ```
  Expected: Member record for John A. Hartwell with plan HMO Silver and status ACTIVE

### Azure AI Search Service

- [ ] **Search service status is healthy:**
  ```bash
  az search service show --name srch-healthbridge-demo \
    --resource-group rg-knowledge-iq-demo \
    --query "provisioningState"
  ```
  Expected: `Succeeded`

- [ ] **All three indexes exist and are not empty:**
  ```bash
  az search index list --service-name srch-healthbridge-demo
  ```
  Expected: Three indexes listed:
  - `healthbridge-formulary-index` (should have ~10 drug records)
  - `healthbridge-provider-index` (should have ~7 provider records)
  - `healthcare-payor-docs` (should have ~45 policy/benefits documents)

- [ ] **Index document counts (via Azure CLI or portal):**
  - [ ] `healthcare-payor-docs`: ≥ 40 documents (policy PDFs, benefits summaries, coverage criteria)
  - [ ] `healthbridge-formulary-index`: ≥ 10 documents (drug records, celecoxib must be present)
  - [ ] `healthbridge-provider-index`: ≥ 6 documents (provider network, must include Dr. Patricia Chen)

### Azure Blob Storage

- [ ] **Storage account is accessible:**
  ```bash
  az storage account show --name sthealthbridgedemo2agib7 \
    --resource-group rg-knowledge-iq-demo
  ```
  Expected: `provisioningState: Succeeded`

- [ ] **Container exists and contains documents:**
  ```bash
  az storage blob list --account-name sthealthbridgedemo2agib7 \
    --container-name healthcare-docs
  ```
  Expected: At least 15 files (benefit summaries, policy documents)

---

## Part II: Foundry Configuration Checks

### Foundry Project & Connections

- [ ] **Foundry project exists and is accessible:**
  ```bash
  az ml workspace show --name proj-healthbridge --resource-group rg-knowledge-iq-demo
  ```
  Expected: Name = `proj-healthbridge`, provisioningState = `Succeeded`

- [ ] **Four connections are created and active (verify in Foundry portal → Operate → Admin → Connections):**
  | Connection Name | Type | Status |
  |---|---|---|
  | `healthbridge-mcp-connection` | RemoteTool (MCP) | ✅ Active |
  | `healthbridge-blob-connection` | Azure Storage | ✅ Active |
  | `healthbridge-aisearch-connection` | Azure AI Search | ✅ Active |
  | `healthbridge-fabric-connection` | Fabric Data Agent | ⚠️ (see blockers below) |

- [ ] **Test each connection from Foundry portal:**
  - MCP: Click **Test** → expected response: `{ status: "ok" }`
  - Blob: Click **Test** → expected result: Can authenticate and list containers
  - AI Search: Click **Test** → expected result: Can connect and list indexes

### ⚠️ Knowledge Base (`payor-knowledge-base`)

- [ ] **Knowledge base exists:**
  Navigate to Foundry portal → **Build** → **Knowledge** → Look for `payor-knowledge-base`
  Expected: Status = **Ready** (not grayed out, not syncing)

- [ ] **All four knowledge sources are attached:**
  Open KB details, check **Knowledge sources** section:
  - [ ] `healthcare-payor-docs-source` (Azure AI Search, `healthcare-payor-docs` index) — status: Active
  - [ ] `healthbridge-formulary-source` (Azure AI Search, `healthbridge-formulary-index`) — status: Active
  - [ ] `healthbridge-provider-source` (Azure AI Search, `healthbridge-provider-index`) — status: Active
  - [ ] `mcp-prior-auth-source` (MCP Server, `ca-mcp-healthbridge` endpoint) — status: Active

- [ ] **Retrieval settings are correct:**
  - Hybrid search: ✅ Enabled
  - Semantic ranking: ✅ Enabled
  - Top-K: = **5**
  - Minimum reranker score: = **0.5**

### ⚠️ Agent (`healthbridge-assistant`)

- [ ] **Agent exists and is deployed:**
  Navigate to Foundry portal → **Build** → **Agents** → Look for `healthbridge-assistant`
  Expected: Status = **Ready** (not grayed out, last deployed timestamp recent)

- [ ] **Agent is connected to Knowledge Base:**
  Open agent details → **Knowledge** section
  Expected: `payor-knowledge-base` is listed and status is **Active**

- [ ] **System prompt is present:**
  Open agent details → **System prompt** field
  Expected: Contains healthcare payor guardrails (e.g., "Do not provide medical advice", "Do not share bulk PHI")

- [ ] **Playground opens and responds to a test prompt (< 5 seconds):**
  Click **Playground** tab, type: `"What is my deductible under PPO Gold?"`
  Expected: Agent responds with: "I can look up plan details. Please tell me your member ID or plan name, and I'll retrieve your deductible information from our benefits summary."

---

## Part III: Data Completeness Checks

### Sample Data Presence in MCP Server

These checks confirm that live data in the MCP server is correct and complete for Act 1 & Act 2 of the demo.

- [ ] **Member MBR-2024-002891 exists (Sarah Nguyen):**
  ```bash
  curl -s "https://ca-mcp-healthbridge.lemoncoast-f3f8df5d.eastus.azurecontainerapps.io/tools/lookup_member?memberId=MBR-2024-002891" | jq .
  ```
  Expected: Sarah L. Nguyen, HMO Silver plan, Status ACTIVE, Deductible: $1,500

- [ ] **Claim CLM-2026-0061872 exists (knee replacement, PAID):**
  ```bash
  curl -s "https://ca-mcp-healthbridge.lemoncoast-f3f8df5d.eastus.azurecontainerapps.io/tools/lookup_claim?claimId=CLM-2026-0061872" | jq .
  ```
  Expected: Status PAID, Amount: $18,200 (allowed), PA number: PA-2026-087341

- [ ] **Prior auth policy for physical therapy is retrievable:**
  ```bash
  curl -s "https://ca-mcp-healthbridge.lemoncoast-f3f8df5d.eastus.azurecontainerapps.io/tools/get_prior_auth_requirements?serviceCategory=Physical%20Therapy" | jq .
  ```
  Expected: PA required only after 20 visits per calendar year

### Sample Data in Azure AI Search

These checks confirm that formulary and provider data is indexed and searchable.

- [ ] **Celecoxib is indexed in the formulary (required for Act 4):**
  1. Go to Azure Portal → AI Search → `srch-healthbridge-demo` → `healthbridge-formulary-index`
  2. Click **Search explorer**
  3. Search query: `celecoxib` (hit ⏎)
  4. Expected: Drug record with:
     - Drug name: "Celecoxib"
     - Tier: "Tier 1"
     - Therapeutic class: "NSAID"
     - Quantity limit: None (or standard daily)

- [ ] **Dr. Patricia Chen is indexed in the provider directory (required for Act 5):**
  1. Go to Azure Portal → AI Search → `srch-healthbridge-demo` → `healthbridge-provider-index`
  2. Click **Search explorer**
  3. Search query: `Dr. Patricia Chen` (hit ⏎)
  4. Expected: Provider record with:
     - Name: "Dr. Patricia M. Chen"
     - Specialty: "Internal Medicine"
     - Status: "ACTIVE_IN_NETWORK"
     - Location: Chicago IL

- [ ] **Physical therapy providers exist (required for Act 5 fallback):**
  1. Search query: `physical therapy` (hit ⏎)
  2. Expected: At least 1 result with therapist name and location

### Sample Documents in Azure Blob Storage

These checks confirm that benefits summaries and policy documents are present.

- [ ] **At least one benefit summary is readable:**
  1. Go to Azure Portal → Storage Accounts → `sthealthbridgedemo2agib7` → **Containers** → `healthcare-docs`
  2. Expected files: `ppo-gold-benefit-summary.md`, `hmo-silver-benefit-summary.md`, `epo-gold-benefit-summary.md`
  3. Download one and verify it contains:
     - Plan name (e.g., "PPO Gold")
     - Deductible amount
     - Out-of-pocket maximum
     - Copay information

---

## Part IV: Demo Flow Validation — 5 Acts with Test Prompts

Run these prompts in sequence using the agent **Playground** in Foundry. If any prompt fails, log the error in the sign-off table under **Notes**.

### Act 1 — Eligibility Check (MCP Server)
**Expected data source:** Fabric Data Agent + MCP Server

**Test prompt:**
```
Member MBR-2024-002891 is Sarah Nguyen. Is she currently eligible on our plan, and what is her deductible status?
```

**Expected response contains:**
- ✅ Status: Active
- ✅ Plan: HMO Silver
- ✅ Deductible: $1,500 (or year-to-date status)
- ✅ Citation: MCP Server or Fabric Data Agent

**Test result:** [ ] Pass · [ ] Fail · [ ] Timeout  
**Notes:** _______________

---

### Act 2 — Claims & EOB Explanation (MCP Server)
**Expected data source:** Fabric Data Agent + MCP

**Test prompt:**
```
Sarah had a right knee replacement on April 28th. Claim CLM-2026-0061872 shows I owe $3,654. Can you explain the math?
```

**Expected response contains:**
- ✅ Billed amount: $18,200
- ✅ Deductible applied: $1,500
- ✅ Coinsurance owed: $2,154 (30% of $7,180)
- ✅ Prior auth number: PA-2026-087341
- ✅ Citation: MCP Server or Fabric

**Test result:** [ ] Pass · [ ] Fail · [ ] Timeout  
**Notes:** _______________

---

### Act 3 — Prior Authorization Requirements (MCP Server + AI Search)
**Expected data source:** MCP Server + AI Search policies

**Test prompt:**
```
Sarah's surgeon wants to start physical therapy 3 times per week. Does she need prior authorization?
```

**Expected response contains:**
- ✅ PA not required for first 20 visits per year
- ✅ PA required for visits 21+
- ✅ Reference to therapy policy
- ✅ Citation: Both MCP Server (for policy rule) and/or AI Search (for clinical policy)

**Test result:** [ ] Pass · [ ] Fail · [ ] Timeout  
**Notes:** _______________

---

### Act 4 — Formulary & Drug Tier (Azure AI Search)
**Expected data source:** Azure AI Search formulary index

**Test prompt:**
```
Sarah's doctor prescribed celecoxib for pain. What tier is it on, and what will her copay be under HMO Silver?
```

**Expected response contains:**
- ✅ Drug name: Celecoxib
- ✅ Tier: Tier 1
- ✅ No PA required
- ✅ HMO Silver copay: (check Blob benefit summary for exact amount)
- ✅ Citation: AI Search formulary index

**Test result:** [ ] Pass · [ ] Fail · [ ] Timeout  
**Notes:** _______________

---

### Act 5 — Provider Network Search (Azure AI Search)
**Expected data source:** Azure AI Search provider directory

**Test prompt:**
```
Can you find me a physical therapist near Naperville, Illinois who is in-network and accepting new patients?
```

**Expected response contains:**
- ✅ At least one provider name and location
- ✅ Specialization: Physical Therapy / PT
- ✅ Network status: In-network
- ✅ Accepting new patients: Yes (if available in data)
- ✅ Citation: AI Search provider index

**Test result:** [ ] Pass · [ ] Fail · [ ] Timeout  
**Notes:** _______________

---

## Part V: Fallback & Contingency Procedures

### Scenario 1: MCP Server Timeout (Act 1, 2, 3)

**Symptom:** Prompt returns "Request timed out" or "MCP server unavailable" after 30 seconds.

**Quick check:**
```bash
curl -v https://ca-mcp-healthbridge.lemoncoast-f3f8df5d.eastus.azurecontainerapps.io/health
```

**If health check passes:**
- Issue is likely a specific tool call (e.g., `lookup_claim` is slow)
- Try a simpler prompt: `"Is member MBR-2024-001234 eligible?"` (tests `lookup_member`)
- If simpler prompt works, proceed with Acts 1-2 but note that Act 3 (prior auth) may be slower

**If health check fails:**
- Restart the Container App: `az containerapp restart --name ca-mcp-healthbridge --resource-group rg-knowledge-iq-demo`
- Wait 60 seconds and retest health check
- If still failing after 2 minutes: **Skip to Fallback Response A** (below)

**Fallback Response A — Use Prerecorded Demo:**
- If MCP is down, show a prerecorded video of Act 1-2-3 (should be prepared in advance)
- Proceed live with Act 4 (formulary, AI Search) and Act 5 (provider directory)
- Explain: "Real-time eligibility and claims queries would pull from your live systems. Here's what that looks like when your integration is running..."

---

### Scenario 2: AI Search Returns Empty or Few Results (Act 4, 5)

**Symptom:** Prompt to Act 4 returns "I couldn't find information about that drug" or Act 5 returns no providers.

**Quick check:**
1. Go to Azure Portal → AI Search → `srch-healthbridge-demo` → **Search explorer**
2. Try manual search: `celecoxib` in formulary index, `physical therapy` in provider index

**If manual search works but agent doesn't:**
- Issue is likely query rewriting or retrieval settings
- Try a more specific prompt: `"What tier is celecoxib on?"` instead of using full clinical scenario
- If that works, the issue is context length or query rewriting — acceptable for demo (show source citations to prove retrieval worked)

**If manual search returns empty:**
- Indexes may not have been populated. Check: `az search index get-statistics --service-name srch-healthbridge-demo --index-name healthbridge-formulary-index`
- If document count is 0, reindex: Follow `docs/azure-setup.md` Step 3d (upload sample data)
- Time to reindex: 5–10 minutes. **Not recoverable during a live demo.**
- **Fallback Response B:** Skip Act 4-5 and explain to audience: "The AI Search indexes contain your pharmacy policies and provider directories. In a real demo, we'd show live access to those here. For today's time constraint, let me show you the query architecture instead..." (show knowledge base connection diagram)

---

### Scenario 3: Agent Is Unavailable or Returns Errors (Any Act)

**Symptom:** Clicking the Playground returns "Agent is not available" or every prompt returns an error.

**Quick check:**
```bash
az ml workspace show --name proj-healthbridge --resource-group rg-knowledge-iq-demo \
  --query "provisioningState"
```

**If workspace is `Succeeded`:**
- Try refreshing the Foundry portal (F5)
- If still broken, the agent may need redeployment: Go to Foundry portal → **Build** → **Agents** → select `healthbridge-assistant` → click **Redeploy**
- Wait 30 seconds for redeployment
- Retry a test prompt

**If workspace is not `Succeeded` or agent redeploy fails:**
- The issue is likely a backend service failure (rare but possible during previews)
- **Fallback Response C:** Use a prerecorded screen recording of all 5 acts (should be prepared in advance) and walk the audience through the workflow verbally, showing source citations and data flow diagrams

---

### Scenario 4: Data Mismatch (Wrong Member / Claim Not Found)

**Symptom:** Prompt says "I can't find member MBR-2024-002891" or claim amount doesn't match.

**Quick check:**
```bash
curl -s "https://ca-mcp-healthbridge.lemoncoast-f3f8df5d.eastus.azurecontainerapps.io/tools/lookup_member?memberId=MBR-2024-002891" | jq .
```

If curl fails:
- Sample data may have been cleared from the MCP server
- Restart the Container App (see Scenario 1)
- Reload sample data if needed: Check `data-sources/mcp-server/server.js` for data loading logic and verify files in `sample-data/`

**Fallback Response D:** Use a different member/claim that's known to work. The demo story is flexible:
- Use MBR-2024-001234 (John Hartwell) instead of Sarah Nguyen
- Use CLM-2026-0054321 (office visit) instead of knee surgery
- The data structure and Knowledge Base architecture remain the same

---

## Part VI: Sign-Off Table

**Instructions:** 
1. Complete all checks in Parts I–IV before the demo.
2. For each major dependency, record the status, owner, and any notes.
3. A ✅ in the **Status** column means the demo is ready to proceed. ⚠️ means proceed with caution (fallback available). ❌ means blocker — fix before going live.

| Item | Category | Owner | Status | Last Verified | Notes |
|---|---|---|---|---|---|
| **INFRA: Azure Subscription Access** | Infrastructure | [Sales Engineer] | [ ] ✅ / [ ] ⚠️ / [ ] ❌ | | |
| **INFRA: MCP Server Health** | Infrastructure | [Data Engineer] | [ ] ✅ / [ ] ⚠️ / [ ] ❌ | | **⚠️ HIGH RISK** — if down, fallback: prerecorded video for Acts 1-2-3 |
| **INFRA: Azure OpenAI (gpt-4o, embeddings)** | Infrastructure | [Data Engineer] | [ ] ✅ / [ ] ⚠️ / [ ] ❌ | | |
| **INFRA: Azure AI Search (3 indexes)** | Infrastructure | [Data Engineer] | [ ] ✅ / [ ] ⚠️ / [ ] ❌ | | Celecoxib + Dr. Patricia Chen must be present |
| **INFRA: Azure Blob Storage** | Infrastructure | [Data Engineer] | [ ] ✅ / [ ] ⚠️ / [ ] ❌ | | |
| **FOUNDRY: Project exists & connections active** | Configuration | [Agent Builder] | [ ] ✅ / [ ] ⚠️ / [ ] ❌ | | MCP, Blob, AI Search, Fabric (if used) |
| **FOUNDRY: Knowledge Base ready** | Configuration | [Agent Builder] | [ ] ✅ / [ ] ⚠️ / [ ] ❌ | | All 4 sources attached, retrieval settings correct |
| **FOUNDRY: Agent deployed & playground responsive** | Configuration | [Agent Builder] | [ ] ✅ / [ ] ⚠️ / [ ] ❌ | | Test: `"What is my deductible?"` should return guardrail response |
| **DATA: MCP sample data (Sarah Nguyen, knee claim)** | Data | [Domain Content] | [ ] ✅ / [ ] ⚠️ / [ ] ❌ | | MBR-2024-002891, CLM-2026-0061872 must be queryable |
| **DATA: AI Search formulary (celecoxib present)** | Data | [Domain Content] | [ ] ✅ / [ ] ⚠️ / [ ] ❌ | | Tier 1, no PA required |
| **DATA: AI Search provider directory (Dr. Chen present)** | Data | [Domain Content] | [ ] ✅ / [ ] ⚠️ / [ ] ❌ | | Dr. Patricia M. Chen, Internal Medicine, Chicago, In-Network |
| **DATA: Blob benefits docs (HMO Silver, PPO Gold)** | Data | [Domain Content] | [ ] ✅ / [ ] ⚠️ / [ ] ❌ | | Deductible and copay data must be readable |
| **DEMO: Act 1 prompt validates** | Demo Flow | [Presenter] | [ ] ✅ / [ ] ⚠️ / [ ] ❌ | | Eligibility + deductible |
| **DEMO: Act 2 prompt validates** | Demo Flow | [Presenter] | [ ] ✅ / [ ] ⚠️ / [ ] ❌ | | EOB explanation + prior auth number |
| **DEMO: Act 3 prompt validates** | Demo Flow | [Presenter] | [ ] ✅ / [ ] ⚠️ / [ ] ❌ | | PT prior auth rules |
| **DEMO: Act 4 prompt validates** | Demo Flow | [Presenter] | [ ] ✅ / [ ] ⚠️ / [ ] ❌ | | Celecoxib tier + copay |
| **DEMO: Act 5 prompt validates** | Demo Flow | [Presenter] | [ ] ✅ / [ ] ⚠️ / [ ] ❌ | | Provider directory search |
| **BACKUP: Prerecorded video (Acts 1-2-3) ready** | Contingency | [Presenter] | [ ] ✅ / [ ] ⚠️ / [ ] ❌ | | For MCP timeout scenario |
| **BACKUP: Prerecorded video (full 5-act flow) ready** | Contingency | [Presenter] | [ ] ✅ / [ ] ⚠️ / [ ] ❌ | | For agent downtime or cascading failures |
| **AUDIENCE: Healthcare payor attendees informed of demo scope** | Pre-Demo | [Sales] | [ ] ✅ / [ ] ⚠️ / [ ] ❌ | | Clarify: synthetic data, no real PHI, 45-min flow |

---

## Pre-Demo Checklist (Day-Of)

**30 minutes before demo starts:**

- [ ] Run all 5 Acts test prompts again (refresh state after overnight)
- [ ] Verify MCP health check responds in < 2 seconds
- [ ] Open Foundry agent playground in a separate browser tab (as backup)
- [ ] Have the fallback videos queued and ready
- [ ] Test internet connection and video/audio if screensharing
- [ ] Close all other Azure portal tabs to avoid context-switching during demo
- [ ] Verify audience can see your screen (share a test slide first)

**During demo:**
- [ ] Click **Show source citations** after the first prompt to establish the "traceable answers" narrative
- [ ] Use the **Trace** view at least once to expose retrieval steps (optional, advanced audiences)
- [ ] If a prompt is slow (> 5 sec), acknowledge it: "Real-time searches across four systems do take a moment. In production, you'd cache frequent queries and filter by access controls."

---

## Contact & Escalation

| Role | Responsibility | Escalation Email |
|---|---|---|
| **Data Engineer** | Azure resources, MCP server, AI Search indexes, Blob storage | data-engineer@example.com |
| **Agent Builder (Chunk)** | Foundry project, Knowledge Base, Agent deployment, system prompts | chunk@example.com |
| **Domain Content (Mouth)** | Sample data accuracy, healthcare payor domain realism, scripts | mouth@example.com |
| **Sales Lead** | Audience prep, backup plan coordination, post-demo follow-up | sales@example.com |

---

## Appendix: Data Reference

### Member Used in Demo

| Field | Value |
|---|---|
| Member ID | MBR-2024-002891 |
| Name | Sarah L. Nguyen |
| Plan | HMO Silver |
| Status | ACTIVE |
| Deductible | $1,500 |
| Out-of-Pocket Max | $5,000 |
| Primary Care Physician | Dr. Patricia M. Chen (NPI 1234567890) |

### Claim Used in Demo

| Field | Value |
|---|---|
| Claim ID | CLM-2026-0061872 |
| Member | Sarah L. Nguyen (MBR-2024-002891) |
| Service | Total knee replacement (CPT 27447) |
| Date of Service | 2026-04-28 |
| Status | PAID |
| Billed Amount | $32,000 |
| Allowed Amount | $18,200 |
| Patient Responsibility | $3,654 ($1,500 deductible + $2,154 coinsurance @ 30%) |
| Prior Auth | PA-2026-087341 |

### Formulary Drug Used in Demo

| Field | Value |
|---|---|
| Drug Name | Celecoxib |
| Strength | 200 mg |
| Tier | Tier 1 (Preferred Generic) |
| Requires PA | No |
| Quantity Limit | None (standard daily) |
| Therapeutic Class | NSAID (non-steroidal anti-inflammatory) |
| Notes | Common post-surgical pain management; no step therapy |

### Provider Used in Demo (Provider Directory)

| Field | Value |
|---|---|
| Provider Name | Dr. Patricia M. Chen |
| NPI | 1234567890 |
| Specialty | Internal Medicine |
| Organization | HealthBridge Primary Care Associates |
| City, State | Chicago, IL |
| Network Status | ACTIVE_IN_NETWORK |
| Accepting New Patients | Yes |

### Institutions & Reference Numbers

| Reference | Value |
|---|---|
| Plan Brand | HealthBridge Insurance Plan |
| Service Area | Illinois |
| Member Services Phone | 1-800-555-BLUE (1-800-555-2583) |
| Portal | HealthBridge.example.com |
| MCP Server | https://ca-mcp-healthbridge.lemoncoast-f3f8df5d.eastus.azurecontainerapps.io |
| Azure AI Search | https://srch-healthbridge-demo.search.windows.net |

---

**Checklist version 1.0 | Created 2026-07-09 | For demo delivery to healthcare payor decision-makers**
