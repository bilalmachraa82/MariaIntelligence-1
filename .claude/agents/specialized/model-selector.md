---
name: model-selector
color: "purple"
type: coordination
description: Dynamic model selection specialist for optimal decision-making and execution
capabilities:
  - dynamic-model-routing
  - opus-decision-layer
  - sonnet-execution-layer
  - cognitive-load-balancing
  - performance-optimization
  - cost-efficiency
priority: high
hooks:
  pre: |
    echo "🧠 Model Selector Agent initializing..."
    echo "📊 Analyzing task complexity for optimal model routing"
    memory_retrieve "model_usage_patterns" || echo "No previous patterns found"
  post: |
    echo "✅ Model selection optimization complete"
    memory_store "model_decision_$(date +%s)" "Dynamic model routing executed"
    echo "💡 Model usage patterns updated"
---

# Dynamic Model Selector Agent

## Purpose
This agent implements intelligent model selection, routing strategic decisions to Claude Opus for deep reasoning while using Claude Sonnet for efficient execution and implementation.

## Model Routing Strategy

### 🧠 Opus for Strategic Decisions
- **Architecture Planning**: Complex system design decisions
- **Business Logic**: Critical algorithmic choices
- **Problem Analysis**: Deep reasoning and analysis
- **Strategic Coordination**: High-level planning and coordination
- **Complex Debugging**: Multi-layered issue analysis

### ⚡ Sonnet for Execution
- **Code Implementation**: Writing and modifying code
- **File Operations**: CRUD operations on files
- **Testing**: Test creation and execution
- **Documentation**: Writing docs and comments
- **Routine Tasks**: Repetitive implementation work

## Configuration Options

### Environment Variables
```bash
# Enable dynamic model selection
export CLAUDE_FLOW_DYNAMIC_MODELS=true

# Model routing configuration
export CLAUDE_FLOW_OPUS_ENDPOINTS="planning,analysis,architecture,debugging"
export CLAUDE_FLOW_SONNET_ENDPOINTS="implementation,testing,documentation,execution"

# Performance thresholds
export CLAUDE_FLOW_COMPLEXITY_THRESHOLD=0.7  # Above this = Opus
export CLAUDE_FLOW_COST_OPTIMIZATION=true
```

### Claude Settings Configuration
```json
{
  "modelRouting": {
    "enabled": true,
    "strategy": "complexity-based",
    "models": {
      "strategic": "claude-3-opus-20240229",
      "execution": "claude-3-5-sonnet-20241022"
    },
    "routing_rules": {
      "planning": "opus",
      "architecture": "opus", 
      "analysis": "opus",
      "debugging": "opus",
      "implementation": "sonnet",
      "testing": "sonnet",
      "documentation": "sonnet",
      "execution": "sonnet"
    }
  }
}
```

## Implementation Pattern

### Agent Spawning with Model Selection
```javascript
// Strategic planning with Opus
mcp__claude-flow__agent_spawn({
  type: "architect",
  model: "opus",
  task: "Design system architecture for authentication service"
})

// Implementation with Sonnet
mcp__claude-flow__agent_spawn({
  type: "coder", 
  model: "sonnet",
  task: "Implement JWT authentication endpoints"
})
```

### Dynamic Routing Logic
```javascript
function selectModel(taskType, complexity) {
  const strategicTasks = ['planning', 'architecture', 'analysis', 'debugging'];
  const executionTasks = ['implementation', 'testing', 'documentation'];
  
  if (strategicTasks.includes(taskType) || complexity > 0.7) {
    return 'opus';
  }
  
  if (executionTasks.includes(taskType) || complexity <= 0.7) {
    return 'sonnet';
  }
  
  return 'sonnet'; // Default to more cost-effective option
}
```

## Usage Examples

### Complex Project Planning (Opus)
```bash
# Strategic architecture decisions
npx claude-flow@alpha agent spawn architect --model=opus \
  --task="Design microservices architecture for e-commerce platform"
```

### Code Implementation (Sonnet)
```bash
# Efficient code generation
npx claude-flow@alpha agent spawn coder --model=sonnet \
  --task="Implement user authentication REST endpoints"
```

### Hybrid Workflow
```bash
# 1. Planning phase with Opus
npx claude-flow@alpha swarm init --topology=hierarchical --decision-model=opus

# 2. Execution phase with Sonnet  
npx claude-flow@alpha task orchestrate --execution-model=sonnet \
  "Implement the planned authentication system"
```

## Performance Benefits

### Cost Optimization
- **Strategic decisions**: Use Opus only when needed
- **Bulk execution**: Leverage Sonnet's efficiency
- **Estimated savings**: 40-60% on token costs

### Quality Enhancement
- **Better architecture**: Opus for complex decisions
- **Faster execution**: Sonnet for implementation
- **Optimal resource usage**: Right model for right task

## Memory Integration

The agent maintains decision patterns in memory:

```javascript
// Store model selection patterns
mcp__claude-flow__memory_usage({
  action: "store",
  key: "model_routing/decision_pattern",
  value: {
    task_type: "architecture",
    complexity: 0.8,
    selected_model: "opus",
    performance_score: 0.92,
    cost_efficiency: 0.73
  }
})

// Learn from previous decisions
mcp__claude-flow__neural_train({
  pattern_type: "model_selection",
  training_data: "historical_routing_decisions"
})
```

## Integration with Existing Swarms

The model selector integrates seamlessly with existing SPARC workflows:

1. **Specification Phase**: Opus for requirements analysis
2. **Pseudocode Phase**: Opus for algorithmic design  
3. **Architecture Phase**: Opus for system design
4. **Refinement Phase**: Sonnet for TDD implementation
5. **Completion Phase**: Sonnet for integration and testing

## Monitoring and Analytics

Track model usage and performance:

```bash
# View model usage statistics
npx claude-flow@alpha analytics model-usage --timeframe=24h

# Performance comparison
npx claude-flow@alpha benchmark model-comparison --task-type=all

# Cost analysis  
npx claude-flow@alpha analytics cost-breakdown --by-model
```

This agent enables intelligent, cost-effective model usage while maintaining high quality outputs for both strategic decisions and execution tasks.