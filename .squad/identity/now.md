---
updated_at: 2026-06-21T04:03:24Z
focus_area: Azure infrastructure live — Foundry project creation and KB wiring next
active_issues: []
---

# What We're Focused On

Azure deployment complete: all Azure resources (OpenAI, AI Search, Storage, Container Registry) provisioned, sample data uploaded and indexed, MCP server containerized and live at `https://ca-mcp-healthbridge.lemoncoast-f3f8df5d.eastus.azurecontainerapps.io`. Three AI Search indexes populated (45 docs, 10 formulary, 7 provider records). Agent's KB config ready to wire. Next: Foundry project creation and data source connection.

## Next Steps

- Create Foundry project at `ai.azure.com` (`kind=project`, not Hub)
- Create Knowledge Base in Foundry, connect 4 data sources:
  - MCP (HTTP POST endpoint)
  - AI Search (3 indexes: healthcare-payor-docs, healthbridge-formulary-index, healthbridge-provider-index)
  - Blob Storage (healthcare-docs container)
  - Fabric Data Agent (⚠️ pending setup)
- Create agent from KB + system prompt
- Run sample-prompts.md test suite (30 prompts across 5 workflows)
