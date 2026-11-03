using './main.bicep'

param resourceGroupName = 'p-rg-skolahrou-jk'
param location = 'uksouth'
param functionAppName = 'p-func-skolahrou-jk'
param planName = 'p-asp-skolahrou-jk'
param storageAccountName = 'pstskolahroujk'
param vaultName = 'p-kv-skolahrou-jk'
param foundryAccountName = 'p-aif-skolahrou-jk'
param foundryProjectName = 'p-proj-skolahrou-jk'
param modelDeploymentName = 'p-model-skolahrou-jk'
param photoContainerName = 'p-blob-skolahrou-jk'
param codeContainerName = 'p-code-skolahrou-jk'
param signingSecretName = 'p-secret-skolahrou-jk'

// Explicit PREPARATION sentinel, not a deployment capacity or invented minimum.
// Before deployModel=true obtain the actual SKU minimum/step/units and approval.
param modelCapacity = 0
param deployModel = false
param instanceMemoryMB = 512
param maximumInstanceCount = 1
param httpConcurrency = 4