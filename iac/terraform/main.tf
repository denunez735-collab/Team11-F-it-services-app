# ============================================================
# MacroFit Coach — Terraform Infrastructure as Code
# Cloud Computing Capstone Project 2026
#
# This file provisions ALL Azure resources needed for the project:
#   - Resource Group
#   - Azure Storage Account (static website hosting)
#   - Azure Cosmos DB (NoSQL visitor counter database)
#   - Azure App Service Plan (serverless/consumption)
#   - Azure Linux Function App (Python visitor counter API)
#   - Application Insights + Log Analytics (monitoring)
#   - Monthly Budget Alert (cost management)
#
# Usage:
#   terraform init
#   terraform plan -var-file="terraform.tfvars"
#   terraform apply -var-file="terraform.tfvars"
#   terraform destroy  (to tear down all resources)
# ============================================================

terraform {
  required_version = ">= 1.5.0"
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 3.80"
    }
  }

  # Remote state backend — stores Terraform state in Azure Blob Storage
  # so all team members share the same state file.
  # Uncomment and fill in values after creating a storage account manually.
  #
  # backend "azurerm" {
  #   resource_group_name  = "terraform-state-rg"
  #   storage_account_name = "tfstatemacrofit"
  #   container_name       = "tfstate"
  #   key                  = "macrofit.terraform.tfstate"
  # }
}

# ---- Azure Provider ----
provider "azurerm" {
  features {}
  subscription_id = var.subscription_id
}

# ============================================================
# RESOURCE GROUP
# All Azure resources live inside one Resource Group.
# ============================================================
resource "azurerm_resource_group" "macrofit" {
  name     = var.resource_group_name
  location = var.location

  tags = {
    Project     = "MacroFit Coach"
    Environment = var.environment
    Team        = "Cloud Capstone Team"
    ManagedBy   = "Terraform"
  }
}

# ============================================================
# STORAGE ACCOUNT — Static Website Hosting
# Hosts the HTML, CSS, and JS files for the frontend.
# ============================================================
resource "azurerm_storage_account" "static_site" {
  name                     = var.storage_account_name  # Must be globally unique (3-24 lowercase chars)
  resource_group_name      = azurerm_resource_group.macrofit.name
  location                 = azurerm_resource_group.macrofit.location
  account_tier             = "Standard"
  account_replication_type = "LRS"   # Locally Redundant Storage (cheapest, fine for dev)
  account_kind             = "StorageV2"

  # Enable static website — serves index.html from the $web container
  static_website {
    index_document     = "index.html"
    error_404_document = "index.html"  # SPA fallback
  }

  tags = azurerm_resource_group.macrofit.tags
}

# ============================================================
# COSMOS DB ACCOUNT — NoSQL Database
# Stores the visitor counter document.
# ============================================================
resource "azurerm_cosmosdb_account" "macrofit_db" {
  name                = var.cosmosdb_account_name  # Must be globally unique
  location            = azurerm_resource_group.macrofit.location
  resource_group_name = azurerm_resource_group.macrofit.name
  offer_type          = "Standard"
  kind                = "GlobalDocumentDB"  # SQL API (best for simple documents)

  # Free tier: 1,000 RU/s + 25 GB storage at no cost
  # Note: Only 1 free-tier account per Azure subscription
  enable_free_tier = var.cosmosdb_free_tier

  consistency_policy {
    consistency_level = "Session"  # Best balance of consistency and performance
  }

  geo_location {
    location          = azurerm_resource_group.macrofit.location
    failover_priority = 0
  }

  tags = azurerm_resource_group.macrofit.tags
}

# ---- Cosmos DB Database ----
resource "azurerm_cosmosdb_sql_database" "macrofit_database" {
  name                = "macrofit-db"
  resource_group_name = azurerm_resource_group.macrofit.name
  account_name        = azurerm_cosmosdb_account.macrofit_db.name

  autoscale_settings {
    max_throughput = 1000  # Auto-scales from 100 to 1000 RU/s as needed
  }
}

# ---- Cosmos DB Container — Visitor Counter ----
resource "azurerm_cosmosdb_sql_container" "visitor_counter" {
  name                = "visitor-counter"
  resource_group_name = azurerm_resource_group.macrofit.name
  account_name        = azurerm_cosmosdb_account.macrofit_db.name
  database_name       = azurerm_cosmosdb_sql_database.macrofit_database.name
  partition_key_path  = "/partitionKey"

  default_ttl = -1  # Documents never expire automatically
}

