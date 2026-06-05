# Fabric Data Agent — Healthcare Payor Connection

Connects an existing Microsoft Fabric Data Agent to an Azure AI Foundry Knowledge Base, enabling natural-language queries over the healthcare payor lakehouse (claims, members, providers, formulary).

## Prerequisites

- An existing **Microsoft Fabric workspace** with a Fabric Data Agent already configured
- The Fabric Data Agent must have access to the healthcare payor tables listed in `connection-config.json`
- Azure AI Foundry project with **Knowledge IQ** enabled
- Entra ID service principal with **Fabric Contributor** or **Workspace Member** role

> ⚠️ **Note:** Fabric Data Agent as a Foundry Knowledge Base data source requires your Fabric workspace to have the Data Agent feature enabled (currently in preview). Contact your Fabric workspace admin to confirm availability.

## Configuration

Edit `connection-config.json` and replace the placeholder values:

| Placeholder | Description |
|-------------|-------------|
| `${AZURE_TENANT_ID}` | Your Entra ID tenant ID |
| `${AZURE_CLIENT_ID}` | Service principal client ID used by Foundry |
| `${FABRIC_WORKSPACE_ID}` | GUID of your Fabric workspace |
| `${FABRIC_DATA_AGENT_ID}` | GUID of the Fabric Data Agent resource |

## Connect to Foundry Knowledge Base

1. Open **Azure AI Foundry** → your project → **Knowledge bases**
2. Click **+ Add data source** → **Fabric Data Agent**
3. Enter your Fabric workspace ID and Data Agent endpoint from `connection-config.json`
4. Authenticate using the Entra ID service principal
5. Select the tables in scope (see `knowledge_base_settings.tables_in_scope`)
6. Save and run an initial sync

## Tables in Scope

| Table | Contents |
|-------|---------|
| `claims_fact` | Claims transactions with status, amounts, ICD/CPT codes |
| `members_dim` | Member demographics and plan enrollment |
| `providers_dim` | Provider directory with network status and specialties |
| `formulary_current` | Current drug formulary with tier and prior auth flags |
| `prior_auth_decisions` | Prior authorization requests and decisions |
| `eligibility_current` | Current member eligibility and benefit accumulators |

## Verify the Connection

After setup, test with a sample Knowledge Base query in Foundry Playground:

```
What is the current deductible accumulator for member MBR-00123?
```

Foundry should route this to the Fabric Data Agent and return a grounded response from `eligibility_current`.
