#!/bin/bash
# Deploy the Recipe Picker MCP server as a Lambda Function URL
# Usage: ./deploy.sh [stack-name] [region] [profile]

set -e

STACK_NAME="${1:-recipe-picker-runtime}"
REGION="${2:-us-east-1}"
PROFILE="${3:-}"

PROFILE_ARG=""
if [ -n "$PROFILE" ]; then
  PROFILE_ARG="--profile $PROFILE"
fi

echo "📦 Building runtime bundle..."
npm run build:runtime

echo "📁 Preparing deployment package..."
mkdir -p runtime/dist
cp runtime/run.sh runtime/dist/

echo "🚀 Deploying..."
cd runtime
sam build
sam deploy \
  --stack-name "$STACK_NAME" \
  --region "$REGION" \
  --capabilities CAPABILITY_IAM \
  --no-confirm-changeset \
  --resolve-s3 \
  $PROFILE_ARG

echo ""
echo "✅ Deployed! Getting outputs..."
aws cloudformation describe-stacks \
  --stack-name "$STACK_NAME" \
  --region "$REGION" \
  --query 'Stacks[0].Outputs' \
  --output table \
  $PROFILE_ARG