# ============================================================
# APP SERVICE PLAN — Serverless Consumption Plan
# Functions run on demand, no servers to manage.
# Consumption plan = pay only for what you use.
# ============================================================
resource "azurerm_service_plan" "macrofit_plan" {
  name                = "${var.resource_prefix}-app-plan"
  resource_group_name = azurerm_resource_group.macrofit.name
  location            = azurerm_resource_group.macrofit.location
  os_type             = "Linux"
  sku_name            = "Y1"  # Y1 = Consumption (serverless) plan

  tags = azurerm_resource_group.macrofit.tags
}

# ============================================================
# AZURE LINUX FUNCTION APP — Python Visitor Counter API
# ============================================================
resource "azurerm_linux_function_app" "visitor_counter_api" {
  name                = var.function_app_name  # Must be globally unique
  resource_group_name = azurerm_resource_group.macrofit.name
  location            = azurerm_resource_group.macrofit.location

  storage_account_name       = azurerm_storage_account.static_site.name
  storage_account_access_key = azurerm_storage_account.static_site.primary_access_key
  service_plan_id            = azurerm_service_plan.macrofit_plan.id

  site_config {
    application_stack {
      python_version = "3.11"
    }

    # CORS — only allow requests from your frontend domain
    cors {
      allowed_origins     = var.cors_allowed_origins
      support_credentials = false
    }
  }

  # Application Settings — environment variables for the Python function
  # Cosmos DB credentials are passed securely here (not in source code)
  app_settings = {
    "FUNCTIONS_WORKER_RUNTIME"              = "python"
    "COSMOS_ENDPOINT"                       = azurerm_cosmosdb_account.macrofit_db.endpoint
    "COSMOS_KEY"                            = azurerm_cosmosdb_account.macrofit_db.primary_key
    "COSMOS_DB_NAME"                        = "macrofit-db"
    "COSMOS_CONTAINER_NAME"                 = "visitor-counter"
    "CORS_ORIGIN"                           = join(",", var.cors_allowed_origins)
    "APPINSIGHTS_INSTRUMENTATIONKEY"        = azurerm_application_insights.macrofit_insights.instrumentation_key
    "APPLICATIONINSIGHTS_CONNECTION_STRING" = azurerm_application_insights.macrofit_insights.connection_string
  }

  tags = azurerm_resource_group.macrofit.tags
}

# ============================================================
# LOG ANALYTICS WORKSPACE — Centralized logging
# Application Insights sends logs here.
# ============================================================
resource "azurerm_log_analytics_workspace" "macrofit_logs" {
  name                = "${var.resource_prefix}-log-workspace"
  resource_group_name = azurerm_resource_group.macrofit.name
  location            = azurerm_resource_group.macrofit.location
  sku                 = "PerGB2018"
  retention_in_days   = 30  # Keep logs for 30 days (free tier: 31 days max)

  tags = azurerm_resource_group.macrofit.tags
}

# ============================================================
# APPLICATION INSIGHTS — Monitoring and alerting
# Tracks API performance, errors, and request counts.
# ============================================================
resource "azurerm_application_insights" "macrofit_insights" {
  name                = "${var.resource_prefix}-app-insights"
  location            = azurerm_resource_group.macrofit.location
  resource_group_name = azurerm_resource_group.macrofit.name
  workspace_id        = azurerm_log_analytics_workspace.macrofit_logs.id
  application_type    = "web"

  tags = azurerm_resource_group.macrofit.tags
}

# ============================================================
# BUDGET ALERT — Prevent unexpected Azure charges
# Sends email alerts at 80% and 100% of monthly budget.
# ============================================================
resource "azurerm_consumption_budget_resource_group" "macrofit_budget" {
  name              = "${var.resource_prefix}-monthly-budget"
  resource_group_id = azurerm_resource_group.macrofit.id

  amount     = var.monthly_budget_usd
  time_grain = "Monthly"

  time_period {
    start_date = "2026-05-01T00:00:00Z"
    end_date   = "2026-12-31T00:00:00Z"
  }

  # Alert at 80% of budget
  notification {
    enabled        = true
    threshold      = 80.0
    operator       = "GreaterThan"
    threshold_type = "Actual"
    contact_emails = var.alert_emails
  }

  # Alert at 100% of budget
  notification {
    enabled        = true
    threshold      = 100.0
    operator       = "GreaterThan"
    threshold_type = "Actual"
    contact_emails = var.alert_emails
  }
}
