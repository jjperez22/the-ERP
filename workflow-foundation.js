/**
 * Low-Code Workflow Builder - Part 2A1: Basic Workflow Foundation
 * Core workflow structure and basic execution engine
 */

class WorkflowFoundation {
    constructor(options = {}) {
        this.options = {
            maxNodes: options.maxNodes || 100,
            maxExecutionTime: options.maxExecutionTime || 30000, // 30 seconds
            enableLogging: options.enableLogging !== false,
            ...options
        };
        
        this.workflows = new Map();
        this.nodeTypes = new Map();
        this.executionQueue = [];
        this.isExecuting = false;
        this.eventBus = new EventTarget();
        
        this.init();
    }

    init() {
        this.registerDefaultNodeTypes();
        console.log('🔧 Workflow Foundation initialized');
    }

    // ========== WORKFLOW MANAGEMENT ==========
    
    /**
     * Create a new workflow
     */
    createWorkflow(config) {
        const workflow = {
            id: config.id || this.generateId(),
            name: config.name || 'Untitled Workflow',
            description: config.description || '',
            version: config.version || '1.0.0',
            nodes: new Map(),
            connections: [],
            variables: new Map(),
            metadata: {
                createdAt: new Date(),
                updatedAt: new Date(),
                author: config.author || 'System',
                tags: config.tags || []
            },
            status: 'draft',
            ...config
        };
        
        this.workflows.set(workflow.id, workflow);
        this.emit('workflowCreated', { workflowId: workflow.id, workflow });
        
        console.log(`🔧 Workflow '${workflow.name}' created`);
        return workflow;
    }

    /**
     * Get workflow by ID
     */
    getWorkflow(workflowId) {
        return this.workflows.get(workflowId);
    }

    /**
     * Update workflow
     */
    updateWorkflow(workflowId, updates) {
        const workflow = this.workflows.get(workflowId);
        if (!workflow) {
            throw new Error(`Workflow '${workflowId}' not found`);
        }
        
        Object.assign(workflow, updates);
        workflow.metadata.updatedAt = new Date();
        
        this.emit('workflowUpdated', { workflowId, workflow, updates });
        return workflow;
    }

    /**
     * Delete workflow
     */
    deleteWorkflow(workflowId) {
        const workflow = this.workflows.get(workflowId);
        if (!workflow) {
            throw new Error(`Workflow '${workflowId}' not found`);
        }
        
        this.workflows.delete(workflowId);
        this.emit('workflowDeleted', { workflowId, workflow });
        
        console.log(`🔧 Workflow '${workflow.name}' deleted`);
        return true;
    }

    // ========== NODE MANAGEMENT ==========
    
    /**
     * Register default node types
     */
    registerDefaultNodeTypes() {
        // Start node
        this.registerNodeType('start', {
            name: 'Start',
            category: 'control',
            icon: '▶️',
            inputs: [],
            outputs: ['next'],
            execute: async (context) => {
                context.log('Workflow started');
                return { next: context.input };
            }
        });

        // End node
        this.registerNodeType('end', {
            name: 'End',
            category: 'control',
            icon: '⏹️',
            inputs: ['input'],
            outputs: [],
            execute: async (context) => {
                context.log('Workflow completed');
                return {};
            }
        });

        // Variable set node
        this.registerNodeType('set-variable', {
            name: 'Set Variable',
            category: 'data',
            icon: '📝',
            inputs: ['input'],
            outputs: ['output'],
            properties: {
                variableName: { type: 'string', default: '' },
                value: { type: 'any', default: null }
            },
            execute: async (context) => {
                const { variableName, value } = context.properties;
                context.setVariable(variableName, value);
                context.log(`Set variable '${variableName}' = ${value}`);
                return { output: context.input };
            }
        });

        // Condition node
        this.registerNodeType('condition', {
            name: 'Condition',
            category: 'logic',
            icon: '❓',
            inputs: ['input'],
            outputs: ['true', 'false'],
            properties: {
                condition: { type: 'string', default: 'input !== null' }
            },
            execute: async (context) => {
                const { condition } = context.properties;
                const result = this.evaluateCondition(condition, context);
                context.log(`Condition '${condition}' evaluated to: ${result}`);
                
                if (result) {
                    return { true: context.input };
                } else {
                    return { false: context.input };
                }
            }
        });

        // Delay node
        this.registerNodeType('delay', {
            name: 'Delay',
            category: 'utility',
            icon: '⏰',
            inputs: ['input'],
            outputs: ['output'],
            properties: {
                duration: { type: 'number', default: 1000 }
            },
            execute: async (context) => {
                const { duration } = context.properties;
                context.log(`Delaying for ${duration}ms`);
                
                await new Promise(resolve => setTimeout(resolve, duration));
                return { output: context.input };
            }
        });

        // Log node
        this.registerNodeType('log', {
            name: 'Log Message',
            category: 'utility',
            icon: '📋',
            inputs: ['input'],
            outputs: ['output'],
            properties: {
                message: { type: 'string', default: 'Log message' },
                level: { type: 'select', options: ['info', 'warn', 'error'], default: 'info' }
            },
            execute: async (context) => {
                const { message, level } = context.properties;
                const logMessage = this.interpolateString(message, context);
                
                switch (level) {
                    case 'warn':
                        console.warn(`[Workflow] ${logMessage}`);
                        break;
                    case 'error':
                        console.error(`[Workflow] ${logMessage}`);
                        break;
                    default:
                        console.log(`[Workflow] ${logMessage}`);
                }
                
                context.log(`Logged: ${logMessage}`);
                return { output: context.input };
            }
        });
    }

