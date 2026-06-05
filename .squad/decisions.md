# Squad Decisions

## Active Decisions

### ADR: Demo Architecture — Knowledge IQ Multi-Source Knowledge Base

**Author:** Mikey (Lead)  
**Date:** 2026-06-05  
**Status:** Accepted  

We use exactly four data sources (MCP Server, Azure AI Search, Fabric Data Agent, Azure Blob Storage) to demonstrate architectural diversity for a healthcare payor audience. All sample data is synthetic and generated from `sample-data/`, distributed to each source at setup. Demo workflows cover: Eligibility & Benefits, Prior Authorization, Formulary & Pharmacy, Claims Analytics, and Provider Network. New Azure AI Foundry only (no classic Foundry or Azure AI Studio). Each source must work independently.

**Rationale:** Four sources cover real-time API (MCP), unstructured search (AI Search), structured analytics (Fabric), and file storage (Blob). Cross-source consistency enables compelling multi-source demos. New Foundry only is a hard constraint.

## Governance

- All meaningful changes require team consensus
- Document architectural decisions here
- Keep history focused on work, decisions focused on direction
