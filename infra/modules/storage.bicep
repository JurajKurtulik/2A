targetScope = 'resourceGroup'

param name string
param location string
param photoContainerName string
param codeContainerName string
param tags object

module account 'br/public:avm/res/storage/storage-account:0.33.1' = {
  name: 'storage-account'
  params: {
    name: name
    location: location
    kind: 'StorageV2'
    skuName: 'Standard_LRS'
    accessTier: 'Hot'
    supportsHttpsTrafficOnly: true
    minimumTlsVersion: 'TLS1_2'
    allowBlobPublicAccess: false
    allowSharedKeyAccess: false
    allowCrossTenantReplication: false
    publicNetworkAccess: 'Enabled'
    networkAcls: {
      bypass: 'None'
      defaultAction: 'Allow'
    }
    // Applies ONLY to the approved new account, never an unrelated existing one.
    blobServices: {
      deleteRetentionPolicyEnabled: false
      containerDeleteRetentionPolicyEnabled: false
      isVersioningEnabled: false
      automaticSnapshotPolicyEnabled: false
      changeFeedEnabled: false
      restorePolicyEnabled: false
      containers: [
        { name: photoContainerName, publicAccess: 'None' }
        { name: codeContainerName, publicAccess: 'None' }
      ]
    }
    fileServices: {}
    queueServices: {}
    tableServices: {}
    tags: tags
    enableTelemetry: false
  }
}

output resourceId string = account.outputs.resourceId
output blobEndpoint string = account.outputs.primaryBlobEndpoint