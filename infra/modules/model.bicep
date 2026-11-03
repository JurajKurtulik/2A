targetScope = 'resourceGroup'

param accountName string
param deploymentName string
@description('Explicit provider SKU units. This lower schema bound is NOT a verified model minimum. Verify actual minimum/step/units and quota before invoking this conditional module.')
@minValue(1)
param capacity int

resource account 'Microsoft.CognitiveServices/accounts@2025-06-01' existing = {
  name: accountName
}
resource model 'Microsoft.CognitiveServices/accounts/deployments@2025-06-01' = {
  parent: account
  name: deploymentName
  sku: {
    name: 'GlobalStandard'
    capacity: capacity
  }
  properties: {
    model: {
      format: 'OpenAI'
      name: 'gpt-6.1-sol'
      version: '2026-09-29'
    }
    versionUpgradeOption: 'NoAutoUpgrade'
    // No spillover deployment, fallback model or reserved throughput.
  }
}