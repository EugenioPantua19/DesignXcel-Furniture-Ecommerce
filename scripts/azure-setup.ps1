# Azure Setup Script for DesignXcel Deployment (PowerShell)
# This script automates the creation of Azure resources for the DesignXcel project

param(
    [string]$ResourceGroup = "designxcel-rg",
    [string]$Location = "East US",
    [string]$SqlServerName = "designxcel-sql-server",
    [string]$SqlDatabaseName = "DesignXcelDB",
    [string]$StorageAccountName = "designxcelstorage",
    [string]$AppServicePlan = "designxcel-plan",
    [string]$BackendAppName = "designxcel-api",
    [string]$FrontendAppName = "designxcel-frontend",
    [string]$SqlAdminUser = "designxceladmin"
)

# Set error action preference
$ErrorActionPreference = "Stop"

# Function to write colored output
function Write-Status {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor Blue
}

function Write-Success {
    param([string]$Message)
    Write-Host "[SUCCESS] $Message" -ForegroundColor Green
}

function Write-Warning {
    param([string]$Message)
    Write-Host "[WARNING] $Message" -ForegroundColor Yellow
}

function Write-Error {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor Red
}

# Function to check prerequisites
function Test-Prerequisites {
    Write-Status "Checking prerequisites..."
    
    # Check if Azure CLI is installed
    try {
        $azVersion = az version --output json | ConvertFrom-Json
        Write-Success "Azure CLI version $($azVersion.'azure-cli') detected"
    }
    catch {
        Write-Error "Azure CLI is not installed or not in PATH. Please install it first."
        Write-Host "Visit: https://docs.microsoft.com/en-us/cli/azure/install-azure-cli"
        exit 1
    }
    
    # Check if user is logged in
    try {
        $account = az account show --output json | ConvertFrom-Json
        Write-Success "Logged in as: $($account.user.name)"
    }
    catch {
        Write-Error "You are not logged in to Azure. Please run 'az login' first."
        exit 1
    }
}

# Function to get SQL password securely
function Get-SqlPassword {
    do {
        $password = Read-Host "Enter SQL Server admin password (min 8 chars, must contain uppercase, lowercase, number, and special char)" -AsSecureString
        $passwordPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($password))
        
        $hasUpper = $passwordPlain -cmatch '[A-Z]'
        $hasLower = $passwordPlain -cmatch '[a-z]'
        $hasNumber = $passwordPlain -match '[0-9]'
        $hasSpecial = $passwordPlain -match '[^A-Za-z0-9]'
        $hasLength = $passwordPlain.Length -ge 8
        
        if ($hasUpper -and $hasLower -and $hasNumber -and $hasSpecial -and $hasLength) {
            $confirmPassword = Read-Host "Confirm password" -AsSecureString
            $confirmPasswordPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($confirmPassword))
            
            if ($passwordPlain -eq $confirmPasswordPlain) {
                return $passwordPlain
            }
            else {
                Write-Error "Passwords do not match. Please try again."
            }
        }
        else {
            Write-Error "Password does not meet requirements. Please try again."
        }
    } while ($true)
}

# Function to create resource group
function New-ResourceGroup {
    Write-Status "Creating resource group: $ResourceGroup"
    
    try {
        az group show --name $ResourceGroup --output none
        Write-Warning "Resource group $ResourceGroup already exists."
    }
    catch {
        az group create --name $ResourceGroup --location $Location --output none
        Write-Success "Resource group created successfully!"
    }
}

