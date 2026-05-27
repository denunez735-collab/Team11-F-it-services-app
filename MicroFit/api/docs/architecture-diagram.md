# MicroFit Coach Architecture Diagram

This diagram describes the cloud architecture for the MicroFit Coach landing page and visitor counter.

```
User browser
      |
      | HTTPS request
      v
Cloud CDN / Static Hosting
  - AWS CloudFront + S3
  - OR Azure CDN + Static website
      |
      | Static HTML/CSS/JS
      v
Browser JavaScript
  - Section navigation
  - Macro tracker form
  - Workout logger
  - Contact form UI
  - Visitor counter API call
      |
      | Fetch request to API endpoint
      v
Serverless API
  - AWS Lambda / API Gateway
  - OR Azure Function
  - Endpoint: /api/visitor
      |
      | DynamoDB / Cosmos DB read + increment
      v
NoSQL Database
  - DynamoDB table: MicroFitVisitorCounter
  - OR Cosmos DB container
  - Item: { counterId: "visitor", count: 1234 }
```

## Key components

- **Static website**: Hosted on a cloud storage service and served securely over HTTPS.
- **Visitor counter API**: A small Python function that increments the count and returns the updated total.
- **NoSQL database**: Stores the visitor counter and can expand to store macro logs and workout entries.
- **CI/CD pipeline**: Uses GitHub Actions to validate IaC, deploy static assets, and optionally deploy cloud resources.

## Notes

- The front-end is built with HTML, CSS, and vanilla JavaScript.
- The backend API uses Python and serverless execution.
- IaC templates are provided as Terraform examples in `infra/aws`.
