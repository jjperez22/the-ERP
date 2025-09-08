/**
 * Progress Event Handlers
 * Event handling for installation start, step completion, and error states
 */

class ProgressEventHandler {
    constructor(tracker, updater) {
        this.tracker = tracker;
        this.updater = updater;
        this.installationPromise = null;
        this.stepPromises = new Map();
        this.isSimulatingInstallation = false;
        this.simulationSpeed = 1; // 1 = normal, 2 = fast, 0.5 = slow
        
        this.init();
    }
    
    init() {
        this.setupButtonHandlers();
        this.setupTrackerEvents();
    }
    
    setupButtonHandlers() {
        // Action button handler
        const actionButton = document.getElementById('actionButton');
        if (actionButton) {
            actionButton.addEventListener('click', (e) => {
                this.handleActionButtonClick(e);
            });
        }
        
        // Cancel button handler
        const cancelButton = document.getElementById('cancelButton');
        if (cancelButton) {
            cancelButton.addEventListener('click', (e) => {
                this.handleCancelButtonClick(e);
            });
        }
        
        // Close modal handler
        const closeButton = document.getElementById('closeModal');
        if (closeButton) {
            closeButton.addEventListener('click', (e) => {
                this.handleCloseButtonClick(e);
            });
        }
    }
    
    setupTrackerEvents() {
        if (!this.tracker) return;
        
        // Listen to tracker events for logging and additional processing
        this.tracker.on('progressStarted', (data) => this.onProgressStarted(data));
        this.tracker.on('progressStopped', (data) => this.onProgressStopped(data));
        this.tracker.on('progressPaused', (data) => this.onProgressPaused(data));
        this.tracker.on('progressResumed', (data) => this.onProgressResumed(data));
        this.tracker.on('stepStarted', (data) => this.onStepStarted(data));
        this.tracker.on('stepCompleted', (data) => this.onStepCompleted(data));
        this.tracker.on('stepError', (data) => this.onStepError(data));
    }
    
    // Button Event Handlers
    async handleActionButtonClick(event) {
        event.preventDefault();
        
        const progressData = this.tracker.getProgressData();
        
        if (this.tracker.isCompleted()) {
            this.handleInstallationComplete();
        } else if (progressData.hasError) {
            await this.handleRetryInstallation();
        } else if (progressData.isPaused) {
            this.handleResumeInstallation();
        } else if (this.tracker.canStart()) {
            await this.handleStartInstallation();
        }
    }
    
    handleCancelButtonClick(event) {
        event.preventDefault();
        
        const progressData = this.tracker.getProgressData();
        
        if (progressData.isActive) {
            if (progressData.isPaused) {
                this.handleStopInstallation();
            } else {
                this.handlePauseInstallation();
            }
        } else {
            this.handleCancelInstallation();
        }
    }
    
    handleCloseButtonClick(event) {
        if (this.tracker.isInProgress()) {
            // Don't close if installation is in progress
            event.preventDefault();
            this.showNotification('Please wait for installation to complete or cancel it first.', 'warning');
            return;
        }
        
        // Allow closing
        this.handleModalClose();
    }
    
    // Installation Handlers
    async handleStartInstallation() {
        try {
            console.log('Starting installation...');
            
            // Start the tracker
            if (!this.tracker.startProgress()) {
                throw new Error('Failed to start progress tracking');
            }
            
            // Begin installation simulation
            this.installationPromise = this.simulateInstallation();
            await this.installationPromise;
            
        } catch (error) {
            console.error('Installation failed:', error);
            this.handleInstallationError(error);
        }
    }
    
    async handleRetryInstallation() {
        try {
            console.log('Retrying installation...');
            
            // Reset the tracker
            this.tracker.resetProgress();
            
            // Wait a moment for UI to reset
            await this.delay(500);
            
            // Start again
            await this.handleStartInstallation();
            
        } catch (error) {
            console.error('Retry failed:', error);
            this.handleInstallationError(error);
        }
    }
    
    handlePauseInstallation() {
        if (this.tracker.pauseProgress()) {
            console.log('Installation paused');
            this.isSimulatingInstallation = false;
        }
    }
    
    handleResumeInstallation() {
        if (this.tracker.resumeProgress()) {
            console.log('Installation resumed');
            this.isSimulatingInstallation = true;
            
            // Resume simulation from current step
            this.continueSimulation();
        }
    }
    
