#!/bin/bash

# Production Deployment Script for Expense Tracker
set -e

echo "🚀 Starting production deployment..."

# Deploy IAM stack first
echo "📋 Deploying Identity & Access Management..."
pnpm nx run identity-access-management:deploy --stage production

# Deploy API stack
echo "🔗 Deploying GraphQL API..."
pnpm nx run app-graphql-api:deploy --stage production

# Build and deploy frontend (you'll need to add your hosting deployment here)
echo "🌐 Building frontend for production..."
pnpm nx build web --configuration=production

echo "✅ Production deployment complete!"
echo "📝 Don't forget to:"
echo "   1. Update .env.production with actual values"
echo "   2. Configure your domain and SSL certificate"
echo "   3. Set up frontend hosting (S3 + CloudFront, Vercel, etc.)"