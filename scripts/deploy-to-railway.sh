#!/bin/bash

# Deploy to Railway Script with MCP Integration
# Comprehensive deployment automation for Maria Faz application

set -e

echo "🚂 Railway Deployment Script for Maria Faz"
echo "=========================================="

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_NAME="maria-faz-app"
SERVICE_NAME="maria-faz-backend"
HEALTH_ENDPOINT="/health"
MAX_DEPLOY_TIME=600 # 10 minutes

# Check if MCP tools are available
check_mcp_tools() {
    echo -e "${BLUE}🔍 Checking MCP tools availability...${NC}"
    
    if ! command -v claude &> /dev/null; then
        echo -e "${RED}❌ Claude CLI not found. Please install Claude CLI first.${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✅ MCP tools available${NC}"
}

# Pre-deployment checks
pre_deployment_checks() {
    echo -e "${BLUE}🔍 Running pre-deployment checks...${NC}"
    
    # Check if we have required environment variables
    if [ -z "$DATABASE_URL" ]; then
        echo -e "${RED}❌ DATABASE_URL not set${NC}"
        exit 1
    fi
    
    if [ -z "$GOOGLE_GEMINI_API_KEY" ]; then
        echo -e "${RED}❌ GOOGLE_GEMINI_API_KEY not set${NC}"
        exit 1
    fi
    
    # Run tests
    echo -e "${BLUE}🧪 Running tests...${NC}"
    npm test
    
    # Build check
    echo -e "${BLUE}🏗️ Testing build process...${NC}"
    npm run build
    
    echo -e "${GREEN}✅ Pre-deployment checks passed${NC}"
}

# Create or get Railway project
setup_railway_project() {
    echo -e "${BLUE}🏗️ Setting up Railway project...${NC}"
    
    # Check if project already exists
    PROJECT_LIST=$(claude mcp call railway project_list 2>/dev/null || echo "")
    
    if echo "$PROJECT_LIST" | grep -q "$PROJECT_NAME"; then
        echo -e "${GREEN}✅ Railway project '$PROJECT_NAME' already exists${NC}"
        PROJECT_ID=$(echo "$PROJECT_LIST" | jq -r ".projects[] | select(.name == \"$PROJECT_NAME\") | .id")
    else
        echo -e "${YELLOW}📝 Creating new Railway project...${NC}"
        PROJECT_RESULT=$(claude mcp call railway project_create --name "$PROJECT_NAME")
        PROJECT_ID=$(echo "$PROJECT_RESULT" | jq -r '.project.id')
        echo -e "${GREEN}✅ Created Railway project: $PROJECT_ID${NC}"
    fi
    
    export RAILWAY_PROJECT_ID="$PROJECT_ID"
}

# Setup service
setup_railway_service() {
    echo -e "${BLUE}🚀 Setting up Railway service...${NC}"
    
    # Get environments
    ENVIRONMENTS=$(claude mcp call railway project_environments --projectId "$RAILWAY_PROJECT_ID")
    PROD_ENV_ID=$(echo "$ENVIRONMENTS" | jq -r '.environments[] | select(.name | test("prod"; "i")) | .id // empty' | head -n1)
    
    if [ -z "$PROD_ENV_ID" ]; then
        PROD_ENV_ID=$(echo "$ENVIRONMENTS" | jq -r '.environments[0].id')
    fi
    
    export RAILWAY_ENVIRONMENT_ID="$PROD_ENV_ID"
    
    # Check if service exists
    SERVICES=$(claude mcp call railway service_list --projectId "$RAILWAY_PROJECT_ID")
    SERVICE_ID=$(echo "$SERVICES" | jq -r ".services[] | select(.name == \"$SERVICE_NAME\") | .id // empty")
    
    if [ -z "$SERVICE_ID" ]; then
        echo -e "${YELLOW}📝 Creating new service from repository...${NC}"
        
        # Detect Git repo
        GIT_REMOTE=$(git remote get-url origin 2>/dev/null || echo "")
        if [ -n "$GIT_REMOTE" ]; then
            REPO_NAME=$(echo "$GIT_REMOTE" | sed 's/.*[\/:]\\([^\/]*\/[^\/]*\\)\\.git$/\\1/' | sed 's/\\.git$//')
            
            SERVICE_RESULT=$(claude mcp call railway service_create_from_repo \
                --projectId "$RAILWAY_PROJECT_ID" \
                --repo "$REPO_NAME" \
                --name "$SERVICE_NAME")
            
            SERVICE_ID=$(echo "$SERVICE_RESULT" | jq -r '.service.id')
            echo -e "${GREEN}✅ Created service from repo: $SERVICE_ID${NC}"
        else
            echo -e "${RED}❌ No Git remote found. Please setup Git repository first.${NC}"
            exit 1
        fi
    else
        echo -e "${GREEN}✅ Service '$SERVICE_NAME' already exists: $SERVICE_ID${NC}"
    fi
    
    export RAILWAY_SERVICE_ID="$SERVICE_ID"
}

