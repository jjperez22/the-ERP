/**
 * Installation Progress Tracker - Basic Structure
 * Simple JavaScript class for tracking installation steps and progress state
 */

class InstallationProgressTracker {
    constructor() {
        this.currentStep = 0;
        this.totalSteps = 0;
        this.isActive = false;
        this.isPaused = false;
        this.hasError = false;
        this.steps = [];
        this.startTime = null;
        this.endTime = null;
        this.eventListeners = new Map();
        
        this.init();
    }
    
    init() {
        this.setupDefaultSteps();
        this.resetProgress();
    }
    
    setupDefaultSteps() {
        this.steps = [
            {
                id: 'validate',
                title: 'Validating Module',
                description: 'Checking module integrity and compatibility...',
                status: 'pending',
                startTime: null,
                endTime: null,
                error: null
            },
            {
                id: 'dependencies',
                title: 'Resolving Dependencies',
                description: 'Analyzing and installing required dependencies...',
                status: 'pending',
                startTime: null,
                endTime: null,
                error: null
            },
            {
                id: 'assets',
                title: 'Installing Assets',
                description: 'Copying module files and resources...',
                status: 'pending',
                startTime: null,
                endTime: null,
                error: null
            },
            {
                id: 'configure',
                title: 'Configuring Module',
                description: 'Setting up module configuration and permissions...',
                status: 'pending',
                startTime: null,
                endTime: null,
                error: null
            },
            {
                id: 'finalize',
                title: 'Finalizing Installation',
                description: 'Registering module and completing setup...',
                status: 'pending',
                startTime: null,
                endTime: null,
                error: null
            }
        ];
        
        this.totalSteps = this.steps.length;
    }
    
    // Progress State Management
    resetProgress() {
        this.currentStep = 0;
        this.isActive = false;
        this.isPaused = false;
        this.hasError = false;
        this.startTime = null;
        this.endTime = null;
        
        this.steps.forEach(step => {
            step.status = 'pending';
            step.startTime = null;
            step.endTime = null;
            step.error = null;
        });
        
        this.emit('progressReset');
    }
    
    startProgress() {
        if (this.isActive) return false;
        
        this.isActive = true;
        this.isPaused = false;
        this.hasError = false;
        this.startTime = new Date();
        this.currentStep = 0;
        
        this.emit('progressStarted', {
            startTime: this.startTime,
            totalSteps: this.totalSteps
        });
        
        return true;
    }
    
    pauseProgress() {
        if (!this.isActive || this.isPaused) return false;
        
        this.isPaused = true;
        this.emit('progressPaused', {
            currentStep: this.currentStep,
            pausedAt: new Date()
        });
        
        return true;
    }
    
    resumeProgress() {
        if (!this.isActive || !this.isPaused) return false;
        
        this.isPaused = false;
        this.emit('progressResumed', {
            currentStep: this.currentStep,
            resumedAt: new Date()
        });
        
        return true;
    }
    
    stopProgress() {
        if (!this.isActive) return false;
        
        this.isActive = false;
        this.isPaused = false;
        this.endTime = new Date();
        
        this.emit('progressStopped', {
            endTime: this.endTime,
            completed: this.currentStep >= this.totalSteps,
            duration: this.getDuration()
        });
        
        return true;
    }
    
    // Step Management
    getCurrentStep() {
        if (this.currentStep < this.steps.length) {
            return this.steps[this.currentStep];
        }
        return null;
    }
    
    getStep(index) {
        if (index >= 0 && index < this.steps.length) {
            return this.steps[index];
        }
        return null;
    }
    
    getStepById(id) {
        return this.steps.find(step => step.id === id);
    }
    
    getAllSteps() {
        return [...this.steps];
    }
    
    getCompletedSteps() {
        return this.steps.filter(step => step.status === 'completed');
    }
    
    getFailedSteps() {
        return this.steps.filter(step => step.status === 'error');
    }
    
    // Progress Calculation
    getProgress() {
        if (this.totalSteps === 0) return 0;
        return (this.currentStep / this.totalSteps) * 100;
    }
    
