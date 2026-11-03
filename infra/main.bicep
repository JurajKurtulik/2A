targetScope = 'subscription'

@description('Approved resource group. Changing production names requires separate approval.')
param resourceGroupName string = 'p-rg-skolahrou-jk'
@allowed(['uksouth'])
param location string = 'uksouth'
param functionAppName string = 'p-func-skolahrou-jk'
param planName string = 'p-asp-skolahrou-jk'
param storageAccountName string = 'pstskolahroujk'
param vaultName string = 'p-kv-skolahrou-jk'
param foundryAccountName string = 'p-aif-skolahrou-jk'
param foundryProjectName string = 'p-proj-skolahrou-jk'
param modelDeploymentName string = 'p-model-skolahrou-jk'
param photoContainerName string = 'p-blob-skolahrou-jk'
param codeContainerName string = 'p-code-skolahrou-jk'
param signingSecretName string = 'p-secret-skolahrou-jk'

@description('Required explicit capacity in provider SKU units, NOT a known minimum or TPM. 0 is only a preparation sentinel while deployModel=false. The conditional model module requires >=1; live min/max/step and quota must be verified before enabling it.')
@minValue(0)
param modelCapacity int
@description('Off for preparation. Never change without verified model capacity and deployment approval.')
param deployModel bool = false
@description('Preliminary only: prove JPEG decoding and 120-second OCR fit before enabling production.')
@allowed([512, 2048, 4096])
param instanceMemoryMB int = 512
@minValue(1)
@maxValue(1)
param maximumInstanceCount int = 1
@minValue(1)
@maxValue(4)
param httpConcurrency int = 4
param tags object = {
  workload: 'skolahrou'
  environment: 'p'
  owner: 'jk'
}

// 0.4.0 uses live-advertised RG API 2021-04-01; newer AVMs use 2025-04-01,
// which the target subscription did not advertise during preparation.
module group 'br/public:avm/res/resources/resource-group:0.4.0' = {
  name: 'skolahrou-resource-group'
  params: {
    name: resourceGroupName
    location: location
    tags: tags
    enableTelemetry: false
  }
}

module resources 'modules/resources.bicep' = {
  name: 'skolahrou-resources'
  scope: resourceGroup(resourceGroupName)
  params: {
    location: location
    functionAppName: functionAppName
    planName: planName
    storageAccountName: storageAccountName
    vaultName: vaultName
    foundryAccountName: foundryAccountName
    foundryProjectName: foundryProjectName
    modelDeploymentName: modelDeploymentName
    photoContainerName: photoContainerName
    codeContainerName: codeContainerName
    signingSecretName: signingSecretName
    modelCapacity: modelCapacity
    deployModel: deployModel
    instanceMemoryMB: instanceMemoryMB
    maximumInstanceCount: maximumInstanceCount
    httpConcurrency: httpConcurrency
    tags: tags
  }
  dependsOn: [group]
}

// Nonsecret ARM results only. These do not assert health or even package deployment.
output resourceGroupId string = group.outputs.resourceId
output functionAppId string = resources.outputs.functionAppId
output functionPrincipalId string = resources.outputs.functionPrincipalId
output storageAccountId string = resources.outputs.storageAccountId
output keyVaultUri string = resources.outputs.keyVaultUri
output foundryAccountEndpoint string = resources.outputs.foundryAccountEndpoint
output modelDeploymentRequested bool = deployModel