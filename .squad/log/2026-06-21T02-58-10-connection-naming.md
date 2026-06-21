# Session Log — Connection Naming Resolution — 2026-06-21T02:58:10Z

**Agent:** Mikey (Lead)  
**Task:** Validate Foundry portal connection naming and fix guide docs  
**Requested by:** Rob McKenna  

## Summary

Validated that Microsoft Foundry portal auto-names connections from Azure resource names with no custom-name option. Confirmed fix: create all four connections via `az rest` ARM API with explicit names. Guide rewritten to Step B code-first approach. All connection names now match `knowledge-base-config.json` exactly.

## Decisions Merged

- `mikey-connection-naming.md` → `decisions.md`