    getProgressData() {
        return {
            currentStep: this.currentStep,
            totalSteps: this.totalSteps,
            percentage: this.getProgress(),
            isActive: this.isActive,
            isPaused: this.isPaused,
            hasError: this.hasError,
            startTime: this.startTime,
            endTime: this.endTime,
            duration: this.getDuration(),
            steps: this.getAllSteps()
        };
    }
    
    getDuration() {
        if (!this.startTime) return 0;
        const endTime = this.endTime || new Date();
        return endTime.getTime() - this.startTime.getTime();
    }
    
    getFormattedDuration() {
        const duration = this.getDuration();
        const seconds = Math.floor(duration / 1000);
        const minutes = Math.floor(seconds / 60);
        
        if (minutes > 0) {
            return `${minutes}m ${seconds % 60}s`;
        }
        return `${seconds}s`;
    }
    
    // Status Checks
    isCompleted() {
        return this.currentStep >= this.totalSteps && !this.hasError;
    }
    
    isInProgress() {
        return this.isActive && !this.isPaused;
    }
    
    canStart() {
        return !this.isActive;
    }
    
    canPause() {
        return this.isActive && !this.isPaused;
    }
    
    canResume() {
        return this.isActive && this.isPaused;
    }
    
    canStop() {
        return this.isActive;
    }
    
    // Event Management
    on(eventName, callback) {
        if (!this.eventListeners.has(eventName)) {
            this.eventListeners.set(eventName, []);
        }
        this.eventListeners.get(eventName).push(callback);
    }
    
    off(eventName, callback) {
        if (!this.eventListeners.has(eventName)) return;
        
        const callbacks = this.eventListeners.get(eventName);
        const index = callbacks.indexOf(callback);
        if (index > -1) {
            callbacks.splice(index, 1);
        }
    }
    
    emit(eventName, data = {}) {
        if (!this.eventListeners.has(eventName)) return;
        
        const callbacks = this.eventListeners.get(eventName);
        callbacks.forEach(callback => {
            try {
                callback(data);
            } catch (error) {
                console.error(`Error in progress tracker event handler for ${eventName}:`, error);
            }
        });
    }
    
    // Utility Methods
    getStatusSummary() {
        const summary = {
            pending: 0,
            current: 0,
            completed: 0,
            error: 0
        };
        
        this.steps.forEach((step, index) => {
            if (step.status === 'error') {
                summary.error++;
            } else if (step.status === 'completed') {
                summary.completed++;
            } else if (index === this.currentStep && this.isActive) {
                summary.current++;
            } else {
                summary.pending++;
            }
        });
        
        return summary;
    }
    
    getEstimatedTimeRemaining() {
        if (!this.isActive || this.currentStep === 0) return null;
        
        const elapsedTime = this.getDuration();
        const averageTimePerStep = elapsedTime / this.currentStep;
        const remainingSteps = this.totalSteps - this.currentStep;
        
        return averageTimePerStep * remainingSteps;
    }
    
    getFormattedEstimatedTime() {
        const estimated = this.getEstimatedTimeRemaining();
        if (!estimated) return 'Calculating...';
        
        const seconds = Math.floor(estimated / 1000);
        const minutes = Math.floor(seconds / 60);
        
        if (minutes > 0) {
            return `~${minutes}m ${seconds % 60}s remaining`;
        }
        return `~${seconds}s remaining`;
    }
    
    // Debug Methods
    getDebugInfo() {
        return {
            tracker: {
                currentStep: this.currentStep,
                totalSteps: this.totalSteps,
                isActive: this.isActive,
                isPaused: this.isPaused,
                hasError: this.hasError,
                progress: this.getProgress()
            },
            timing: {
                startTime: this.startTime,
                endTime: this.endTime,
                duration: this.getDuration(),
                formatted: this.getFormattedDuration(),
                estimated: this.getFormattedEstimatedTime()
            },
            steps: this.steps.map((step, index) => ({
                index,
                id: step.id,
                status: step.status,
                title: step.title,
                error: step.error
            }))
        };
    }
    
    logProgress() {
        console.log('Progress Tracker Status:', this.getDebugInfo());
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { InstallationProgressTracker };
}
