$required_node_version = '18.15.0'

$current_node_version = (node -v) -replace 'v', ''

if ($current_node_version -ne $required_node_version)
{
    "This project requires node $required_node_version"
    exit
}

# Loop over any subfolder with a package.json (except node_modules folders) and install all NPM packages

Get-ChildItem -Recurse -File |
Where-Object { $_.FullName -inotlike "*node_modules*" -and $_.FullName -inotlike "*packages*" -and $_.Name -eq "package.json" } |
ForEach-Object { $_.DirectoryName } |
ForEach-Object {
    Write-Host "Installing packages in $_" -ForegroundColor Cyan;
    Push-Location $_;
    npm ci;
    Pop-Location
}

# Project-specific build commands

Push-Location Vault
npm run build
npm run test
Pop-Location
