"""
MacroFit Coach — Visitor Counter Azure Function
Cloud Computing Capstone Project 2026

This serverless function handles GET and POST requests for the visitor counter.
  - GET:  Returns the current visitor count (read-only, no increment)
  - POST: Increments the counter by 1 and returns the new count

The count is stored in a single document in Azure Cosmos DB (SQL API).

Environment variables (set in Azure Function App Settings — NEVER hardcode these):
  COSMOS_ENDPOINT        : Cosmos DB account endpoint URL
  COSMOS_KEY             : Cosmos DB primary key (stored securely)
  COSMOS_DB_NAME         : Database name (default: macrofit-db)
  COSMOS_CONTAINER_NAME  : Container name (default: visitor-counter)
  CORS_ORIGIN            : Allowed frontend origin (default: * for dev, set your domain in prod)
"""

import json
import logging
import os

import azure.functions as func
from azure.cosmos import CosmosClient, exceptions


# ---- Cosmos DB Configuration ----
# All values loaded from environment variables / Application Settings.
# This keeps secrets out of the source code.
COSMOS_ENDPOINT        = os.environ.get("COSMOS_ENDPOINT", "")
COSMOS_KEY             = os.environ.get("COSMOS_KEY", "")
COSMOS_DB_NAME         = os.environ.get("COSMOS_DB_NAME", "macrofit-db")
COSMOS_CONTAINER_NAME  = os.environ.get("COSMOS_CONTAINER_NAME", "visitor-counter")

# The single document that holds the global visitor count
COUNTER_DOCUMENT_ID    = "global-visitor-count"
COUNTER_PARTITION_KEY  = "counter"


def main(req: func.HttpRequest) -> func.HttpResponse:
    """
    Azure Function entry point.

    Supports:
      OPTIONS  -> CORS preflight response (required for browser fetch() calls)
      GET      -> Return current count without incrementing
      POST     -> Increment count by 1 and return new value

    Returns JSON: { "count": <int>, "status": "ok" }
    """
    logging.info("Visitor counter function triggered. Method: %s", req.method)

    # ---- Build CORS headers ----
    # In production, replace "*" with your specific frontend domain.
    # Example: "https://macrofitcoach.com"
    cors_origin = os.environ.get("CORS_ORIGIN", "*")
    headers = {
        "Access-Control-Allow-Origin":  cors_origin,
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, x-functions-key",
        "Content-Type":                 "application/json",
    }

    # ---- Handle CORS preflight (OPTIONS) ----
    # Browsers send an OPTIONS request before POST to check CORS policy.
    if req.method == "OPTIONS":
        return func.HttpResponse(status_code=200, headers=headers, body="")

    # ---- Validate configuration ----
    if not COSMOS_ENDPOINT or not COSMOS_KEY:
        logging.error("COSMOS_ENDPOINT or COSMOS_KEY environment variable is not set.")
        return func.HttpResponse(
            body=json.dumps({"error": "Server configuration error", "status": "error"}),
            status_code=500,
            headers=headers,
        )

    try:
        # ---- Connect to Cosmos DB ----
        client    = CosmosClient(COSMOS_ENDPOINT, credential=COSMOS_KEY)
        database  = client.get_database_client(COSMOS_DB_NAME)
        container = database.get_container_client(COSMOS_CONTAINER_NAME)

        # ---- Read current counter document ----
        try:
            item          = container.read_item(item=COUNTER_DOCUMENT_ID, partition_key=COUNTER_PARTITION_KEY)
            current_count = int(item.get("count", 0))
        except exceptions.CosmosResourceNotFoundError:
            # First ever visit — document does not exist yet, start at 0
            logging.info("Counter document not found. Creating with count = 0.")
            current_count = 0
            item = {
                "id":           COUNTER_DOCUMENT_ID,
                "partitionKey": COUNTER_PARTITION_KEY,
                "count":        0,
            }

        # ---- Increment on POST (new visit) ----
        if req.method == "POST":
            current_count += 1
            item["count"]  = current_count
            container.upsert_item(item)
            logging.info("Visitor count incremented to: %d", current_count)

        # ---- Return the count ----
        return func.HttpResponse(
            body=json.dumps({"count": current_count, "status": "ok"}),
            status_code=200,
            headers=headers,
        )

    except exceptions.CosmosHttpResponseError as cosmos_err:
        logging.error("Cosmos DB error: %s", cosmos_err.message)
        return func.HttpResponse(
            body=json.dumps({"error": "Database error", "status": "error"}),
            status_code=503,
            headers=headers,
        )
    except Exception as err:
        logging.error("Unexpected error in visitor counter: %s", str(err))
        return func.HttpResponse(
            body=json.dumps({"error": "Service temporarily unavailable", "status": "error"}),
            status_code=500,
            headers=headers,
        )
