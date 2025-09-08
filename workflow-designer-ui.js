/**
 * Visual Workflow Designer UI Components - Part 2A2b
 * Provides drag-and-drop interface for creating workflows visually
 */

class WorkflowDesignerUI {
    constructor(containerId, workflowEngine) {
        this.container = document.getElementById(containerId);
        this.workflowEngine = workflowEngine;
        this.canvas = null;
        this.ctx = null;
        this.nodes = new Map();
        this.connections = [];
        this.selectedNode = null;
        this.draggedNode = null;
        this.isDragging = false;
        this.dragOffset = { x: 0, y: 0 };
        this.scale = 1;
        this.pan = { x: 0, y: 0 };
        
        this.init();
    }
    
    init() {
        this.createUI();
        this.setupCanvas();
        this.setupEventListeners();
        this.setupNodePalette();
    }
    
    createUI() {
        this.container.innerHTML = `
            <div class="workflow-designer">
                <div class="designer-toolbar">
                    <button id="newWorkflow" class="btn btn-primary">New</button>
                    <button id="saveWorkflow" class="btn btn-success">Save</button>
                    <button id="loadWorkflow" class="btn btn-info">Load</button>
                    <button id="runWorkflow" class="btn btn-warning">Run</button>
                    <div class="zoom-controls">
                        <button id="zoomIn" class="btn btn-sm">+</button>
                        <span id="zoomLevel">100%</span>
                        <button id="zoomOut" class="btn btn-sm">-</button>
                    </div>
                </div>
                
                <div class="designer-main">
                    <div class="node-palette">
                        <h4>Node Types</h4>
                        <div class="palette-category">
                            <h5>Data Nodes</h5>
                            <div class="palette-nodes" id="dataNodesTool"></div>
                        </div>
                        <div class="palette-category">
                            <h5>Logic Nodes</h5>
                            <div class="palette-nodes" id="logicNodesTool"></div>
                        </div>
                        <div class="palette-category">
                            <h5>Action Nodes</h5>
                            <div class="palette-nodes" id="actionNodesTool"></div>
                        </div>
                    </div>
                    
                    <div class="canvas-container">
                        <canvas id="workflowCanvas" width="1200" height="800"></canvas>
                    </div>
                    
                    <div class="properties-panel">
                        <h4>Properties</h4>
                        <div id="nodeProperties"></div>
                    </div>
                </div>
            </div>
        `;
    }
    