    /**
     * Register a node type
     */
    registerNodeType(typeId, definition) {
        this.nodeTypes.set(typeId, {
            id: typeId,
            name: definition.name || typeId,
            category: definition.category || 'custom',
            icon: definition.icon || '🔧',
            inputs: definition.inputs || [],
            outputs: definition.outputs || [],
            properties: definition.properties || {},
            execute: definition.execute || (() => {}),
            validate: definition.validate || (() => true),
            ...definition
        });
        
        console.log(`🔧 Node type '${typeId}' registered`);
    }

    /**
     * Get node type definition
     */
    getNodeType(typeId) {
        return this.nodeTypes.get(typeId);
    }

    /**
     * Get all node types
     */
    getAllNodeTypes() {
        const types = {};
        this.nodeTypes.forEach((type, id) => {
            types[id] = type;
        });
        return types;
    }

    /**
     * Add node to workflow
     */
    addNode(workflowId, nodeConfig) {
        const workflow = this.workflows.get(workflowId);
        if (!workflow) {
            throw new Error(`Workflow '${workflowId}' not found`);
        }

        const nodeType = this.nodeTypes.get(nodeConfig.type);
        if (!nodeType) {
            throw new Error(`Node type '${nodeConfig.type}' not found`);
        }

        const node = {
            id: nodeConfig.id || this.generateId(),
            type: nodeConfig.type,
            name: nodeConfig.name || nodeType.name,
            position: nodeConfig.position || { x: 0, y: 0 },
            properties: { ...nodeType.properties },
            ...nodeConfig
        };

        // Set default property values
        Object.keys(nodeType.properties).forEach(key => {
            if (nodeConfig.properties && nodeConfig.properties[key] !== undefined) {
                node.properties[key] = nodeConfig.properties[key];
            } else {
                node.properties[key] = nodeType.properties[key].default;
            }
        });

        workflow.nodes.set(node.id, node);
        workflow.metadata.updatedAt = new Date();
        
        this.emit('nodeAdded', { workflowId, node });
        console.log(`🔧 Node '${node.name}' added to workflow '${workflow.name}'`);
        
        return node;
    }

    /**
     * Remove node from workflow
     */
    removeNode(workflowId, nodeId) {
        const workflow = this.workflows.get(workflowId);
        if (!workflow) {
            throw new Error(`Workflow '${workflowId}' not found`);
        }

        const node = workflow.nodes.get(nodeId);
        if (!node) {
            throw new Error(`Node '${nodeId}' not found in workflow`);
        }

        // Remove connections involving this node
        workflow.connections = workflow.connections.filter(conn => 
            conn.sourceNodeId !== nodeId && conn.targetNodeId !== nodeId
        );

        workflow.nodes.delete(nodeId);
        workflow.metadata.updatedAt = new Date();
        
        this.emit('nodeRemoved', { workflowId, nodeId, node });
        console.log(`🔧 Node '${node.name}' removed from workflow '${workflow.name}'`);
        
        return true;
    }

    /**
     * Add connection between nodes
     */
    addConnection(workflowId, connection) {
        const workflow = this.workflows.get(workflowId);
        if (!workflow) {
            throw new Error(`Workflow '${workflowId}' not found`);
        }

        const sourceNode = workflow.nodes.get(connection.sourceNodeId);
        const targetNode = workflow.nodes.get(connection.targetNodeId);

        if (!sourceNode || !targetNode) {
            throw new Error('Source or target node not found');
        }

        const conn = {
            id: connection.id || this.generateId(),
            sourceNodeId: connection.sourceNodeId,
            sourceOutput: connection.sourceOutput,
            targetNodeId: connection.targetNodeId,
            targetInput: connection.targetInput,
            ...connection
        };

        workflow.connections.push(conn);
        workflow.metadata.updatedAt = new Date();
        
        this.emit('connectionAdded', { workflowId, connection: conn });
        console.log(`🔧 Connection added in workflow '${workflow.name}'`);
        
        return conn;
    }

    // ========== EXECUTION ENGINE ==========
    
