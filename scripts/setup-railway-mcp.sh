#!/bin/bash

# Railway MCP Integration Setup Script
# Quick setup and validation for Railway deployment

set -e

echo "🚂 Railway MCP Integration Setup"
echo "================================="

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check prerequisites
check_prerequisites() {
    echo -e "${BLUE}🔍 Checking prerequisites...${NC}"
    
    # Check Node.js version
    if ! command -v node &> /dev/null; then
        echo -e "${RED}❌ Node.js not found. Please install Node.js 20+${NC}"
        exit 1
    fi
    
    NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 18 ]; then
        echo -e "${RED}❌ Node.js 18+ required. Current version: $(node -v)${NC}"
        exit 1
    fi
    
    # Check Claude CLI
    if ! command -v claude &> /dev/null; then
        echo -e "${YELLOW}⚠️ Claude CLI not found. Installing...${NC}"
        curl -fsSL https://claude.ai/install.sh | sh
        export PATH="$HOME/.claude/bin:$PATH"
    fi
    
    # Check Git
    if ! command -v git &> /dev/null; then
        echo -e "${RED}❌ Git not found. Please install Git${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✅ All prerequisites met${NC}"
}

# Setup Claude MCP
setup_claude_mcp() {
    echo -e "${BLUE}🔧 Setting up Claude MCP...${NC}"
    
    # Add Railway MCP server
    echo -e "${BLUE}📦 Adding Railway MCP server...${NC}"
    claude mcp add railway npx @jason-tan-swe/railway-mcp@latest || {
        echo -e "${YELLOW}⚠️ Railway MCP server already configured or failed to add${NC}"
    }
    
    # Verify MCP configuration
    echo -e "${BLUE}🔍 Verifying MCP configuration...${NC}"
    claude mcp list | grep -q railway && {
        echo -e "${GREEN}✅ Railway MCP server configured${NC}"
    } || {
        echo -e "${RED}❌ Railway MCP server configuration failed${NC}"
        exit 1
    }
}

# Create environment files
create_environment_files() {
    echo -e "${BLUE}📝 Creating environment files...${NC}"
    
    # Create .env.railway if it doesn't exist
    if [ ! -f ".env.railway" ]; then
        cat > .env.railway << 'EOF'
# Railway-specific environment variables
NODE_ENV=production
PORT=3000

# Railway Configuration (set after first deployment)
RAILWAY_PROJECT_ID=
RAILWAY_SERVICE_ID=
RAILWAY_ENVIRONMENT_ID=

# MCP Configuration
MCP_MODE=production
MCP_NAMESPACE=maria-faz
MCP_MONITORING=true

# Auto-scaling Configuration
SCALING_MIN_REPLICAS=1
SCALING_MAX_REPLICAS=5
SCALING_TARGET_CPU=70
SCALING_TARGET_MEMORY=75

# Cost Optimization
ENABLE_SLEEP_MODE=true
SLEEP_AFTER_MINUTES=30
OFF_PEAK_HOURS=0,1,2,3,4,5,6

# Monitoring & Alerting
MONITORING_INTERVAL=60000
ALERT_CPU_THRESHOLD=80
ALERT_MEMORY_THRESHOLD=85
ALERT_RESPONSE_TIME_THRESHOLD=2000
ALERT_ERROR_RATE_THRESHOLD=5

# Optional: Notification Webhooks
# SLACK_WEBHOOK_URL=
# DISCORD_WEBHOOK_URL=
EOF
        echo -e "${GREEN}✅ Created .env.railway${NC}"
    else
        echo -e "${YELLOW}⚠️ .env.railway already exists${NC}"
    fi
    
    # Create logs directory
    mkdir -p logs tmp uploads .railway
    echo -e "${GREEN}✅ Created required directories${NC}"
}

# Install dependencies
install_dependencies() {
    echo -e "${BLUE}📦 Installing dependencies...${NC}"
    
    # Install npm dependencies
    npm install || npm ci
    
    echo -e "${GREEN}✅ Dependencies installed${NC}"
}

# Validate configuration
validate_configuration() {
    echo -e "${BLUE}🔍 Validating configuration...${NC}"
    
    # Check railway.json
    if [ -f "railway.json" ]; then
        echo -e "${GREEN}✅ railway.json found${NC}"
    else
        echo -e "${RED}❌ railway.json not found${NC}"
        exit 1
    fi
    
    # Check nixpacks.toml
    if [ -f "nixpacks.toml" ]; then
        echo -e "${GREEN}✅ nixpacks.toml found${NC}"
    else
        echo -e "${RED}❌ nixpacks.toml not found${NC}"
        exit 1
    fi
    
    # Check package.json scripts
    if grep -q "railway:deploy" package.json; then
        echo -e "${GREEN}✅ Railway scripts configured in package.json${NC}"
    else
        echo -e "${RED}❌ Railway scripts not found in package.json${NC}"
        exit 1
    fi
    
    # Validate environment variables
    if [ -f ".env" ]; then
        if grep -q "DATABASE_URL" .env && grep -q "GOOGLE_GEMINI_API_KEY" .env; then
            echo -e "${GREEN}✅ Required environment variables configured${NC}"
        else
            echo -e "${YELLOW}⚠️ Some required environment variables may be missing${NC}"
        fi
    else
        echo -e "${YELLOW}⚠️ .env file not found - please configure environment variables${NC}"
    fi
}