    handleStopInstallation() {
        console.log('Stopping installation...');
        this.isSimulatingInstallation = false;
        
        // Cancel any pending promises
        this.stepPromises.clear();
        
        if (this.installationPromise) {
            this.installationPromise = null;
        }
        
        // Stop the tracker
        this.tracker.stopProgress();
        
        this.showNotification('Installation stopped', 'info');
    }
    
    handleCancelInstallation() {
        this.handleStopInstallation();
        this.handleModalClose();
    }
    
    handleInstallationComplete() {
        console.log('Installation completed successfully!');
        
        // You could trigger additional actions here:
        // - Refresh module list
        // - Update global state
        // - Navigate to module configuration
        
        this.showNotification('Module installed successfully!', 'success');
        this.handleModalClose();
    }
    
    handleInstallationError(error) {
        console.error('Installation error:', error);
        this.showNotification(`Installation failed: ${error.message}`, 'error');
    }
    
    handleModalClose() {
        const modal = document.getElementById('installationModal');
        if (modal) {
            modal.classList.remove('show');
        }
    }
    
    // Installation Simulation
    async simulateInstallation() {
        this.isSimulatingInstallation = true;
        
        const steps = this.tracker.getAllSteps();
        
        for (let i = 0; i < steps.length && this.isSimulatingInstallation; i++) {
            const step = steps[i];
            
            try {
                // Start the step
                await this.startStep(step, i);
                
                // Wait for pause/resume cycles
                while (this.tracker.isPaused && this.isSimulatingInstallation) {
                    await this.delay(100);
                }
                
                if (!this.isSimulatingInstallation) break;
                
                // Simulate step work
                await this.executeStep(step, i);
                
                // Complete the step
                await this.completeStep(step, i);
                
            } catch (error) {
                await this.errorStep(step, i, error);
                throw error; // Re-throw to stop installation
            }
        }
        
        if (this.isSimulatingInstallation) {
            this.tracker.stopProgress();
            console.log('Installation simulation completed');
        }
    }
    
    async continueSimulation() {
        if (!this.isSimulatingInstallation) return;
        
        const steps = this.tracker.getAllSteps();
        const currentStepIndex = this.tracker.currentStep;
        
        for (let i = currentStepIndex; i < steps.length && this.isSimulatingInstallation; i++) {
            const step = steps[i];
            
            try {
                // Continue from current step
                await this.executeStep(step, i);
                await this.completeStep(step, i);
                
            } catch (error) {
                await this.errorStep(step, i, error);
                throw error;
            }
        }
    }
    
    async startStep(step, index) {
        // Update step status
        step.status = 'current';
        step.startTime = new Date();
        
        // Move tracker to this step
        this.tracker.currentStep = index;
        
        // Emit step started event
        this.tracker.emit('stepStarted', {
            step: step,
            stepId: step.id,
            stepIndex: index
        });
        
        console.log(`Starting step ${index + 1}: ${step.title}`);
    }
    
    async executeStep(step, index) {
        // Simulate different step durations
        const baseDuration = this.getStepDuration(step.id);
        const actualDuration = baseDuration / this.simulationSpeed;
        
        // Add some randomness (±20%)
        const randomFactor = 0.8 + Math.random() * 0.4;
        const finalDuration = actualDuration * randomFactor;
        
        // Simulate potential errors (5% chance)
        if (Math.random() < 0.05) {
            await this.delay(finalDuration * 0.3); // Fail partway through
            throw new Error(this.getRandomError(step.id));
        }
        
        await this.delay(finalDuration);
    }
    
    async completeStep(step, index) {
        // Update step status
        step.status = 'completed';
        step.endTime = new Date();
        
        // Emit step completed event
        this.tracker.emit('stepCompleted', {
            step: step,
            stepId: step.id,
            stepIndex: index,
            duration: step.endTime - step.startTime
        });
        
        console.log(`Completed step ${index + 1}: ${step.title}`);
        
        // Move to next step
        this.tracker.currentStep = index + 1;
    }
    
    async errorStep(step, index, error) {
        // Update step status
        step.status = 'error';
        step.endTime = new Date();
        step.error = error.message;
        
        // Mark tracker as having error
        this.tracker.hasError = true;
        
        // Emit step error event
        this.tracker.emit('stepError', {
            step: step,
            stepId: step.id,
            stepIndex: index,
            error: error.message,
            duration: step.endTime - step.startTime
        });
        
        console.error(`Error in step ${index + 1}: ${step.title} - ${error.message}`);
    }
    
