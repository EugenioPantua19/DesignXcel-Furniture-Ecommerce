#!/bin/bash

# Azure Setup Script for DesignXcel Deployment
# This script automates the creation of Azure resources for the DesignXcel project

set -e  # Exit on any error

# Configuration
RESOURCE_GROUP="designxcel-rg"
LOCATION="East US"
SQL_SERVER_NAME="designxcel-sql-server"
SQL_DATABASE_NAME="DesignXcelDB"
STORAGE_ACCOUNT_NAME="designxcelstorage"
APP_SERVICE_PLAN="designxcel-plan"
BACKEND_APP_NAME="designxcel-api"
FRONTEND_APP_NAME="designxcel-frontend"
SQL_ADMIN_USER="designxceladmin"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if Azure CLI is installed and user is logged in
check_prerequisites() {
    print_status "Checking prerequisites..."
    
    # Check if Azure CLI is installed
    if ! command -v az &> /dev/null; then
        print_error "Azure CLI is not installed. Please install it first."
        echo "Visit: https://docs.microsoft.com/en-us/cli/azure/install-azure-cli"
        exit 1
    fi
    
    # Check if user is logged in
    if ! az account show &> /dev/null; then
        print_error "You are not logged in to Azure. Please run 'az login' first."
        exit 1
    fi
    
    print_success "Prerequisites check passed!"
}