# Test build process
test_build() {
    echo -e "${BLUE}🏗️ Testing build process...${NC}"
    
    # Run build
    npm run build || {
        echo -e "${RED}❌ Build failed${NC}"
        exit 1
    }
    
    echo -e "${GREEN}✅ Build successful${NC}"
}

# Test health checks
test_health_checks() {
    echo -e "${BLUE}🏥 Testing health check system...${NC}"
    
    # Start health check server in background
    node scripts/health-checks.js &
    HEALTH_PID=$!
    
    # Wait for server to start
    sleep 3
    
    # Test health endpoint
    if curl -f -s http://localhost:3001/health > /dev/null; then
        echo -e "${GREEN}✅ Health check server working${NC}"
    else
        echo -e "${YELLOW}⚠️ Health check server test skipped (port may be in use)${NC}"
    fi
    
    # Stop health check server
    kill $HEALTH_PID 2>/dev/null || true
}

# Show next steps
show_next_steps() {
    echo -e "${BLUE}🎯 Setup Complete! Next Steps:${NC}"
    echo ""
    echo -e "${YELLOW}1. Configure Environment Variables:${NC}"
    echo "   Edit .env and .env.railway with your API keys and configuration"
    echo ""
    echo -e "${YELLOW}2. Deploy to Railway:${NC}"
    echo "   npm run railway:deploy"
    echo ""
    echo -e "${YELLOW}3. Monitor Deployment:${NC}"
    echo "   npm run railway:status"
    echo "   npm run railway:health"
    echo ""
    echo -e "${YELLOW}4. Start Monitoring:${NC}"
    echo "   npm run railway:monitor (in production)"
    echo ""
    echo -e "${YELLOW}5. Enable Auto-scaling:${NC}"
    echo "   npm run railway:scale start"
    echo ""
    echo -e "${GREEN}📚 Documentation:${NC}"
    echo "   docs/RAILWAY_MCP_INTEGRATION.md"
    echo ""
    echo -e "${GREEN}🆘 Help:${NC}"
    echo "   npm run railway:help"
    echo ""
}

# Show available commands
show_commands() {
    echo -e "${BLUE}📋 Available Railway Commands:${NC}"
    echo ""
    echo -e "${GREEN}Deployment:${NC}"
    echo "  npm run railway:deploy     - Deploy to Railway"
    echo "  npm run deploy            - Alternative deployment script"
    echo "  npm run railway:setup     - Setup environment"
    echo ""
    echo -e "${GREEN}Monitoring:${NC}"
    echo "  npm run railway:status    - Get service status"
    echo "  npm run railway:monitor   - Start monitoring"
    echo "  npm run railway:health    - Health check"
    echo "  npm run railway:logs      - View logs"
    echo ""
    echo -e "${GREEN}Scaling:${NC}"
    echo "  npm run railway:scale start      - Start auto-scaling"
    echo "  npm run railway:scale manual 3   - Scale to 3 replicas"
    echo "  npm run railway:scale status     - Scaling status"
    echo ""
    echo -e "${GREEN}Utilities:${NC}"
    echo "  npm run railway:cleanup   - Cleanup resources"
    echo "  npm run health-check      - Standalone health check"
    echo ""
}

# Main execution
main() {
    echo -e "${GREEN}🚀 Starting Railway MCP Integration Setup...${NC}"
    echo ""
    
    check_prerequisites
    setup_claude_mcp
    create_environment_files
    install_dependencies
    validate_configuration
    test_build
    test_health_checks
    
    echo ""
    echo -e "${GREEN}🎉 Railway MCP Integration Setup Complete!${NC}"
    echo ""
    
    show_commands
    show_next_steps
}

# Handle script arguments
case "${1:-setup}" in
    "setup")
        main
        ;;
    "validate")
        echo -e "${BLUE}🔍 Validating Railway MCP Integration...${NC}"
        validate_configuration
        test_build
        echo -e "${GREEN}✅ Validation complete${NC}"
        ;;
    "commands")
        show_commands
        ;;
    "help")
        echo "Usage: $0 [setup|validate|commands|help]"
        echo ""
        echo "Commands:"
        echo "  setup    - Run full setup process (default)"
        echo "  validate - Validate existing configuration"
        echo "  commands - Show available Railway commands"
        echo "  help     - Show this help"
        ;;
    *)
        echo "Unknown command: $1"
        echo "Use: $0 help"
        exit 1
        ;;
esac