    setupCanvas() {
        this.canvas = document.getElementById('workflowCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        // Set up high DPI support
        const rect = this.canvas.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        this.canvas.width = rect.width * dpr;
        this.canvas.height = rect.height * dpr;
        this.ctx.scale(dpr, dpr);
        this.canvas.style.width = rect.width + 'px';
        this.canvas.style.height = rect.height + 'px';
    }
    
    setupEventListeners() {
        // Canvas mouse events
        this.canvas.addEventListener('mousedown', this.handleMouseDown.bind(this));
        this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
        this.canvas.addEventListener('mouseup', this.handleMouseUp.bind(this));
        this.canvas.addEventListener('wheel', this.handleWheel.bind(this));
        this.canvas.addEventListener('dblclick', this.handleDoubleClick.bind(this));
        
        // Toolbar events
        document.getElementById('newWorkflow').addEventListener('click', () => this.newWorkflow());
        document.getElementById('saveWorkflow').addEventListener('click', () => this.saveWorkflow());
        document.getElementById('loadWorkflow').addEventListener('click', () => this.loadWorkflow());
        document.getElementById('runWorkflow').addEventListener('click', () => this.runWorkflow());
        document.getElementById('zoomIn').addEventListener('click', () => this.zoom(1.2));
        document.getElementById('zoomOut').addEventListener('click', () => this.zoom(0.8));
        
        // Keyboard events
        document.addEventListener('keydown', this.handleKeyDown.bind(this));
    }
    
    setupNodePalette() {
        const dataNodes = [
            { type: 'ProjectDataNode', name: 'Project Data', icon: '📊' },
            { type: 'TaskDataNode', name: 'Task Data', icon: '📋' },
            { type: 'ResourceDataNode', name: 'Resource Data', icon: '🔧' }
        ];
        
        const logicNodes = [
            { type: 'ConditionNode', name: 'Condition', icon: '❓' },
            { type: 'FilterNode', name: 'Filter', icon: '🔍' },
            { type: 'TransformNode', name: 'Transform', icon: '🔄' }
        ];
        
        const actionNodes = [
            { type: 'EmailNode', name: 'Send Email', icon: '📧' },
            { type: 'UpdateNode', name: 'Update Data', icon: '✏️' },
            { type: 'CreateNode', name: 'Create Record', icon: '➕' }
        ];
        
        this.createPaletteSection('dataNodesTool', dataNodes);
        this.createPaletteSection('logicNodesTool', logicNodes);
        this.createPaletteSection('actionNodesTool', actionNodes);
    }
    
    createPaletteSection(containerId, nodes) {
        const container = document.getElementById(containerId);
        nodes.forEach(nodeType => {
            const nodeElement = document.createElement('div');
            nodeElement.className = 'palette-node';
            nodeElement.draggable = true;
            nodeElement.innerHTML = `
                <span class="node-icon">${nodeType.icon}</span>
                <span class="node-name">${nodeType.name}</span>
            `;
            nodeElement.dataset.nodeType = nodeType.type;
            
            nodeElement.addEventListener('dragstart', (e) => {
                e.dataTransfer.setData('text/plain', nodeType.type);
            });
            
            container.appendChild(nodeElement);
        });
    }
    
    handleMouseDown(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = (e.clientX - rect.left) / this.scale - this.pan.x;
        const y = (e.clientY - rect.top) / this.scale - this.pan.y;
        
        const clickedNode = this.getNodeAtPosition(x, y);
        
        if (clickedNode) {
            this.selectedNode = clickedNode;
            this.draggedNode = clickedNode;
            this.isDragging = true;
            this.dragOffset.x = x - clickedNode.x;
            this.dragOffset.y = y - clickedNode.y;
            this.showNodeProperties(clickedNode);
        } else {
            this.selectedNode = null;
            this.clearNodeProperties();
        }
        
        this.redraw();
    }
    
    handleMouseMove(e) {
        if (!this.isDragging || !this.draggedNode) return;
        
        const rect = this.canvas.getBoundingClientRect();
        const x = (e.clientX - rect.left) / this.scale - this.pan.x;
        const y = (e.clientY - rect.top) / this.scale - this.pan.y;
        
        this.draggedNode.x = x - this.dragOffset.x;
        this.draggedNode.y = y - this.dragOffset.y;
        
        this.redraw();
    }
    
    handleMouseUp(e) {
        this.isDragging = false;
        this.draggedNode = null;
    }
    
    handleWheel(e) {
        e.preventDefault();
        const delta = e.deltaY > 0 ? 0.9 : 1.1;
        this.zoom(delta);
    }
    
    handleDoubleClick(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = (e.clientX - rect.left) / this.scale - this.pan.x;
        const y = (e.clientY - rect.top) / this.scale - this.pan.y;
        
        const clickedNode = this.getNodeAtPosition(x, y);
        if (clickedNode) {
            this.editNode(clickedNode);
        }
    }
    
    handleKeyDown(e) {
        if (e.key === 'Delete' && this.selectedNode) {
            this.deleteNode(this.selectedNode);
        } else if (e.key === 'Escape') {
            this.selectedNode = null;
            this.clearNodeProperties();
            this.redraw();
        }
    }
    
    getNodeAtPosition(x, y) {
        for (const [id, node] of this.nodes) {
            if (x >= node.x && x <= node.x + node.width &&
                y >= node.y && y <= node.y + node.height) {
                return node;
            }
        }
        return null;
    }
    
    addNode(type, x, y) {
        const nodeId = 'node_' + Date.now();
        const node = {
            id: nodeId,
            type: type,
            x: x,
            y: y,
            width: 120,
            height: 60,
            properties: {},
            inputs: [],
            outputs: []
        };
        
        // Configure node based on type
        this.configureNodeType(node);
        
        this.nodes.set(nodeId, node);
        this.redraw();
        return node;
    }
    
    configureNodeType(node) {
        switch (node.type) {
            case 'ProjectDataNode':
                node.inputs = [];
                node.outputs = ['data'];
                node.properties = { projectId: '', fields: ['name', 'status', 'budget'] };
                break;
            case 'TaskDataNode':
                node.inputs = [];
                node.outputs = ['data'];
                node.properties = { projectId: '', taskId: '', fields: ['name', 'status', 'assignee'] };
                break;
            case 'ConditionNode':
                node.inputs = ['data'];
                node.outputs = ['true', 'false'];
                node.properties = { condition: '', operator: 'equals', value: '' };
                break;
            case 'EmailNode':
                node.inputs = ['trigger'];
                node.outputs = ['sent'];
                node.properties = { to: '', subject: '', template: '' };
                break;
            // Add more node type configurations
        }
    }
    
    deleteNode(node) {
        this.nodes.delete(node.id);
        // Remove connections involving this node
        this.connections = this.connections.filter(conn => 
            conn.from.nodeId !== node.id && conn.to.nodeId !== node.id
        );
        this.selectedNode = null;
        this.clearNodeProperties();
        this.redraw();
    }
    
    zoom(factor) {
        this.scale *= factor;
        this.scale = Math.max(0.1, Math.min(3, this.scale));
        document.getElementById('zoomLevel').textContent = Math.round(this.scale * 100) + '%';
        this.redraw();
    }
    
    redraw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.ctx.save();
        this.ctx.scale(this.scale, this.scale);
        this.ctx.translate(this.pan.x, this.pan.y);
        
        // Draw grid
        this.drawGrid();
        
        // Draw connections
        this.drawConnections();
        
        // Draw nodes
        this.drawNodes();
        
        this.ctx.restore();
    }
    