# Function to create SQL resources
function New-SqlResources {
    param([string]$SqlPassword)
    
    Write-Status "Creating SQL Server: $SqlServerName"
    
    try {
        az sql server show --name $SqlServerName --resource-group $ResourceGroup --output none
        Write-Warning "SQL Server $SqlServerName already exists."
    }
    catch {
        az sql server create `
            --name $SqlServerName `
            --resource-group $ResourceGroup `
            --location $Location `
            --admin-user $SqlAdminUser `
            --admin-password $SqlPassword `
            --output none
        Write-Success "SQL Server created successfully!"
    }
    
    Write-Status "Creating SQL Database: $SqlDatabaseName"
    
    try {
        az sql db show --name $SqlDatabaseName --server $SqlServerName --resource-group $ResourceGroup --output none
        Write-Warning "SQL Database $SqlDatabaseName already exists."
    }
    catch {
        az sql db create `
            --resource-group $ResourceGroup `
            --server $SqlServerName `
            --name $SqlDatabaseName `
            --service-objective Basic `
            --output none
        Write-Success "SQL Database created successfully!"
    }
    
    Write-Status "Configuring SQL Server firewall..."
    
    # Allow Azure services
    az sql server firewall-rule create `
        --resource-group $ResourceGroup `
        --server $SqlServerName `
        --name "AllowAzureServices" `
        --start-ip-address 0.0.0.0 `
        --end-ip-address 0.0.0.0 `
        --output none
    
    # Allow current IP
    try {
        $currentIP = (Invoke-WebRequest -Uri "https://ipinfo.io/ip" -UseBasicParsing).Content.Trim()
        az sql server firewall-rule create `
            --resource-group $ResourceGroup `
            --server $SqlServerName `
            --name "AllowCurrentIP" `
            --start-ip-address $currentIP `
            --end-ip-address $currentIP `
            --output none
        Write-Success "Firewall rules configured successfully!"
    }
    catch {
        Write-Warning "Could not determine current IP. You may need to configure firewall rules manually."
    }
}

# Function to create storage account
function New-StorageAccount {
    Write-Status "Creating storage account: $StorageAccountName"
    
    try {
        az storage account show --name $StorageAccountName --resource-group $ResourceGroup --output none
        Write-Warning "Storage account $StorageAccountName already exists."
    }
    catch {
        az storage account create `
            --name $StorageAccountName `
            --resource-group $ResourceGroup `
            --location $Location `
            --sku Standard_LRS `
            --kind StorageV2 `
            --output none
        Write-Success "Storage account created successfully!"
    }
    
    Write-Status "Creating blob containers..."
    
    # Get storage account key
    $storageKey = az storage account keys list --resource-group $ResourceGroup --account-name $StorageAccountName --query '[0].value' --output tsv
    
    # Create containers
    az storage container create `
        --name "uploads" `
        --account-name $StorageAccountName `
        --account-key $storageKey `
        --public-access blob `
        --output none
    
    az storage container create `
        --name "profile-images" `
        --account-name $StorageAccountName `
        --account-key $storageKey `
        --public-access blob `
        --output none
    
    az storage container create `
        --name "backups" `
        --account-name $StorageAccountName `
        --account-key $storageKey `
        --public-access off `
        --output none
    
    Write-Success "Blob containers created successfully!"
}

# Function to create App Service Plan
function New-AppServicePlan {
    Write-Status "Creating App Service Plan: $AppServicePlan"
    
    try {
        az appservice plan show --name $AppServicePlan --resource-group $ResourceGroup --output none
        Write-Warning "App Service Plan $AppServicePlan already exists."
    }
    catch {
        az appservice plan create `
            --name $AppServicePlan `
            --resource-group $ResourceGroup `
            --location $Location `
            --sku B1 `
            --is-linux `
            --output none
        Write-Success "App Service Plan created successfully!"
    }
}

# Function to create backend App Service
function New-BackendAppService {
    param([string]$SqlPassword)
    
    Write-Status "Creating backend App Service: $BackendAppName"
    
    try {
        az webapp show --name $BackendAppName --resource-group $ResourceGroup --output none
        Write-Warning "Backend App Service $BackendAppName already exists."
    }
    catch {
        az webapp create `
            --resource-group $ResourceGroup `
            --plan $AppServicePlan `
            --name $BackendAppName `
            --runtime "NODE|18-lts" `
            --output none
        Write-Success "Backend App Service created successfully!"
    }
    
    Write-Status "Configuring backend App Service settings..."
    
    # Get storage account key
    $storageKey = az storage account keys list --resource-group $ResourceGroup --account-name $StorageAccountName --query '[0].value' --output tsv
    
    # Generate session secret
    $sessionSecret = [Convert]::ToBase64String([System.Security.Cryptography.RandomNumberGenerator]::GetBytes(32))
    
    # Configure app settings
    az webapp config appsettings set `
        --resource-group $ResourceGroup `
        --name $BackendAppName `
        --settings `
            NODE_ENV=production `
            PORT=8000 `
            DB_SERVER="$SqlServerName.database.windows.net" `
            DB_USERNAME=$SqlAdminUser `
            DB_PASSWORD=$SqlPassword `
            DB_DATABASE=$SqlDatabaseName `
            AZURE_STORAGE_ACCOUNT_NAME=$StorageAccountName `
            AZURE_STORAGE_ACCOUNT_KEY=$storageKey `
            SESSION_SECRET=$sessionSecret `
            FRONTEND_URL="https://$FrontendAppName.azurestaticapps.net" `
        --output none
    
    # Enable HTTPS only
    az webapp update `
        --name $BackendAppName `
        --resource-group $ResourceGroup `
        --https-only true `
        --output none
    
    Write-Success "Backend App Service configured successfully!"
}

# Function to display summary
function Show-Summary {
    param([string]$SqlPassword)
    
    Write-Success "Azure resources setup completed!"
    Write-Host ""
    Write-Host "=== DEPLOYMENT SUMMARY ===" -ForegroundColor Cyan
    Write-Host "Resource Group: $ResourceGroup"
    Write-Host "Location: $Location"
    Write-Host ""
    Write-Host "=== SQL SERVER ===" -ForegroundColor Cyan
    Write-Host "Server: $SqlServerName.database.windows.net"
    Write-Host "Database: $SqlDatabaseName"
    Write-Host "Admin User: $SqlAdminUser"
    Write-Host "Admin Password: [HIDDEN]"
    Write-Host ""
    Write-Host "=== STORAGE ACCOUNT ===" -ForegroundColor Cyan
    Write-Host "Account Name: $StorageAccountName"
    Write-Host "Containers: uploads, profile-images, backups"
    Write-Host ""
    Write-Host "=== APP SERVICES ===" -ForegroundColor Cyan
    Write-Host "Backend API: https://$BackendAppName.azurewebsites.net"
    Write-Host "Frontend: https://$FrontendAppName.azurestaticapps.net (manual setup required)"
    Write-Host ""
    Write-Host "=== NEXT STEPS ===" -ForegroundColor Cyan
    Write-Host "1. Configure Stripe keys in backend App Service settings"
    Write-Host "2. Configure email settings (OTP_EMAIL_USER, OTP_EMAIL_PASS)"
    Write-Host "3. Run database migration scripts"
    Write-Host "4. Deploy your application code"
    Write-Host "5. Create Static Web App for frontend"
    Write-Host "6. Test the deployment"
    Write-Host ""
    Write-Warning "Don't forget to save your SQL Server password securely!"
    
    # Save connection details to file
    $connectionDetails = @"
=== DesignXcel Azure Connection Details ===
Generated: $(Get-Date)

SQL Server: $SqlServerName.database.windows.net
Database: $SqlDatabaseName
Username: $SqlAdminUser
Password: $SqlPassword

Backend URL: https://$BackendAppName.azurewebsites.net
Storage Account: $StorageAccountName

Resource Group: $ResourceGroup
Location: $Location
"@
    
    $connectionDetails | Out-File -FilePath "azure-connection-details.txt" -Encoding UTF8
    Write-Success "Connection details saved to: azure-connection-details.txt"
}

# Main execution
function Main {
    Write-Host "=== DesignXcel Azure Setup Script ===" -ForegroundColor Cyan
    Write-Host "This script will create all necessary Azure resources for the DesignXcel project."
    Write-Host ""
    
    Test-Prerequisites
    $sqlPassword = Get-SqlPassword
    
    Write-Host ""
    Write-Status "Starting Azure resource creation..."
    
    try {
        New-ResourceGroup
        New-SqlResources -SqlPassword $sqlPassword
        New-StorageAccount
        New-AppServicePlan
        New-BackendAppService -SqlPassword $sqlPassword
        
        Show-Summary -SqlPassword $sqlPassword
    }
    catch {
        Write-Error "An error occurred during setup: $($_.Exception.Message)"
        Write-Host "Please check the error and try again." -ForegroundColor Red
        exit 1
    }
}

# Run main function
Main
