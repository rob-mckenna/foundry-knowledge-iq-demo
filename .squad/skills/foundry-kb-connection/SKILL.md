# SKILL: Foundry Knowledge Base Connection with Managed Identity

**Domain:** Microsoft Foundry — Knowledge Base wiring  
**Last updated:** 2026-06-21  
**Author:** Chunk

---

## What This Skill Covers

How to wire a Microsoft Foundry Knowledge Base when **key-based auth is disabled** by Azure Policy. All connections must use managed identity (Entra RBAC). This pattern applies broadly to any Foundry project in a security-hardened Azure subscription.

---

## Core Pattern

### 1. Find the Project Managed Identity

Every Foundry project has a system-assigned managed identity.  
Location in portal: **proj-{name} → Settings → Identity → Object (principal) ID**

### 2. Assign RBAC Before Creating Connections

Connection creation will silently fail or show "Failed" if RBAC is not in place first.

| Resource Type | Required Roles |
|--------------|---------------|
| Azure AI Search | Search Index Data Reader + Search Service Contributor |
| Azure Blob Storage | Storage Blob Data Reader |
| Azure OpenAI (embeddings) | Cognitive Services OpenAI User |

Assign via portal (IAM → Add role assignment → Managed identity) or `az role assignment create --assignee-principal-type ServicePrincipal`.

**Wait 2–10 minutes** after assignment before testing connections — RBAC propagation is asynchronous.

### 3. Connection Authentication Field

In the Foundry portal when creating a connection, set **Authentication** to **Managed identity** (not "API key", "Account key", or "Access key"). If the field defaults to key, actively change it.

### 4. One AI Search Connection, Multiple Indexes

A single `AzureAISearch` connection to a search service covers all indexes on that service. Select the specific index when adding each **data source** to the Knowledge Base — not at connection time.

### 5. Embedding Dimension Lock-In

When AI Search indexes are pre-built with a specific embedding model and dimension, the Foundry Knowledge Base embedding config must match exactly. Mismatched dimensions silently produce zero vector search results.

- `text-embedding-3-small` → 1536 dims
- `text-embedding-3-large` → 3072 dims

**Never change the embedding model/dimensions after an index is populated without re-indexing.**

### 6. MCP Server Connection

MCP servers deployed to Azure Container Apps with HTTP transport use:
- Connection type: MCP Server (or Custom HTTP endpoint)
- Endpoint path: typically `/mcp` (POST)
- Health check path: typically `/health` (GET) — verify before wiring

### 7. Smoke Test Pattern

After wiring, confirm each data source is reachable by sending a prompt that specifically targets that source and checking the Citations panel:
- Blob Storage → ask about a plan document term
- AI Search formulary index → ask about a specific drug
- AI Search provider index → ask to find a provider by specialty
- MCP Server → ask a question requiring a live tool call (prior auth, eligibility)

---

## Checklist

- [ ] Managed identity Object ID found
- [ ] All RBAC roles assigned; waited 5+ minutes for propagation
- [ ] Each connection created with "Managed identity" auth (not key)
- [ ] All connections show **Connected** (green) in Settings → Connections
- [ ] KB embedding model matches pre-built index schema (model name + dimensions)
- [ ] KB retrieval: Hybrid, Semantic ranking On, Top-K = 5
- [ ] Blob Storage: Indexed status before testing
- [ ] Smoke tests run and citations panel shows correct source per prompt

---

## Common Pitfalls

| Pitfall | Fix |
|---------|-----|
| Connection created before RBAC propagated → shows "Failed" | Delete and re-create connection after waiting 10 min |
| Embedding dim mismatch (3072 vs 1536) | Fix KB config; re-index all blob sources |
| AI Search returns 0 results | Check exact index name spelling; verify document count > 0 in portal |
| MCP 504 timeout | Container App cold start; re-send prompt once to warm it |
| Agent answers from general knowledge only | Confirm KB attached to agent under Knowledge/Tools section |