    drawGrid() {
        this.ctx.strokeStyle = '#e0e0e0';
        this.ctx.lineWidth = 1;
        
        const gridSize = 20;
        const width = this.canvas.width / this.scale;
        const height = this.canvas.height / this.scale;
        
        for (let x = 0; x < width; x += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, height);
            this.ctx.stroke();
        }
        
        for (let y = 0; y < height; y += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(width, y);
            this.ctx.stroke();
        }
    }
    
    drawConnections() {
        this.ctx.strokeStyle = '#333';
        this.ctx.lineWidth = 2;
        
        this.connections.forEach(conn => {
            const fromNode = this.nodes.get(conn.from.nodeId);
            const toNode = this.nodes.get(conn.to.nodeId);
            
            if (fromNode && toNode) {
                const fromX = fromNode.x + fromNode.width;
                const fromY = fromNode.y + fromNode.height / 2;
                const toX = toNode.x;
                const toY = toNode.y + toNode.height / 2;
                
                this.ctx.beginPath();
                this.ctx.moveTo(fromX, fromY);
                this.ctx.bezierCurveTo(
                    fromX + 50, fromY,
                    toX - 50, toY,
                    toX, toY
                );
                this.ctx.stroke();
                
                // Draw arrow
                this.drawArrow(toX - 10, toY);
            }
        });
    }
    
    drawArrow(x, y) {
        this.ctx.fillStyle = '#333';
        this.ctx.beginPath();
        this.ctx.moveTo(x, y);
        this.ctx.lineTo(x - 8, y - 4);
        this.ctx.lineTo(x - 8, y + 4);
        this.ctx.closePath();
        this.ctx.fill();
    }
    
    drawNodes() {
        this.nodes.forEach(node => {
            // Node background
            this.ctx.fillStyle = node === this.selectedNode ? '#e3f2fd' : '#f5f5f5';
            this.ctx.strokeStyle = node === this.selectedNode ? '#2196f3' : '#ccc';
            this.ctx.lineWidth = 2;
            
            this.ctx.fillRect(node.x, node.y, node.width, node.height);
            this.ctx.strokeRect(node.x, node.y, node.width, node.height);
            
            // Node text
            this.ctx.fillStyle = '#333';
            this.ctx.font = '12px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(
                this.getNodeDisplayName(node.type),
                node.x + node.width / 2,
                node.y + node.height / 2 + 4
            );
            
            // Draw connection points
            this.drawConnectionPoints(node);
        });
    }
    
    drawConnectionPoints(node) {
        this.ctx.fillStyle = '#666';
        const pointSize = 6;
        
        // Input points (left side)
        node.inputs.forEach((input, index) => {
            const y = node.y + (node.height / (node.inputs.length + 1)) * (index + 1);
            this.ctx.fillRect(node.x - pointSize/2, y - pointSize/2, pointSize, pointSize);
        });
        
        // Output points (right side)
        node.outputs.forEach((output, index) => {
            const y = node.y + (node.height / (node.outputs.length + 1)) * (index + 1);
            this.ctx.fillRect(node.x + node.width - pointSize/2, y - pointSize/2, pointSize, pointSize);
        });
    }
    
    getNodeDisplayName(type) {
        const names = {
            'ProjectDataNode': 'Project Data',
            'TaskDataNode': 'Task Data',
            'ResourceDataNode': 'Resource Data',
            'ConditionNode': 'Condition',
            'FilterNode': 'Filter',
            'TransformNode': 'Transform',
            'EmailNode': 'Send Email',
            'UpdateNode': 'Update Data',
            'CreateNode': 'Create Record'
        };
        return names[type] || type;
    }
    
    showNodeProperties(node) {
        const panel = document.getElementById('nodeProperties');
        panel.innerHTML = `
            <h5>${this.getNodeDisplayName(node.type)}</h5>
            <div class="property-form">
                <label>Node ID:</label>
                <input type="text" value="${node.id}" readonly>
                
                <label>Type:</label>
                <input type="text" value="${node.type}" readonly>
                
                ${this.generatePropertyFields(node)}
                
                <button onclick="workflowDesigner.updateNodeProperties('${node.id}')" class="btn btn-primary btn-sm">Update</button>
            </div>
        `;
    }
    
    generatePropertyFields(node) {
        let fields = '';
        for (const [key, value] of Object.entries(node.properties)) {
            fields += `
                <label>${key}:</label>
                <input type="text" id="prop_${key}" value="${value}">
            `;
        }
        return fields;
    }
    
    updateNodeProperties(nodeId) {
        const node = this.nodes.get(nodeId);
        if (!node) return;
        
        for (const key in node.properties) {
            const input = document.getElementById(`prop_${key}`);
            if (input) {
                node.properties[key] = input.value;
            }
        }
        
        this.redraw();
    }
    
    clearNodeProperties() {
        document.getElementById('nodeProperties').innerHTML = '<p>Select a node to view properties</p>';
    }
    
    editNode(node) {
        // Open detailed node editor modal
        this.showNodeEditor(node);
    }
    
    showNodeEditor(node) {
        // Create modal for detailed node editing
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <span class="close">&times;</span>
                <h3>Edit ${this.getNodeDisplayName(node.type)}</h3>
                <div class="node-editor">
                    ${this.generateDetailedPropertyEditor(node)}
                </div>
                <div class="modal-actions">
                    <button onclick="this.closest('.modal').remove()" class="btn btn-secondary">Cancel</button>
                    <button onclick="workflowDesigner.saveNodeEdits('${node.id}', this.closest('.modal'))" class="btn btn-primary">Save</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        modal.style.display = 'block';
        
        modal.querySelector('.close').onclick = () => modal.remove();
    }
    
    generateDetailedPropertyEditor(node) {
        // Generate detailed property editor based on node type
        switch (node.type) {
            case 'ProjectDataNode':
                return this.generateProjectDataEditor(node);
            case 'ConditionNode':
                return this.generateConditionEditor(node);
            case 'EmailNode':
                return this.generateEmailEditor(node);
            default:
                return this.generateGenericEditor(node);
        }
    }
    
    generateProjectDataEditor(node) {
        return `
            <label>Project ID:</label>
            <input type="text" id="edit_projectId" value="${node.properties.projectId || ''}">
            
            <label>Fields to Include:</label>
            <select multiple id="edit_fields">
                <option value="name" ${node.properties.fields.includes('name') ? 'selected' : ''}>Name</option>
                <option value="status" ${node.properties.fields.includes('status') ? 'selected' : ''}>Status</option>
                <option value="budget" ${node.properties.fields.includes('budget') ? 'selected' : ''}>Budget</option>
                <option value="startDate" ${node.properties.fields.includes('startDate') ? 'selected' : ''}>Start Date</option>
                <option value="endDate" ${node.properties.fields.includes('endDate') ? 'selected' : ''}>End Date</option>
            </select>
        `;
    }
    
    generateConditionEditor(node) {
        return `
            <label>Condition Field:</label>
            <input type="text" id="edit_condition" value="${node.properties.condition || ''}">
            
            <label>Operator:</label>
            <select id="edit_operator">
                <option value="equals" ${node.properties.operator === 'equals' ? 'selected' : ''}>Equals</option>
                <option value="notEquals" ${node.properties.operator === 'notEquals' ? 'selected' : ''}>Not Equals</option>
                <option value="greaterThan" ${node.properties.operator === 'greaterThan' ? 'selected' : ''}>Greater Than</option>
                <option value="lessThan" ${node.properties.operator === 'lessThan' ? 'selected' : ''}>Less Than</option>
                <option value="contains" ${node.properties.operator === 'contains' ? 'selected' : ''}>Contains</option>
            </select>
            
            <label>Value:</label>
            <input type="text" id="edit_value" value="${node.properties.value || ''}">
        `;
    }
    
    generateEmailEditor(node) {
        return `
            <label>To:</label>
            <input type="text" id="edit_to" value="${node.properties.to || ''}">
            
            <label>Subject:</label>
            <input type="text" id="edit_subject" value="${node.properties.subject || ''}">
            
            <label>Template:</label>
            <textarea id="edit_template" rows="4">${node.properties.template || ''}</textarea>
        `;
    }
    
    generateGenericEditor(node) {
        let fields = '';
        for (const [key, value] of Object.entries(node.properties)) {
            fields += `
                <label>${key}:</label>
                <input type="text" id="edit_${key}" value="${value}">
            `;
        }
        return fields;
    }
    
    saveNodeEdits(nodeId, modal) {
        const node = this.nodes.get(nodeId);
        if (!node) return;
        
        // Save properties based on node type
        switch (node.type) {
            case 'ProjectDataNode':
                node.properties.projectId = modal.querySelector('#edit_projectId').value;
                node.properties.fields = Array.from(modal.querySelector('#edit_fields').selectedOptions).map(opt => opt.value);
                break;
            case 'ConditionNode':
                node.properties.condition = modal.querySelector('#edit_condition').value;
                node.properties.operator = modal.querySelector('#edit_operator').value;
                node.properties.value = modal.querySelector('#edit_value').value;
                break;
            case 'EmailNode':
                node.properties.to = modal.querySelector('#edit_to').value;
                node.properties.subject = modal.querySelector('#edit_subject').value;
                node.properties.template = modal.querySelector('#edit_template').value;
                break;
        }
        
        modal.remove();
        this.redraw();
    }
    
    // Workflow management methods
    newWorkflow() {
        this.nodes.clear();
        this.connections = [];
        this.selectedNode = null;
        this.clearNodeProperties();
        this.redraw();
    }
    
    saveWorkflow() {
        const workflow = {
            nodes: Array.from(this.nodes.entries()).map(([id, node]) => ({...node})),
            connections: [...this.connections]
        };
        
        const dataStr = JSON.stringify(workflow, null, 2);
        const dataBlob = new Blob([dataStr], {type: 'application/json'});
        const url = URL.createObjectURL(dataBlob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = 'workflow.json';
        link.click();
        
        URL.revokeObjectURL(url);
    }
    
    loadWorkflow() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (!file) return;
            
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const workflow = JSON.parse(e.target.result);
                    this.nodes.clear();
                    workflow.nodes.forEach(node => {
                        this.nodes.set(node.id, node);
                    });
                    this.connections = workflow.connections;
                    this.selectedNode = null;
                    this.clearNodeProperties();
                    this.redraw();
                } catch (error) {
                    alert('Error loading workflow: ' + error.message);
                }
            };
            reader.readAsText(file);
        };
        
        input.click();
    }
    
    runWorkflow() {
        // Convert visual workflow to executable workflow
        const executableWorkflow = this.convertToExecutableWorkflow();
        
        // Execute using workflow engine
        this.workflowEngine.executeWorkflow(executableWorkflow)
            .then(result => {
                alert('Workflow executed successfully!');
                console.log('Workflow result:', result);
            })
            .catch(error => {
                alert('Workflow execution failed: ' + error.message);
                console.error('Workflow error:', error);
            });
    }
    
    convertToExecutableWorkflow() {
        // Convert visual representation to executable workflow format
        const workflow = {
            id: 'visual_workflow_' + Date.now(),
            nodes: [],
            connections: []
        };
        
        // Convert nodes
        this.nodes.forEach(visualNode => {
            const executableNode = {
                id: visualNode.id,
                type: visualNode.type,
                config: visualNode.properties,
                position: { x: visualNode.x, y: visualNode.y }
            };
            workflow.nodes.push(executableNode);
        });
        
        // Convert connections
        workflow.connections = this.connections.map(conn => ({
            from: conn.from,
            to: conn.to
        }));
        
        return workflow;
    }
}

// Global instance for easy access
let workflowDesigner;

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Check if workflow engine is available
    if (typeof WorkflowEngine !== 'undefined') {
        const workflowEngine = new WorkflowEngine();
        workflowDesigner = new WorkflowDesignerUI('workflowDesignerContainer', workflowEngine);
    } else {
        console.warn('WorkflowEngine not found. Please include workflow-foundation.js first.');
    }
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { WorkflowDesignerUI };
}