# Configure service settings
configure_service() {
    echo -e "${BLUE}⚙️ Configuring service settings...${NC}"
    
    claude mcp call railway service_update \
        --projectId "$RAILWAY_PROJECT_ID" \
        --serviceId "$RAILWAY_SERVICE_ID" \
        --environmentId "$RAILWAY_ENVIRONMENT_ID" \
        --healthcheckPath "$HEALTH_ENDPOINT" \
        --startCommand "npm start" \
        --buildCommand "npm run build" \
        --region "us-west1"
    
    echo -e "${GREEN}✅ Service configured${NC}"
}

# Setup environment variables
setup_environment_variables() {
    echo -e "${BLUE}🔧 Setting up environment variables...${NC}"
    
    # Read environment variables from .env file and Railway config
    ENV_VARS='{
        "NODE_ENV": "production",
        "DATABASE_URL": "'"$DATABASE_URL"'",
        "GOOGLE_GEMINI_API_KEY": "'"$GOOGLE_GEMINI_API_KEY"'",
        "MISTRAL_API_KEY": "'"$MISTRAL_API_KEY"'",
        "SESSION_SECRET": "'"$SESSION_SECRET"'",
        "ENABLE_DEMO_DATA": "false",
        "ENABLE_STREAMLINED_OCR": "true",
        "ENABLE_ADVANCED_NAME_MATCHING": "true",
        "UPLOAD_MAX_SIZE": "10485760",
        "UPLOAD_DIR": "/tmp/uploads",
        "RATE_LIMIT_WINDOW_MS": "900000",
        "RATE_LIMIT_MAX_REQUESTS": "100",
        "MCP_MODE": "production",
        "MCP_NAMESPACE": "maria-faz",
        "MCP_MONITORING": "true"
    }'
    
    claude mcp call railway variable_bulk_set \
        --projectId "$RAILWAY_PROJECT_ID" \
        --environmentId "$RAILWAY_ENVIRONMENT_ID" \
        --serviceId "$RAILWAY_SERVICE_ID" \
        --variables "$ENV_VARS"
    
    echo -e "${GREEN}✅ Environment variables configured${NC}"
}

# Setup domain and SSL
setup_domain() {
    echo -e "${BLUE}🌐 Setting up domain...${NC}"
    
    DOMAIN_RESULT=$(claude mcp call railway domain_create \
        --environmentId "$RAILWAY_ENVIRONMENT_ID" \
        --serviceId "$RAILWAY_SERVICE_ID" \
        --targetPort 3000 2>/dev/null || echo "")
    
    if [ -n "$DOMAIN_RESULT" ]; then
        DOMAIN=$(echo "$DOMAIN_RESULT" | jq -r '.domain.domain // empty')
        if [ -n "$DOMAIN" ]; then
            echo -e "${GREEN}✅ Domain created: $DOMAIN${NC}"
            export RAILWAY_DOMAIN="$DOMAIN"
        fi
    else
        echo -e "${YELLOW}⚠️ Using Railway generated domain${NC}"
    fi
}

# Setup persistent volumes
setup_volumes() {
    echo -e "${BLUE}💾 Setting up persistent volumes...${NC}"
    
    VOLUME_RESULT=$(claude mcp call railway volume_create \
        --projectId "$RAILWAY_PROJECT_ID" \
        --environmentId "$RAILWAY_ENVIRONMENT_ID" \
        --serviceId "$RAILWAY_SERVICE_ID" \
        --mountPath "/tmp/uploads" 2>/dev/null || echo "")
    
    if [ -n "$VOLUME_RESULT" ]; then
        echo -e "${GREEN}✅ Upload volume created${NC}"
    else
        echo -e "${YELLOW}⚠️ Using ephemeral storage for uploads${NC}"
    fi
}

# Deploy the service
deploy_service() {
    echo -e "${BLUE}🚀 Deploying service...${NC}"
    
    # Get latest commit SHA
    COMMIT_SHA=$(git rev-parse HEAD)
    
    DEPLOYMENT_RESULT=$(claude mcp call railway deployment_trigger \
        --projectId "$RAILWAY_PROJECT_ID" \
        --serviceId "$RAILWAY_SERVICE_ID" \
        --environmentId "$RAILWAY_ENVIRONMENT_ID" \
        --commitSha "$COMMIT_SHA")
    
    DEPLOYMENT_ID=$(echo "$DEPLOYMENT_RESULT" | jq -r '.deployment.id')
    
    if [ -n "$DEPLOYMENT_ID" ]; then
        echo -e "${GREEN}✅ Deployment triggered: $DEPLOYMENT_ID${NC}"
        monitor_deployment "$DEPLOYMENT_ID"
    else
        echo -e "${RED}❌ Failed to trigger deployment${NC}"
        exit 1
    fi
}

