# Sample Data — Synthetic Healthcare Payor Data

This directory is the **single source of truth** for all synthetic healthcare payor data used across the demo. Data here feeds every data source: the MCP server, AI Search documents, Fabric lakehouse tables, and Blob Storage uploads.

## Design Principles

- **Fully synthetic** — no real PHI or PII. All members, providers, and claims are fictional.
- **Internally consistent** — member IDs, provider NPIs, and claim numbers are cross-referenced so queries across data sources return coherent results.
- **Realistic but safe** — data volumes, denial rates, and benefit structures reflect plausible payor operations.

## Domains Covered

| Domain | Format | Description |
|--------|--------|-------------|
| Members | JSON / CSV | 500 synthetic members with demographics, plan enrollment, eligibility |
| Providers | JSON / CSV | 200 synthetic providers with NPI, specialty, network status |
| Claims | JSON / CSV | 2,000 synthetic claims with adjudication status and denial codes |
| Prior Authorizations | JSON / CSV | 300 PA records with approval/denial and criteria references |
| Formulary | JSON | Drug tier listings for two synthetic plan years |
| Benefits | JSON / Markdown | Plan-level benefit summaries for 4 synthetic plan types |
| Clinical Policies | Markdown / Text | 10 synthetic medical policy documents |

## Structure

```
sample-data/
  members/
  providers/
  claims/
  prior-auth/
  formulary/
  benefits/
  clinical-policies/
  README.md            # This file
```

## Usage by Data Source

| Data Source | Uses |
|-------------|------|
| MCP Server | `members/`, `claims/`, `prior-auth/`, `formulary/` |
| AI Search | `clinical-policies/`, `benefits/` |
| Fabric Data Agent | `claims/`, `members/`, `providers/` (loaded as lakehouse tables) |
| Blob Storage | `benefits/`, `providers/`, `prior-auth/` (as formatted documents) |
