targetScope = 'resourceGroup'

param name string
param projectName string
param location string
param tags object

module account 'br/public:avm/res/cognitive-services/account:0.19.1' = {
  name: 'foundry-account'
  params: {
    name: name
    location: location
    kind: 'AIServices'
    sku: 'S0'
    managedIdentities: { systemAssigned: true }
    allowProjectManagement: true
    customSubDomainName: name
    disableLocalAuth: true
    publicNetworkAccess: 'Enabled'
    networkAcls: { defaultAction: 'Allow' }
    // No agents, extra stores, diagnostic sinks or paid Defender onboarding.
    tags: tags
    enableTelemetry: false
  }
}

// No AVM project module was available. API confirmed in schema and subscription.
resource parent 'Microsoft.CognitiveServices/accounts@2025-06-01' existing = {
  name: name
}
resource project 'Microsoft.CognitiveServices/accounts/projects@2025-06-01' = {
  parent: parent
  name: projectName
  location: location
  identity: { type: 'SystemAssigned' }
  properties: {
    displayName: projectName
    description: 'Škola hrou: project container only; no agent service or persistent OCR.'
  }
  tags: tags
  dependsOn: [account]
}

output accountName string = account.outputs.name
// ARM-returned account endpoint, never a fabricated URL or API health claim.
output accountEndpoint string = account.outputs.endpoint