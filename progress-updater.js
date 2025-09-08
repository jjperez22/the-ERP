/**
 * Step-by-Step Progress Updates
 * Implements functionality to update progress bars and step indicators in real-time
 */

class ProgressUpdater {
    constructor(tracker) {
        this.tracker = tracker;
        this.elements = {};
        this.animationId = null;
        this.updateInterval = 100; // Update every 100ms
        this.isUpdating = false;
        
        this.init();
    }
    
    init() {
        this.bindElements();
        this.setupEventListeners();
    }
    
    bindElements() {
        // Main progress elements
        this.elements.progressBar = document.getElementById('progressBar');
        this.elements.progressLabel = document.getElementById('progressLabel');
        this.elements.progressPercentage = document.getElementById('progressPercentage');
        this.elements.statusText = document.getElementById('statusText');
        this.elements.statusMessage = document.getElementById('statusMessage');
        
        // Step elements
        this.elements.installationSteps = document.getElementById('installationSteps');
        this.elements.stepItems = document.querySelectorAll('.step-item');
        
        // Button elements
        this.elements.actionButton = document.getElementById('actionButton');
        this.elements.cancelButton = document.getElementById('cancelButton');
        
        // Modal elements
        this.elements.modalTitle = document.getElementById('modalTitle');
    }
    
    setupEventListeners() {
        if (!this.tracker) return;
        
        // Listen to tracker events
        this.tracker.on('progressStarted', (data) => this.handleProgressStarted(data));
        this.tracker.on('progressStopped', (data) => this.handleProgressStopped(data));
        this.tracker.on('progressPaused', (data) => this.handleProgressPaused(data));
        this.tracker.on('progressResumed', (data) => this.handleProgressResumed(data));
        this.tracker.on('stepStarted', (data) => this.handleStepStarted(data));
        this.tracker.on('stepCompleted', (data) => this.handleStepCompleted(data));
        this.tracker.on('stepError', (data) => this.handleStepError(data));
        this.tracker.on('progressReset', () => this.handleProgressReset());
    }
    
    // Main Progress Updates
    updateProgress() {
        if (!this.tracker || !this.isUpdating) return;
        
        const progressData = this.tracker.getProgressData();
        
        // Update progress bar
        this.updateProgressBar(progressData.percentage);
        
        // Update progress label and percentage
        this.updateProgressLabels(progressData);
        
        // Update status message
        this.updateStatusMessage(progressData);
        
        // Update steps
        this.updateSteps(progressData.steps);
        
        // Update buttons
        this.updateButtons(progressData);
        
        // Continue updating if still active
        if (progressData.isActive) {
            this.animationId = requestAnimationFrame(() => this.updateProgress());
        }
    }
    
    updateProgressBar(percentage) {
        if (!this.elements.progressBar) return;
        
        // Smooth animation to new percentage
        const currentWidth = parseFloat(this.elements.progressBar.style.width) || 0;
        const targetWidth = Math.max(0, Math.min(100, percentage));
        
        // Animate if there's a significant change
        if (Math.abs(targetWidth - currentWidth) > 0.5) {
            this.animateProgressBar(currentWidth, targetWidth);
        }
    }
    
    animateProgressBar(fromWidth, toWidth) {
        const duration = 300; // 300ms animation
        const startTime = performance.now();
        
        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Easing function (ease-out)
            const eased = 1 - Math.pow(1 - progress, 3);
            const currentWidth = fromWidth + (toWidth - fromWidth) * eased;
            
            this.elements.progressBar.style.width = `${currentWidth}%`;
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };
        
