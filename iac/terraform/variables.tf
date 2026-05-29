# ============================================================
# MacroFit Coach — Terraform Input Variables
# Cloud Computing Capstone Project 2026
#
# Create a terraform.tfvars file (do NOT commit it to GitHub)
# to set sensitive values like subscription_id and alert_emails.
# ============================================================

variable "subscription_id" {
  description = "Azure Subscription ID — find this in the Azure Portal under Subscriptions"
  type        = string
  sensitive   = true
}

variable "resource_group_name" {
  description = "Name of the Azure Resource Group that contains all project resources"
  type        = string
  default     = "macrofit-coach-rg"
}

variable "location" {
  description = "Azure region to deploy resources in (e.g. East US, West US 2, Central US)"
  type        = string
  default     = "East US"
}

variable "environment" {
  description = "Deployment environment tag (dev / staging / prod)"
  type        = string
  default     = "dev"

  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "Environment must be one of: dev, staging, prod."
  }
}

variable "resource_prefix" {
  description = "Short prefix used in all resource names (keep it short and lowercase)"
  type        = string
  default     = "macrofit"
}

variable "storage_account_name" {
  description = <<EOT
    Azure Storage Account name.
    Must be globally unique, 3-24 characters, lowercase letters and numbers only.
    Example: macrofitcoach2026
  EOT
  type    = string
  default = "macrofitcoachsite"
}

variable "cosmosdb_account_name" {
  description = <<EOT
    Azure Cosmos DB account name.
    Must be globally unique, 3-44 characters, lowercase letters, numbers, and hyphens.
    Example: macrofit-cosmos-2026
  EOT
  type    = string
  default = "macrofit-cosmos-db"
}

variable "cosmosdb_free_tier" {
  description = <<EOT
    Enable Cosmos DB free tier (1,000 RU/s + 25GB free).
    NOTE: Azure allows only 1 free-tier Cosmos DB per subscription.
    Set to false if another free-tier account already exists in your subscription.
  EOT
  type    = bool
  default = true
}

variable "function_app_name" {
  description = <<EOT
    Azure Function App name.
    Must be globally unique — becomes part of the API URL:
    https://<function_app_name>.azurewebsites.net/api/visitor_counter
  EOT
  type    = string
  default = "macrofit-visitor-api"
}

variable "cors_allowed_origins" {
  description = <<EOT
    List of origins allowed to call the visitor counter API.
    In development, use ["*"] to allow any origin.
    In production, replace with your actual domain: ["https://macrofitcoach.com"]
  EOT
  type    = list(string)
  default = ["*"]
}

variable "monthly_budget_usd" {
  description = "Monthly spending cap in USD. Email alerts will fire at 80% and 100%."
  type        = number
  default     = 25.0
}

variable "alert_emails" {
  description = "List of email addresses to notify when budget thresholds are crossed."
  type        = list(string)
  default     = ["team@example.com"]
}