# Function to prompt for SQL password
get_sql_password() {
    while true; do
        echo -n "Enter SQL Server admin password (min 8 chars, must contain uppercase, lowercase, number, and special char): "
        read -s SQL_ADMIN_PASSWORD
        echo
        
        if [[ ${#SQL_ADMIN_PASSWORD} -ge 8 ]] && [[ "$SQL_ADMIN_PASSWORD" =~ [A-Z] ]] && [[ "$SQL_ADMIN_PASSWORD" =~ [a-z] ]] && [[ "$SQL_ADMIN_PASSWORD" =~ [0-9] ]] && [[ "$SQL_ADMIN_PASSWORD" =~ [^A-Za-z0-9] ]]; then
            echo -n "Confirm password: "
            read -s SQL_ADMIN_PASSWORD_CONFIRM
            echo
            
            if [[ "$SQL_ADMIN_PASSWORD" == "$SQL_ADMIN_PASSWORD_CONFIRM" ]]; then
                break
            else
                print_error "Passwords do not match. Please try again."
            fi
        else
            print_error "Password does not meet requirements. Please try again."
        fi
    done
}

# Function to create resource group
create_resource_group() {
    print_status "Creating resource group: $RESOURCE_GROUP"
    
    if az group show --name "$RESOURCE_GROUP" &> /dev/null; then
        print_warning "Resource group $RESOURCE_GROUP already exists."
    else
        az group create --name "$RESOURCE_GROUP" --location "$LOCATION"
        print_success "Resource group created successfully!"
    fi
}

# Function to create SQL Server and Database
create_sql_resources() {
    print_status "Creating SQL Server: $SQL_SERVER_NAME"
    
    if az sql server show --name "$SQL_SERVER_NAME" --resource-group "$RESOURCE_GROUP" &> /dev/null; then
        print_warning "SQL Server $SQL_SERVER_NAME already exists."
    else
        az sql server create \
            --name "$SQL_SERVER_NAME" \
            --resource-group "$RESOURCE_GROUP" \
            --location "$LOCATION" \
            --admin-user "$SQL_ADMIN_USER" \
            --admin-password "$SQL_ADMIN_PASSWORD"
        print_success "SQL Server created successfully!"
    fi
    
    print_status "Creating SQL Database: $SQL_DATABASE_NAME"
    
    if az sql db show --name "$SQL_DATABASE_NAME" --server "$SQL_SERVER_NAME" --resource-group "$RESOURCE_GROUP" &> /dev/null; then
        print_warning "SQL Database $SQL_DATABASE_NAME already exists."
    else
        az sql db create \
            --resource-group "$RESOURCE_GROUP" \
            --server "$SQL_SERVER_NAME" \
            --name "$SQL_DATABASE_NAME" \
            --service-objective Basic
        print_success "SQL Database created successfully!"
    fi
    
    print_status "Configuring SQL Server firewall..."
    
    # Allow Azure services
    az sql server firewall-rule create \
        --resource-group "$RESOURCE_GROUP" \
        --server "$SQL_SERVER_NAME" \
        --name "AllowAzureServices" \
        --start-ip-address 0.0.0.0 \
        --end-ip-address 0.0.0.0
    
    # Allow current IP
    CURRENT_IP=$(curl -s https://ipinfo.io/ip)
    if [[ -n "$CURRENT_IP" ]]; then
        az sql server firewall-rule create \
            --resource-group "$RESOURCE_GROUP" \
            --server "$SQL_SERVER_NAME" \
            --name "AllowCurrentIP" \
            --start-ip-address "$CURRENT_IP" \
            --end-ip-address "$CURRENT_IP"
        print_success "Firewall rules configured successfully!"
    else
        print_warning "Could not determine current IP. You may need to configure firewall rules manually."
    fi
}

# Function to create storage account
create_storage_account() {
    print_status "Creating storage account: $STORAGE_ACCOUNT_NAME"
    
    if az storage account show --name "$STORAGE_ACCOUNT_NAME" --resource-group "$RESOURCE_GROUP" &> /dev/null; then
        print_warning "Storage account $STORAGE_ACCOUNT_NAME already exists."
    else
        az storage account create \
            --name "$STORAGE_ACCOUNT_NAME" \
            --resource-group "$RESOURCE_GROUP" \
            --location "$LOCATION" \
            --sku Standard_LRS \
            --kind StorageV2
        print_success "Storage account created successfully!"
    fi
    
    print_status "Creating blob containers..."
    
    # Get storage account key
    STORAGE_KEY=$(az storage account keys list --resource-group "$RESOURCE_GROUP" --account-name "$STORAGE_ACCOUNT_NAME" --query '[0].value' --output tsv)
    
    # Create containers
    az storage container create \
        --name "uploads" \
        --account-name "$STORAGE_ACCOUNT_NAME" \
        --account-key "$STORAGE_KEY" \
        --public-access blob
    
    az storage container create \
        --name "profile-images" \
        --account-name "$STORAGE_ACCOUNT_NAME" \
        --account-key "$STORAGE_KEY" \
        --public-access blob
    
    az storage container create \
        --name "backups" \
        --account-name "$STORAGE_ACCOUNT_NAME" \
        --account-key "$STORAGE_KEY" \
        --public-access off
    
    print_success "Blob containers created successfully!"
}

# Function to create App Service Plan
create_app_service_plan() {
    print_status "Creating App Service Plan: $APP_SERVICE_PLAN"
    
    if az appservice plan show --name "$APP_SERVICE_PLAN" --resource-group "$RESOURCE_GROUP" &> /dev/null; then
        print_warning "App Service Plan $APP_SERVICE_PLAN already exists."
    else
        az appservice plan create \
            --name "$APP_SERVICE_PLAN" \
            --resource-group "$RESOURCE_GROUP" \
            --location "$LOCATION" \
            --sku B1 \
            --is-linux
        print_success "App Service Plan created successfully!"
    fi
}

# Function to create backend App Service
create_backend_app_service() {
    print_status "Creating backend App Service: $BACKEND_APP_NAME"
    
    if az webapp show --name "$BACKEND_APP_NAME" --resource-group "$RESOURCE_GROUP" &> /dev/null; then
        print_warning "Backend App Service $BACKEND_APP_NAME already exists."
    else
        az webapp create \
            --resource-group "$RESOURCE_GROUP" \
            --plan "$APP_SERVICE_PLAN" \
            --name "$BACKEND_APP_NAME" \
            --runtime "NODE|18-lts"
        print_success "Backend App Service created successfully!"
    fi
    
    print_status "Configuring backend App Service settings..."
    
    # Get storage account key
    STORAGE_KEY=$(az storage account keys list --resource-group "$RESOURCE_GROUP" --account-name "$STORAGE_ACCOUNT_NAME" --query '[0].value' --output tsv)
    
    # Configure app settings
    az webapp config appsettings set \
        --resource-group "$RESOURCE_GROUP" \
        --name "$BACKEND_APP_NAME" \
        --settings \
            NODE_ENV=production \
            PORT=8000 \
            DB_SERVER="${SQL_SERVER_NAME}.database.windows.net" \
            DB_USERNAME="$SQL_ADMIN_USER" \
            DB_PASSWORD="$SQL_ADMIN_PASSWORD" \
            DB_DATABASE="$SQL_DATABASE_NAME" \
            AZURE_STORAGE_ACCOUNT_NAME="$STORAGE_ACCOUNT_NAME" \
            AZURE_STORAGE_ACCOUNT_KEY="$STORAGE_KEY" \
            SESSION_SECRET="$(openssl rand -base64 32)" \
            FRONTEND_URL="https://${FRONTEND_APP_NAME}.azurestaticapps.net"
    
    # Enable HTTPS only
    az webapp update \
        --name "$BACKEND_APP_NAME" \
        --resource-group "$RESOURCE_GROUP" \
        --https-only true
    
    print_success "Backend App Service configured successfully!"
}

# Function to create Static Web App for frontend
create_static_web_app() {
    print_status "Creating Static Web App: $FRONTEND_APP_NAME"
    
    if az staticwebapp show --name "$FRONTEND_APP_NAME" --resource-group "$RESOURCE_GROUP" &> /dev/null; then
        print_warning "Static Web App $FRONTEND_APP_NAME already exists."
    else
        print_warning "Static Web App creation requires GitHub repository URL."
        print_warning "Please create the Static Web App manually in the Azure portal or provide GitHub repository details."
        print_warning "Alternatively, you can use the Azure CLI with GitHub integration:"
        echo "az staticwebapp create --name $FRONTEND_APP_NAME --resource-group $RESOURCE_GROUP --source https://github.com/yourusername/DesignXcel --branch main --app-location '/frontend' --output-location 'build'"
    fi
}

# Function to display summary
display_summary() {
    print_success "Azure resources setup completed!"
    echo
    echo "=== DEPLOYMENT SUMMARY ==="
    echo "Resource Group: $RESOURCE_GROUP"
    echo "Location: $LOCATION"
    echo
    echo "=== SQL SERVER ==="
    echo "Server: ${SQL_SERVER_NAME}.database.windows.net"
    echo "Database: $SQL_DATABASE_NAME"
    echo "Admin User: $SQL_ADMIN_USER"
    echo "Admin Password: [HIDDEN]"
    echo
    echo "=== STORAGE ACCOUNT ==="
    echo "Account Name: $STORAGE_ACCOUNT_NAME"
    echo "Containers: uploads, profile-images, backups"
    echo
    echo "=== APP SERVICES ==="
    echo "Backend API: https://${BACKEND_APP_NAME}.azurewebsites.net"
    echo "Frontend: https://${FRONTEND_APP_NAME}.azurestaticapps.net (if created)"
    echo
    echo "=== NEXT STEPS ==="
    echo "1. Configure Stripe keys in backend App Service settings"
    echo "2. Configure email settings (OTP_EMAIL_USER, OTP_EMAIL_PASS)"
    echo "3. Run database migration scripts"
    echo "4. Deploy your application code"
    echo "5. Test the deployment"
    echo
    print_warning "Don't forget to save your SQL Server password securely!"
}

# Main execution
main() {
    echo "=== DesignXcel Azure Setup Script ==="
    echo "This script will create all necessary Azure resources for the DesignXcel project."
    echo
    
    check_prerequisites
    get_sql_password
    
    echo
    print_status "Starting Azure resource creation..."
    
    create_resource_group
    create_sql_resources
    create_storage_account
    create_app_service_plan
    create_backend_app_service
    create_static_web_app
    
    display_summary
}

# Run main function
main "$@"
