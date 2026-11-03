targetScope = 'resourceGroup'

param name string
param planName string
param location string
param storageAccountName string
param blobEndpoint string
param codeContainerName string
param photoContainerName string
param vaultUri string
param signingSecretName string
param modelEndpoint string
param modelDeploymentName string
param instanceMemoryMB int
param maximumInstanceCount int
param httpConcurrency int
param tags object

module plan 'br/public:avm/res/web/serverfarm:0.7.0' = {
  name: 'flex-plan'
  params: {
    name: planName
    location: location
    kind: 'functionapp'
    skuName: 'FC1'
    reserved: true
    zoneRedundant: false
    tags: tags
    enableTelemetry: false
  }
}

module app 'br/public:avm/res/web/site:0.24.0' = {
  name: 'flex-app'
  params: {
    name: name
    location: location
    kind: 'functionapp,linux'
    serverFarmResourceId: plan.outputs.resourceId
    managedIdentities: { systemAssigned: true }
    httpsOnly: true
    clientAffinityEnabled: false
    publicNetworkAccess: 'Enabled'
    basicPublishingCredentialsPolicies: [
      { name: 'ftp', allow: false }
      { name: 'scm', allow: false }
    ]
    functionAppConfig: {
      runtime: { name: 'node', version: '24' }
      deployment: {
        storage: {
          type: 'blobContainer'
          value: '${blobEndpoint}${codeContainerName}'
          authentication: { type: 'SystemAssignedIdentity' }
        }
      }
      scaleAndConcurrency: {
        instanceMemoryMB: instanceMemoryMB
        maximumInstanceCount: maximumInstanceCount
        alwaysReady: []
        triggers: { http: { perInstanceConcurrency: httpConcurrency } }
      }
    }
    // Do not set Flex-deprecated linuxFxVersion, FUNCTIONS_WORKER_RUNTIME,
    // WEBSITE_RUN_FROM_PACKAGE, Azure Files connection or Always On settings.
    siteConfig: {
      minTlsVersion: '1.2'
      scmMinTlsVersion: '1.2'
      ftpsState: 'Disabled'
      httpLoggingEnabled: false
      detailedErrorLoggingEnabled: false
      requestTracingEnabled: false
      cors: {
        allowedOrigins: ['https://jurajkurtulik.github.io']
        supportCredentials: false
      }
      appSettings: [
        { name: 'AzureWebJobsStorage__accountName', value: storageAccountName }
        { name: 'AzureWebJobsStorage__credential', value: 'managedidentity' }
        { name: 'AzureWebJobsSecretStorageType', value: 'blob' }
        { name: 'PHOTO_REVIEW_ENABLED', value: 'false' }
        { name: 'PHOTO_STORAGE_ACCOUNT_URL', value: blobEndpoint }
        { name: 'PHOTO_STORAGE_CONTAINER', value: photoContainerName }
        { name: 'PHOTO_KEY_VAULT_URL', value: vaultUri }
        { name: 'PHOTO_SIGNING_SECRET_NAME', value: signingSecretName }
        { name: 'AZURE_OPENAI_ENDPOINT', value: modelEndpoint }
        { name: 'AZURE_OPENAI_DEPLOYMENT', value: modelDeploymentName }
        { name: 'PHOTO_MODEL_MAX_OUTPUT_TOKENS', value: '4096' }
        { name: 'PHOTO_MODEL_TIMEOUT_MS', value: '120000' }
        { name: 'PHOTO_REVIEW_DAILY_LIMIT', value: '20' }
        { name: 'PHOTO_REVIEW_MONTHLY_LIMIT', value: '100' }
        { name: 'PHOTO_ALLOWED_ORIGIN', value: 'https://jurajkurtulik.github.io' }
        // Defense in depth; backend must also never log headers/bodies/text.
        { name: 'AzureFunctionsJobHost__logging__logLevel__default', value: 'Warning' }
        { name: 'AzureFunctionsJobHost__logging__logLevel__Host.Results', value: 'Error' }
        { name: 'AzureFunctionsJobHost__logging__logLevel__Function', value: 'Error' }
        { name: 'AzureFunctionsJobHost__logging__fileLoggingMode', value: 'never' }
      ]
    }
    tags: tags
    enableTelemetry: false
  }
}

output resourceId string = app.outputs.resourceId
output principalId string = app.outputs.systemAssignedMIPrincipalId!