# Monitor deployment progress
monitor_deployment() {
    local deployment_id="$1"
    local attempts=0
    local max_attempts=$((MAX_DEPLOY_TIME / 20)) # Check every 20 seconds
    
    echo -e "${BLUE}👀 Monitoring deployment progress...${NC}"
    
    while [ $attempts -lt $max_attempts ]; do
        DEPLOYMENT_STATUS=$(claude mcp call railway deployment_status --deploymentId "$deployment_id")
        STATUS=$(echo "$DEPLOYMENT_STATUS" | jq -r '.deployment.status // "UNKNOWN"')
        
        echo -e "${BLUE}📊 Deployment status: $STATUS${NC}"
        
        case "$STATUS" in
            "SUCCESS")
                echo -e "${GREEN}✅ Deployment completed successfully!${NC}"
                perform_health_check
                return 0
                ;;
            "FAILED")
                echo -e "${RED}❌ Deployment failed!${NC}"
                get_deployment_logs "$deployment_id"
                exit 1
                ;;
            "CRASHED")
                echo -e "${RED}❌ Deployment crashed!${NC}"
                get_deployment_logs "$deployment_id"
                exit 1
                ;;
        esac
        
        sleep 20
        attempts=$((attempts + 1))
    done
    
    echo -e "${YELLOW}⏰ Deployment monitoring timeout${NC}"
    exit 1
}

# Get deployment logs
get_deployment_logs() {
    local deployment_id="$1"
    
    echo -e "${BLUE}📋 Fetching deployment logs...${NC}"
    
    LOGS=$(claude mcp call railway deployment_logs --deploymentId "$deployment_id" --limit 50)
    
    if [ -n "$LOGS" ]; then
        echo -e "${YELLOW}📋 Recent deployment logs:${NC}"
        echo "$LOGS" | jq -r '.logs[]? | "  \\(.timestamp): \\(.message)"'
    fi
}

# Perform health check
perform_health_check() {
    echo -e "${BLUE}🏥 Performing health check...${NC}"
    
    # Get service info to find domain
    SERVICE_INFO=$(claude mcp call railway service_info \
        --projectId "$RAILWAY_PROJECT_ID" \
        --serviceId "$RAILWAY_SERVICE_ID" \
        --environmentId "$RAILWAY_ENVIRONMENT_ID")
    
    DOMAIN=$(echo "$SERVICE_INFO" | jq -r '.service.domains[0] // empty')
    
    if [ -n "$DOMAIN" ]; then
        HEALTH_URL="https://$DOMAIN$HEALTH_ENDPOINT"
        
        echo -e "${BLUE}🔍 Checking health endpoint: $HEALTH_URL${NC}"
        
        # Wait a bit for service to be ready
        sleep 10
        
        if curl -f -s "$HEALTH_URL" > /dev/null; then
            echo -e "${GREEN}✅ Health check passed!${NC}"
            echo -e "${GREEN}🌐 Service available at: https://$DOMAIN${NC}"
        else
            echo -e "${YELLOW}⚠️ Health check failed, but deployment completed${NC}"
            echo -e "${YELLOW}🌐 Service URL: https://$DOMAIN${NC}"
        fi
    else
        echo -e "${YELLOW}⚠️ Could not determine service domain${NC}"
    fi
}

# Display deployment summary
deployment_summary() {
    echo -e "${BLUE}📊 Deployment Summary${NC}"
    echo "=============================="
    echo -e "Project ID: ${GREEN}$RAILWAY_PROJECT_ID${NC}"
    echo -e "Service ID: ${GREEN}$RAILWAY_SERVICE_ID${NC}"
    echo -e "Environment: ${GREEN}$RAILWAY_ENVIRONMENT_ID${NC}"
    
    if [ -n "$RAILWAY_DOMAIN" ]; then
        echo -e "Domain: ${GREEN}https://$RAILWAY_DOMAIN${NC}"
    fi
    
    echo -e "${GREEN}🎉 Deployment completed successfully!${NC}"
}

# Main execution
main() {
    echo -e "${BLUE}🚀 Starting Railway deployment process...${NC}"
    
    # Load environment variables
    if [ -f ".env" ]; then
        set -a
        source .env
        set +a
    fi
    
    check_mcp_tools
    pre_deployment_checks
    setup_railway_project
    setup_railway_service
    configure_service
    setup_environment_variables
    setup_domain
    setup_volumes
    deploy_service
    deployment_summary
    
    echo -e "${GREEN}🎉 All done! Maria Faz is now deployed on Railway!${NC}"
}

# Handle script arguments
case "${1:-deploy}" in
    "deploy")
        main
        ;;
    "health-check")
        perform_health_check
        ;;
    "logs")
        if [ -n "$2" ]; then
            get_deployment_logs "$2"
        else
            echo "Usage: $0 logs <deployment-id>"
            exit 1
        fi
        ;;
    "info")
        setup_railway_project
        setup_railway_service
        SERVICE_INFO=$(claude mcp call railway service_info \
            --projectId "$RAILWAY_PROJECT_ID" \
            --serviceId "$RAILWAY_SERVICE_ID" \
            --environmentId "$RAILWAY_ENVIRONMENT_ID")
        echo "$SERVICE_INFO" | jq .
        ;;
    *)
        echo "Usage: $0 [deploy|health-check|logs <deployment-id>|info]"
        exit 1
        ;;
esac