# Routing Rules

## Signal → Agent

| Signal | Route To | Reason |
|--------|----------|--------|
| Architecture, demo flow, decisions, review | Mikey | Lead owns structure and decisions |
| AI Search, Blob Storage, Fabric, MCP server, endpoints, data source config | Data | Data Engineer owns all data source setup |
| Healthcare data, claims, members, providers, benefits, sample documents | Mouth | Domain Content owns synthetic data |
| Foundry agent, prompts, Knowledge Base config, testing | Chunk | Agent Builder owns Foundry agent |
| Multi-domain or unclear | Mikey | Lead triages |

## Reviewer Gates

| Artifact | Reviewer | Gate |
|----------|----------|------|
| Architecture proposals | Mikey | Must approve before implementation |
| Sample data accuracy | Mouth | Must verify healthcare domain correctness |
| Demo readiness | Mikey + Chunk | Both must approve final demo flow |