    // Utility Methods
    getStepDuration(stepId) {
        // Different steps take different amounts of time
        const durations = {
            'validate': 2000,      // 2 seconds
            'dependencies': 3000,  // 3 seconds  
            'assets': 4000,        // 4 seconds
            'configure': 2500,     // 2.5 seconds
            'finalize': 1500       // 1.5 seconds
        };
        
        return durations[stepId] || 2000;
    }
    
    getRandomError(stepId) {
        const errors = {
            'validate': [
                'Module signature verification failed',
                'Incompatible module version',
                'Missing required manifest fields'
            ],
            'dependencies': [
                'Failed to resolve dependency conflicts',
                'Network timeout while downloading dependencies',
                'Dependency version incompatibility'
            ],
            'assets': [
                'Insufficient disk space',
                'File permission denied',
                'Asset corruption detected'
            ],
            'configure': [
                'Configuration validation failed',
                'Permission setup error',
                'Database connection failed'
            ],
            'finalize': [
                'Module registration failed',
                'Cache refresh error',
                'Service restart failed'
            ]
        };
        
        const stepErrors = errors[stepId] || ['Unknown error occurred'];
        return stepErrors[Math.floor(Math.random() * stepErrors.length)];
    }
    
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    // Tracker Event Handlers (for logging and additional processing)
    onProgressStarted(data) {
        console.log('Progress tracking started:', data);
        this.logEvent('Installation Started', {
            totalSteps: data.totalSteps,
            startTime: data.startTime
        });
    }
    
    onProgressStopped(data) {
        console.log('Progress tracking stopped:', data);
        this.logEvent('Installation Stopped', {
            completed: data.completed,
            duration: data.duration,
            endTime: data.endTime
        });
        
        this.isSimulatingInstallation = false;
    }
    
    onProgressPaused(data) {
        console.log('Progress paused:', data);
        this.logEvent('Installation Paused', {
            currentStep: data.currentStep,
            pausedAt: data.pausedAt
        });
    }
    
    onProgressResumed(data) {
        console.log('Progress resumed:', data);
        this.logEvent('Installation Resumed', {
            currentStep: data.currentStep,
            resumedAt: data.resumedAt
        });
    }
    
    onStepStarted(data) {
        console.log('Step started:', data);
        this.logEvent('Step Started', {
            stepId: data.stepId,
            stepIndex: data.stepIndex,
            stepTitle: data.step.title
        });
    }
    
    onStepCompleted(data) {
        console.log('Step completed:', data);
        this.logEvent('Step Completed', {
            stepId: data.stepId,
            stepIndex: data.stepIndex,
            duration: data.duration
        });
    }
    
    onStepError(data) {
        console.error('Step error:', data);
        this.logEvent('Step Error', {
            stepId: data.stepId,
            stepIndex: data.stepIndex,
            error: data.error,
            duration: data.duration
        });
    }
    
    // Logging and Notifications
    logEvent(eventName, data) {
        const timestamp = new Date().toISOString();
        console.log(`[${timestamp}] ${eventName}:`, data);
        
        // You could send this to a logging service
        // or store in local storage for debugging
    }
    
    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        
        // Style the notification
        Object.assign(notification.style, {
            position: 'fixed',
            top: '20px',
            right: '20px',
            padding: '12px 16px',
            borderRadius: '6px',
            color: 'white',
            fontWeight: '500',
            zIndex: '10001', // Higher than modal
            opacity: '0',
            transform: 'translateY(-10px)',
            transition: 'all 0.3s ease'
        });
        
        // Set background color based on type
        const colors = {
            success: '#28a745',
            error: '#dc3545',
            warning: '#ffc107',
            info: '#007bff'
        };
        notification.style.backgroundColor = colors[type] || colors.info;
        
        document.body.appendChild(notification);
        
        // Animate in
        requestAnimationFrame(() => {
            notification.style.opacity = '1';
            notification.style.transform = 'translateY(0)';
        });
        
        // Remove after 4 seconds
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transform = 'translateY(-10px)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 4000);
    }
    
    // Public Methods
    setSimulationSpeed(speed) {
        this.simulationSpeed = Math.max(0.1, Math.min(5, speed));
        console.log(`Simulation speed set to ${this.simulationSpeed}x`);
    }
    
    getCurrentState() {
        return {
            isSimulating: this.isSimulatingInstallation,
            simulationSpeed: this.simulationSpeed,
            trackerState: this.tracker ? this.tracker.getProgressData() : null
        };
    }
    
    destroy() {
        this.isSimulatingInstallation = false;
        this.stepPromises.clear();
        this.installationPromise = null;
        
        console.log('Progress event handler destroyed');
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ProgressEventHandler };
}