        requestAnimationFrame(animate);
    }
    
    updateProgressLabels(progressData) {
        const currentStep = this.tracker.getCurrentStep();
        
        // Update progress label
        if (this.elements.progressLabel && currentStep) {
            this.elements.progressLabel.textContent = currentStep.title;
        }
        
        // Update percentage
        if (this.elements.progressPercentage) {
            this.elements.progressPercentage.textContent = `${Math.round(progressData.percentage)}%`;
        }
    }
    
    updateStatusMessage(progressData) {
        if (!this.elements.statusText || !this.elements.statusMessage) return;
        
        const currentStep = this.tracker.getCurrentStep();
        
        if (progressData.hasError) {
            const failedStep = this.tracker.getFailedSteps()[0];
            this.elements.statusText.textContent = failedStep ? failedStep.error : 'Installation failed';
            this.setStatusMessageType('error');
        } else if (progressData.isPaused) {
            this.elements.statusText.textContent = 'Installation paused';
            this.setStatusMessageType('warning');
        } else if (progressData.isActive && currentStep) {
            this.elements.statusText.textContent = currentStep.description;
            this.setStatusMessageType('info');
        } else if (this.tracker.isCompleted()) {
            this.elements.statusText.textContent = 'Installation completed successfully!';
            this.setStatusMessageType('success');
        }
    }
    
    setStatusMessageType(type) {
        if (!this.elements.statusMessage) return;
        
        // Remove existing type classes
        this.elements.statusMessage.className = this.elements.statusMessage.className
            .replace(/status-(info|success|warning|error)/g, '');
        
        // Add new type class
        this.elements.statusMessage.classList.add(`status-${type}`);
        
        // Update icon
        const iconElement = this.elements.statusMessage.querySelector('.status-icon');
        if (iconElement) {
            const icons = {
                info: 'ℹ️',
                success: '✅',
                warning: '⚠️',
                error: '❌'
            };
            iconElement.textContent = icons[type] || 'ℹ️';
        }
    }
    
    // Step Updates
    updateSteps(steps) {
        if (!this.elements.stepItems) return;
        
        this.elements.stepItems.forEach((stepElement, index) => {
            if (index < steps.length) {
                this.updateStepElement(stepElement, steps[index], index);
            }
        });
    }
    
    updateStepElement(element, step, index) {
        const iconElement = element.querySelector('.step-icon');
        const titleElement = element.querySelector('.step-title');
        const descriptionElement = element.querySelector('.step-description');
        
        // Update step status class
        this.updateStepStatus(element, step, index);
        
        // Update icon
        if (iconElement) {
            this.updateStepIcon(iconElement, step, index);
        }
        
        // Update title color based on status
        if (titleElement) {
            this.updateStepTitle(titleElement, step);
        }
        
        // Update description if needed
        if (descriptionElement && step.description) {
            descriptionElement.textContent = step.description;
        }
    }
    
    updateStepStatus(element, step, index) {
        // Remove existing status classes
        element.classList.remove('step-pending', 'step-current', 'step-completed', 'step-error');
        
        // Add appropriate status class
        if (step.status === 'error') {
            element.classList.add('step-error');
        } else if (step.status === 'completed') {
            element.classList.add('step-completed');
        } else if (index === this.tracker.currentStep && this.tracker.isActive) {
            element.classList.add('step-current');
        } else {
            element.classList.add('step-pending');
        }
    }
    
    updateStepIcon(iconElement, step, index) {
        // Remove existing status classes from icon
        iconElement.className = iconElement.className.replace(/step-(pending|current|completed|error)/g, '');
        
        // Update icon content and class
        if (step.status === 'error') {
            iconElement.classList.add('step-error');
            iconElement.textContent = '✗';
        } else if (step.status === 'completed') {
            iconElement.classList.add('step-completed');
            iconElement.textContent = '✓';
        } else if (index === this.tracker.currentStep && this.tracker.isActive) {
            iconElement.classList.add('step-current');
            iconElement.textContent = index + 1;
        } else {
            iconElement.classList.add('step-pending');
            iconElement.textContent = index + 1;
        }
    }
    
    updateStepTitle(titleElement, step) {
        // Remove existing status classes
        titleElement.classList.remove('step-current', 'step-completed', 'step-error');
        
        // Add appropriate class
        if (step.status === 'error') {
            titleElement.classList.add('step-error');
        } else if (step.status === 'completed') {
            titleElement.classList.add('step-completed');
        } else if (step.status === 'current') {
            titleElement.classList.add('step-current');
        }
    }
    
    // Button Updates
    updateButtons(progressData) {
        if (this.elements.actionButton) {
            this.updateActionButton(progressData);
        }
        
        if (this.elements.cancelButton) {
            this.updateCancelButton(progressData);
        }
    }
    
    updateActionButton(progressData) {
        const button = this.elements.actionButton;
        
        if (this.tracker.isCompleted()) {
            button.innerHTML = 'Done';
            button.className = 'btn btn-success';
            button.disabled = false;
        } else if (progressData.hasError) {
            button.innerHTML = 'Retry';
            button.className = 'btn btn-warning';
            button.disabled = false;
        } else if (progressData.isPaused) {
            button.innerHTML = '▶️ Resume';
            button.className = 'btn btn-primary';
            button.disabled = false;
        } else if (progressData.isActive) {
            button.innerHTML = `
                <span class="loading-spinner"></span>
                Installing...
            `;
            button.className = 'btn btn-primary';
            button.disabled = true;
        } else {
            button.innerHTML = '📥 Install';
            button.className = 'btn btn-primary';
            button.disabled = false;
        }
    }
    
    updateCancelButton(progressData) {
        const button = this.elements.cancelButton;
        
        if (this.tracker.isCompleted()) {
            button.style.display = 'none';
        } else if (progressData.isActive) {
            button.textContent = progressData.isPaused ? 'Stop' : 'Pause';
            button.disabled = false;
            button.style.display = 'inline-flex';
        } else {
            button.textContent = 'Cancel';
            button.disabled = false;
            button.style.display = 'inline-flex';
        }
    }
    
    // Event Handlers
    handleProgressStarted(data) {
        this.isUpdating = true;
        
        if (this.elements.modalTitle) {
            this.elements.modalTitle.textContent = 'Installing Module';
        }
        
        this.updateProgress();
    }
    
    handleProgressStopped(data) {
        this.isUpdating = false;
        
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
        
        // Final update
        this.updateProgress();
        
        if (this.elements.modalTitle) {
            const title = data.completed ? 'Installation Complete' : 'Installation Stopped';
            this.elements.modalTitle.textContent = title;
        }
    }
    
    handleProgressPaused(data) {
        if (this.elements.modalTitle) {
            this.elements.modalTitle.textContent = 'Installation Paused';
        }
    }
    
    handleProgressResumed(data) {
        if (this.elements.modalTitle) {
            this.elements.modalTitle.textContent = 'Installing Module';
        }
    }
    
    handleStepStarted(data) {
        // Update specific step to current status
        const stepIndex = this.tracker.steps.findIndex(s => s.id === data.stepId);
        if (stepIndex >= 0 && this.elements.stepItems[stepIndex]) {
            this.updateStepElement(this.elements.stepItems[stepIndex], data.step, stepIndex);
        }
    }
    
    handleStepCompleted(data) {
        // Update specific step to completed status
        const stepIndex = this.tracker.steps.findIndex(s => s.id === data.stepId);
        if (stepIndex >= 0 && this.elements.stepItems[stepIndex]) {
            this.updateStepElement(this.elements.stepItems[stepIndex], data.step, stepIndex);
        }
        
        // Add completion animation
        this.animateStepCompletion(stepIndex);
    }
    
    handleStepError(data) {
        // Update specific step to error status
        const stepIndex = this.tracker.steps.findIndex(s => s.id === data.stepId);
        if (stepIndex >= 0 && this.elements.stepItems[stepIndex]) {
            this.updateStepElement(this.elements.stepItems[stepIndex], data.step, stepIndex);
        }
        
        // Add error animation
        this.animateStepError(stepIndex);
    }
    
    handleProgressReset() {
        this.isUpdating = false;
        
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
        
        // Reset UI elements
        this.resetUI();
    }
    
    // Animation Methods
    animateStepCompletion(stepIndex) {
        if (!this.elements.stepItems[stepIndex]) return;
        
        const stepElement = this.elements.stepItems[stepIndex];
        stepElement.style.transform = 'scale(1.05)';
        stepElement.style.transition = 'transform 0.2s ease';
        
        setTimeout(() => {
            stepElement.style.transform = 'scale(1)';
        }, 200);
    }
    
    animateStepError(stepIndex) {
        if (!this.elements.stepItems[stepIndex]) return;
        
        const stepElement = this.elements.stepItems[stepIndex];
        stepElement.style.animation = 'shake 0.5s ease-in-out';
        
        setTimeout(() => {
            stepElement.style.animation = '';
        }, 500);
    }
    
    // Utility Methods
    resetUI() {
        // Reset progress bar
        if (this.elements.progressBar) {
            this.elements.progressBar.style.width = '0%';
        }
        
        // Reset labels
        if (this.elements.progressLabel) {
            this.elements.progressLabel.textContent = 'Initializing...';
        }
        
        if (this.elements.progressPercentage) {
            this.elements.progressPercentage.textContent = '0%';
        }
        
        // Reset status message
        if (this.elements.statusText) {
            this.elements.statusText.textContent = 'Preparing installation...';
        }
        
        this.setStatusMessageType('info');
        
        // Reset steps
        this.elements.stepItems.forEach((stepElement, index) => {
            this.resetStepElement(stepElement, index);
        });
        
        // Reset modal title
        if (this.elements.modalTitle) {
            this.elements.modalTitle.textContent = 'Install Module';
        }
    }
    
    resetStepElement(element, index) {
        // Reset classes
        element.className = 'step-item';
        if (index === 0) {
            element.classList.add('step-current');
        } else {
            element.classList.add('step-pending');
        }
        
        // Reset icon
        const iconElement = element.querySelector('.step-icon');
        if (iconElement) {
            iconElement.className = index === 0 ? 'step-icon step-current' : 'step-icon step-pending';
            iconElement.textContent = index + 1;
        }
        
        // Reset title
        const titleElement = element.querySelector('.step-title');
        if (titleElement) {
            titleElement.className = 'step-title';
        }
    }
    
    // Public Methods
    forceUpdate() {
        if (this.tracker) {
            this.updateProgress();
        }
    }
    
    destroy() {
        this.isUpdating = false;
        
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
        
        // Remove event listeners if needed
        // (The tracker handles this automatically)
    }
}

// CSS for animations (add to page if not already present)
const animationStyles = `
@keyframes shake {
    0%, 100% { transform: translateX(0); }
    25% { transform: translateX(-5px); }
    75% { transform: translateX(5px); }
}
`;

// Add styles to page
if (typeof document !== 'undefined' && !document.getElementById('progress-animations')) {
    const style = document.createElement('style');
    style.id = 'progress-animations';
    style.textContent = animationStyles;
    document.head.appendChild(style);
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ProgressUpdater };
}
