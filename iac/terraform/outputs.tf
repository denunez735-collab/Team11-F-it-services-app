# ============================================================
# MacroFit Coach — Terraform Outputs
# Cloud Computing Capstone Project 2026
#
# After running `terraform apply`, these values are printed
# to the terminal. Use them to configure the frontend and CI/CD.
# ============================================================

output "static_website_url" {
  description = "Public URL of the static website hosted in Azure Blob Storage"
  value       = azurerm_storage_account.static_site.primary_web_endpoint
}

output "function_app_base_url" {
  description = "Base URL of the Azure Function App"
  value       = "https://${azurerm_linux_function_app.visitor_counter_api.default_hostname}"
}

output "visitor_counter_api_url" {
  description = "Full endpoint URL for the visitor counter API — paste this into counter.js"
  value       = "https://${azurerm_linux_function_app.visitor_counter_api.default_hostname}/api/visitor_counter"
}

output "cosmos_db_endpoint" {
  description = "Azure Cosmos DB endpoint URL"
  value       = azurerm_cosmosdb_account.macrofit_db.endpoint
  sensitive   = true  # Hidden in terraform plan output for security
}

output "storage_account_name" {
  description = "Storage account name — needed for the GitHub Actions deployment"
  value       = azurerm_storage_account.static_site.name
}

output "resource_group_name" {
  description = "Resource Group name — useful for Azure CLI commands"
  value       = azurerm_resource_group.macrofit.name
}

output "application_insights_instrumentation_key" {
  description = "Application Insights instrumentation key for monitoring"
  value       = azurerm_application_insights.macrofit_insights.instrumentation_key
  sensitive   = true
}

output "log_analytics_workspace_id" {
  description = "Log Analytics Workspace ID"
  value       = azurerm_log_analytics_workspace.macrofit_logs.id
}

# ---- How to use these outputs ----
# After terraform apply:
#   1. Copy `visitor_counter_api_url` → paste into js/counter.js COUNTER_API_URL
#   2. Copy `storage_account_name`   → add as STORAGE_ACCOUNT_NAME GitHub Secret
#   3. Copy `static_website_url`     → share as the live site link
