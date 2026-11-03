# Local validation only: compiles to memory; never deploys, installs or logs secrets.
[CmdletBinding()]
param()
$ErrorActionPreference = 'Stop'

function Assert-True([bool] $Condition, [string] $Message) {
    if (-not $Condition) { throw $Message }
    Write-Output "PASS: $Message"
}

$main = Join-Path $PSScriptRoot 'main.bicep'
$prod = Join-Path $PSScriptRoot 'prod.bicepparam'
$compiled = & az bicep build --file $main --stdout
Assert-True ($LASTEXITCODE -eq 0) 'Bicep entry point compiles'
$template = ($compiled -join "`n") | ConvertFrom-Json -AsHashtable -Depth 100
$parameters = & az bicep build-params --file $prod --stdout
Assert-True ($LASTEXITCODE -eq 0) 'Production parameters compile'
$parameterDocument = ($parameters -join "`n") | ConvertFrom-Json -AsHashtable -Depth 100
if ($parameterDocument.ContainsKey('parametersJson')) {
    $parameterDocument = $parameterDocument.parametersJson | ConvertFrom-Json -AsHashtable -Depth 100
}

Assert-True ($template.'$schema' -match 'subscriptionDeploymentTemplate') 'Entry point is subscription scoped'
Assert-True (-not $template.parameters.modelCapacity.ContainsKey('defaultValue')) 'Model capacity has no default'
Assert-True ($template.parameters.deployModel.defaultValue -eq $false) 'Model deployment defaults off'
Assert-True ($parameterDocument.parameters.modelCapacity.value -eq 0) 'Production capacity is the preparation-only sentinel'
Assert-True ($parameterDocument.parameters.deployModel.value -eq $false) 'Production model deployment remains off'

$source = Get-Content (Join-Path $PSScriptRoot 'modules/function.bicep') -Raw
foreach ($required in @(
    "name: 'PHOTO_REVIEW_ENABLED', value: 'false'",
    "runtime: { name: 'node', version: '24' }",
    "authentication: { type: 'SystemAssignedIdentity' }",
    "name: 'AzureWebJobsStorage__credential', value: 'managedidentity'",
    "name: 'AzureWebJobsStorage__accountName'",
    'alwaysReady: []',
    "allowedOrigins: ['https://jurajkurtulik.github.io']",
    'supportCredentials: false'
)) { Assert-True ($source.Contains($required)) "Function safety setting: $required" }

$roles = Get-Content (Join-Path $PSScriptRoot 'modules/roles.bicep') -Raw
Assert-True (([regex]::Matches($roles, "resource \w+ 'Microsoft.Authorization/roleAssignments")).Count -eq 3) 'Exactly three function identity role assignments'
Assert-True ($roles.Contains('b7e6dc6d-f1e8-4753-8033-0f276bb0955b')) 'Documented host Blob Data Owner role is present'
Assert-True (-not ($roles -match '974c5e8b-45b9-4653-ba55-5f855dd0fb88|0a9a7e1f-b9d0-4cc4-a60d-0319b160aaa3')) 'No Queue/Table data contributor roles'

$storage = Get-Content (Join-Path $PSScriptRoot 'modules/storage.bicep') -Raw
foreach ($property in @('allowSharedKeyAccess', 'allowBlobPublicAccess', 'deleteRetentionPolicyEnabled', 'containerDeleteRetentionPolicyEnabled', 'isVersioningEnabled', 'automaticSnapshotPolicyEnabled', 'changeFeedEnabled', 'restorePolicyEnabled')) {
    Assert-True ($storage.Contains("${property}: false")) "Storage safety setting: $property disabled"
}
$model = Get-Content (Join-Path $PSScriptRoot 'modules/model.bicep') -Raw
foreach ($literal in @("name: 'gpt-6.1-sol'", "version: '2026-09-29'", "name: 'GlobalStandard'", "versionUpgradeOption: 'NoAutoUpgrade'", 'capacity: capacity')) {
    Assert-True ($model.Contains($literal)) "Pinned model setting: $literal"
}
$orchestration = Get-Content (Join-Path $PSScriptRoot 'modules/resources.bicep') -Raw
Assert-True ($orchestration.Contains("module model 'model.bicep' = if (deployModel)")) 'Model module is conditional'

$allLocalSource = (Get-ChildItem $PSScriptRoot -Recurse -Filter '*.bicep' | ForEach-Object { Get-Content $_.FullName -Raw }) -join "`n"
Assert-True (-not ($allLocalSource -match 'listKeys\(|listAccountSas\(|listServiceSas\(')) 'No key/SAS extraction'
Assert-True (-not ($allLocalSource -match "resource \w+ 'Microsoft.KeyVault/vaults/secrets")) 'No signing-secret resource or value in Bicep'
Assert-True (-not ($allLocalSource -match "resource \w+ 'Microsoft.(Insights|OperationalInsights|ServiceBus|DocumentDB|Sql)/")) 'No local paid telemetry, queue or database resource'

# This is a regression audit, not a general ARM evaluator or a cloud what-if.
# Pinned AVMs include conditional/zero-length templates for unused features;
# merely finding those resource types in compiled JSON is NOT an active inventory.
Write-Output 'Local template checks passed. Live validation, what-if, RBAC propagation and runtime tests remain separate gates.'