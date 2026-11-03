targetScope = 'resourceGroup'

param location string
param functionAppName string
param planName string
param storageAccountName string
param vaultName string
param foundryAccountName string
param foundryProjectName string
param modelDeploymentName string
param photoContainerName string
param codeContainerName string
param signingSecretName string
param modelCapacity int
param deployModel bool
param instanceMemoryMB int
param maximumInstanceCount int
param httpConcurrency int
param tags object

module storage 'storage.bicep' = {
  name: 'storage'
  params: {
    name: storageAccountName
    location: location
    photoContainerName: photoContainerName
    codeContainerName: codeContainerName
    tags: tags
  }
}

module vault 'br/public:avm/res/key-vault/vault:0.14.2' = {
  name: 'vault'
  params: {
    name: vaultName
    location: location
    sku: 'standard'
    enableRbacAuthorization: true
    enableSoftDelete: true
    softDeleteRetentionInDays: 7
    enablePurgeProtection: true
    enableVaultForDeployment: false
    enableVaultForDiskEncryption: false
    enableVaultForTemplateDeployment: false
    publicNetworkAccess: 'Enabled'
    networkAcls: {
      bypass: 'None'
      defaultAction: 'Allow'
    }
    tags: tags
    enableTelemetry: false
    // No secret values, keys, deployment scripts or operator role assignments.
  }
}

module foundry 'foundry.bicep' = {
  name: 'foundry'
  params: {
    name: foundryAccountName
    projectName: foundryProjectName
    location: location
    tags: tags
  }
}

module model 'model.bicep' = if (deployModel) {
  name: 'model'
  params: {
    accountName: foundry.outputs.accountName
    deploymentName: modelDeploymentName
    capacity: modelCapacity
  }
}

module app 'function.bicep' = {
  name: 'function'
  params: {
    name: functionAppName
    planName: planName
    location: location
    storageAccountName: storageAccountName
    blobEndpoint: storage.outputs.blobEndpoint
    codeContainerName: codeContainerName
    photoContainerName: photoContainerName
    vaultUri: vault.outputs.uri
    signingSecretName: signingSecretName
    modelEndpoint: foundry.outputs.accountEndpoint
    modelDeploymentName: modelDeploymentName
    instanceMemoryMB: instanceMemoryMB
    maximumInstanceCount: maximumInstanceCount
    httpConcurrency: httpConcurrency
    tags: tags
  }
}

// Acyclic bootstrap: resources -> app identity -> roles. No role outputs feed
// app settings. Wait for data-plane propagation before publishing code.
module roles 'roles.bicep' = {
  name: 'function-roles'
  params: {
    principalId: app.outputs.principalId
    storageAccountName: storageAccountName
    vaultName: vaultName
    foundryAccountName: foundry.outputs.accountName
  }
}

output functionAppId string = app.outputs.resourceId
output functionPrincipalId string = app.outputs.principalId
output storageAccountId string = storage.outputs.resourceId
output keyVaultUri string = vault.outputs.uri
output foundryAccountEndpoint string = foundry.outputs.accountEndpoint