    /**
     * Execute workflow
     */
    async executeWorkflow(workflowId, initialData = {}) {
        const workflow = this.workflows.get(workflowId);
        if (!workflow) {
            throw new Error(`Workflow '${workflowId}' not found`);
        }

        console.log(`🔧 Starting execution of workflow '${workflow.name}'`);
        
        const executionContext = this.createExecutionContext(workflow, initialData);
        
        try {
            this.emit('workflowStarted', { workflowId, context: executionContext });
            
            // Find start node
            const startNode = Array.from(workflow.nodes.values())
                .find(node => node.type === 'start');
            
            if (!startNode) {
                throw new Error('No start node found in workflow');
            }

            // Execute from start node
            await this.executeNode(startNode, executionContext, initialData);
            
            this.emit('workflowCompleted', { workflowId, context: executionContext });
            console.log(`🔧 Workflow '${workflow.name}' completed successfully`);
            
            return executionContext.results;
            
        } catch (error) {
            this.emit('workflowFailed', { workflowId, error, context: executionContext });
            console.error(`🔧 Workflow '${workflow.name}' failed:`, error);
            throw error;
        }
    }

    /**
     * Create execution context
     */
    createExecutionContext(workflow, initialData) {
        return {
            workflowId: workflow.id,
            workflow: workflow,
            variables: new Map(workflow.variables),
            results: {},
            logs: [],
            startTime: new Date(),
            
            // Helper methods for nodes
            log: (message) => {
                const entry = {
                    timestamp: new Date(),
                    message: message
                };
                this.logs.push(entry);
                if (this.options.enableLogging) {
                    console.log(`[Workflow ${workflow.name}] ${message}`);
                }
            },
            
            setVariable: (name, value) => {
                this.variables.set(name, value);
            },
            
            getVariable: (name) => {
                return this.variables.get(name);
            },
            
            input: initialData
        };
    }

    /**
     * Execute a single node
     */
    async executeNode(node, context, input) {
        const nodeType = this.nodeTypes.get(node.type);
        if (!nodeType) {
            throw new Error(`Unknown node type: ${node.type}`);
        }

        console.log(`🔧 Executing node: ${node.name} (${node.type})`);
        
        // Create node execution context
        const nodeContext = {
            ...context,
            node: node,
            properties: { ...node.properties },
            input: input
        };

        try {
            // Execute the node
            const outputs = await nodeType.execute(nodeContext);
            
            // Process outputs and continue to connected nodes
            if (outputs && typeof outputs === 'object') {
                await this.processNodeOutputs(node, context, outputs);
            }
            
        } catch (error) {
            console.error(`🔧 Node '${node.name}' execution failed:`, error);
            throw error;
        }
    }

    /**
     * Process node outputs and continue execution
     */
    async processNodeOutputs(sourceNode, context, outputs) {
        const workflow = context.workflow;
        
        for (const [outputName, outputValue] of Object.entries(outputs)) {
            // Find connections from this output
            const connections = workflow.connections.filter(conn => 
                conn.sourceNodeId === sourceNode.id && conn.sourceOutput === outputName
            );
            
            for (const connection of connections) {
                const targetNode = workflow.nodes.get(connection.targetNodeId);
                if (targetNode) {
                    await this.executeNode(targetNode, context, outputValue);
                }
            }
        }
    }

    // ========== UTILITY METHODS ==========
    
    /**
     * Generate unique ID
     */
    generateId() {
        return 'wf_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now().toString(36);
    }

    /**
     * Evaluate condition string
     */
    evaluateCondition(condition, context) {
        try {
            // Simple condition evaluation (in production, use a proper expression parser)
            const func = new Function('input', 'getVariable', `return ${condition}`);
            return func(context.input, context.getVariable.bind(context));
        } catch (error) {
            console.warn(`Failed to evaluate condition '${condition}':`, error);
            return false;
        }
    }

    /**
     * Interpolate string with context variables
     */
    interpolateString(template, context) {
        return template.replace(/\{\{([^}]+)\}\}/g, (match, expression) => {
            try {
                const func = new Function('input', 'getVariable', `return ${expression.trim()}`);
                return func(context.input, context.getVariable.bind(context));
            } catch (error) {
                console.warn(`Failed to interpolate '${expression}':`, error);
                return match;
            }
        });
    }

    /**
     * Event system methods
     */
    on(eventName, callback) {
        this.eventBus.addEventListener(eventName, callback);
    }

    off(eventName, callback) {
        this.eventBus.removeEventListener(eventName, callback);
    }

    emit(eventName, data) {
        this.eventBus.dispatchEvent(new CustomEvent(eventName, { detail: data }));
    }

    /**
     * Get workflow statistics
     */
    getStats() {
        return {
            workflowCount: this.workflows.size,
            nodeTypeCount: this.nodeTypes.size,
            totalNodes: Array.from(this.workflows.values())
                .reduce((sum, workflow) => sum + workflow.nodes.size, 0)
        };
    }

    /**
     * Destroy workflow system
     */
    destroy() {
        this.workflows.clear();
        this.nodeTypes.clear();
        this.executionQueue = [];
        this.isExecuting = false;
        
        console.log('🔧 Workflow Foundation destroyed');
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = WorkflowFoundation;
} else {
    window.WorkflowFoundation = WorkflowFoundation;
}

console.log('🔧 Workflow Foundation (Part 2A1) loaded - Basic Workflow Foundation');
