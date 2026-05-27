# MicroFit Coach

A capstone-ready fitness coaching landing page and dashboard demo designed for cloud hosting, serverless visitor tracking, IaC, CI/CD, monitoring, and team collaboration.

## Project summary

MicroFit Coach is a clean fitness coach web app concept with:
- Landing page and feature sections
- Macro tracking sample dashboard
- Workout tracker interaction
- Coach contact form ready for API integration
- Visitor counter frontend for cloud API
- Team info page with GitHub profile links
- Blog / write-up page for documentation

## File structure

```
MicroFit/
├── api/
│   └── visitor_counter.py
├── css/
│   └── styles.css
├── docs/
│   └── architecture-diagram.md
├── js/
│   └── script.js
├── blog.html
├── index.html
├── README.md
└── team.html
infra/
└── aws/
    ├── provider.tf
    ├── variables.tf
    ├── s3.tf
    ├── dynamodb.tf
    ├── lambda.tf
    ├── iam.tf
    └── outputs.tf
.github/
└── workflows/
    └── microfit-deploy.yml
```

## How to preview locally

1. Open `MicroFit/index.html` in a browser.
2. Or run a local server from the workspace root:
   ```bash
   python -m http.server 8000
   ```
3. Visit `http://localhost:8000/MicroFit/index.html`.

## What each file does

- `index.html`: Main landing page with hero, features, macro tracker, workout tracker, contact form, and visitor counter.
- `team.html`: Team profiles and GitHub links page.
- `blog.html`: Project blog write-up and architecture summary.
- `css/styles.css`: Full responsive design and page styling.
- `js/script.js`: Theme toggle, mobile menu, visitor counter support, macro updates, workout logging, and form interaction.
- `api/visitor_counter.py`: Example Python serverless API for incrementing a visitor counter in DynamoDB.
- `infra/aws/*`: Example Terraform templates for AWS S3, Lambda, DynamoDB, and IAM resources.
- `.github/workflows/microfit-deploy.yml`: GitHub Actions workflow for validating Terraform and deploying static assets.

## Visitor counter

The visitor counter is wired to a placeholder API URL in `js/script.js`:
```js
const apiUrl = 'https://YOUR_API_URL_HERE/api/visitor';
```

Replace that with your deployed API endpoint. The app will show a fallback count if the API cannot be reached.

## Deployment notes

### Static hosting options
- AWS S3 + CloudFront
- Azure Static Website
- GitHub Pages for preview

### Backend API options
- AWS Lambda + API Gateway
- Azure Functions

### NoSQL options
- AWS DynamoDB
- Azure Cosmos DB

## Next steps

1. Replace placeholder API URL.
2. Deploy static assets to your chosen cloud provider.
3. Use Terraform to provision the backend and database.
4. Configure GitHub Actions secrets and run the pipeline.
5. Update team GitHub profiles with real usernames.
6. Add real user authentication and persistent macros/workout storage as a bonus.
