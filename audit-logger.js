/**
 * ConstructERP Audit Logger
 * Comprehensive audit trail system for regulatory compliance
 * 
 * Features:
 * - Detailed audit logging with timestamps
 * - Regulatory compliance support (SOX, GDPR, etc.)
 * - Event categorization and severity levels
 * - Tamper-proof audit trails
 * - Advanced querying and reporting
 * - Data retention policies
 */

class AuditLogger {
    constructor(options = {}) {
        this.logs = [];
        this.maxLogs = options.maxLogs || 10000;
        this.retentionDays = options.retentionDays || 2555; // 7 years for compliance
        this.encryptionKey = options.encryptionKey || 'default-audit-key';
        this.compressionEnabled = options.compression || true;
        this.remoteLogging = options.remoteLogging || false;
        
        // Event categories for compliance
        this.eventCategories = {
            AUTHENTICATION: 'authentication',
            AUTHORIZATION: 'authorization',
            DATA_ACCESS: 'data_access',
            DATA_MODIFICATION: 'data_modification',
            SYSTEM_ADMIN: 'system_admin',
            SECURITY: 'security',
            COMPLIANCE: 'compliance',
            ERROR: 'error'
        };

        // Severity levels
        this.severityLevels = {
            LOW: 1,
            MEDIUM: 2,
            HIGH: 3,
            CRITICAL: 4
        };

        // Initialize audit system
        this.initializeAuditSystem();
        
        console.log('📋 AuditLogger initialized with compliance features');
    }

    /**
     * Initialize the audit logging system
     */
    initializeAuditSystem() {
        // Load existing logs from storage
        this.loadAuditLogs();
        
        // Start maintenance tasks
        this.startMaintenanceTasks();
        
        // Set up error handlers
        this.setupErrorHandlers();
        
        // Initialize remote logging if enabled
        if (this.remoteLogging) {
            this.initializeRemoteLogging();
        }
    }

    /**
     * Core audit logging method
     */
    async log(eventType, details = {}, options = {}) {
        try {
            const auditEntry = this.createAuditEntry(eventType, details, options);
            
            // Validate audit entry
            if (!this.validateAuditEntry(auditEntry)) {
                console.error('❌ Invalid audit entry:', auditEntry);
                return false;
            }

            // Add to in-memory log
            this.logs.unshift(auditEntry);

            // Maintain log size limits
            if (this.logs.length > this.maxLogs) {
                this.archiveOldLogs();
            }

            // Persist to storage
            await this.persistAuditEntry(auditEntry);

            // Send to remote logging system if enabled
            if (this.remoteLogging) {
                await this.sendToRemoteLogger(auditEntry);
            }

            // Handle high-priority events
            if (auditEntry.severity >= this.severityLevels.HIGH) {
                await this.handleHighPriorityEvent(auditEntry);
            }

            return auditEntry.id;

        } catch (error) {
            console.error('❌ Audit logging failed:', error);
            // Try to log the failure itself (without recursion)
            this.logSystemError('AUDIT_LOG_FAILURE', { error: error.message });
            return false;
        }
    }

    /**
     * Create standardized audit entry
     */
    createAuditEntry(eventType, details, options) {
        const now = new Date();
        const entry = {
            id: this.generateAuditId(),
            timestamp: now.toISOString(),
            timestampMs: now.getTime(),
            eventType: eventType,
            category: this.categorizeEvent(eventType),
            severity: options.severity || this.determineSeverity(eventType),
            
            // User and session info
            userId: details.userId || null,
            sessionId: details.sessionId || null,
            userAgent: navigator.userAgent,
            ipAddress: this.getClientIP(),
            
            // Event details
            details: this.sanitizeDetails(details),
            
            // System context
            url: window.location?.href || null,
            module: options.module || this.getCurrentModule(),
            action: options.action || eventType,
            
            // Compliance fields
            complianceLevel: this.getComplianceLevel(eventType),
            dataClassification: options.dataClassification || 'internal',
            
            // Integrity protection
            checksum: null // Will be calculated after entry creation
        };

        // Calculate integrity checksum
        entry.checksum = this.calculateChecksum(entry);

        return entry;
    }

    /**
     * Validate audit entry for compliance requirements
     */
    validateAuditEntry(entry) {
        const requiredFields = ['id', 'timestamp', 'eventType', 'category', 'severity'];
        
        for (const field of requiredFields) {
            if (!entry[field]) {
                console.error(`❌ Missing required audit field: ${field}`);
                return false;
            }
        }

        // Validate timestamp format
        if (!this.isValidTimestamp(entry.timestamp)) {
            console.error('❌ Invalid timestamp format');
            return false;
        }

        // Validate checksum
        const recalculatedChecksum = this.calculateChecksum({...entry, checksum: null});
        if (entry.checksum !== recalculatedChecksum) {
            console.error('❌ Audit entry checksum validation failed');
            return false;
        }

        return true;
    }

    /**
     * Categorize audit events for compliance
     */
    categorizeEvent(eventType) {
        const categoryMap = {
            'LOGIN_SUCCESS': this.eventCategories.AUTHENTICATION,
            'LOGIN_FAILED': this.eventCategories.AUTHENTICATION,
            'LOGIN_LOCKOUT': this.eventCategories.SECURITY,
            'LOGOUT': this.eventCategories.AUTHENTICATION,
            'SESSION_EXPIRED': this.eventCategories.AUTHENTICATION,
            
            'ACCESS_GRANTED': this.eventCategories.AUTHORIZATION,
            'ACCESS_DENIED': this.eventCategories.AUTHORIZATION,
            'PERMISSION_CHANGE': this.eventCategories.AUTHORIZATION,
            
            'DATA_VIEW': this.eventCategories.DATA_ACCESS,
            'DATA_EXPORT': this.eventCategories.DATA_ACCESS,
            'DATA_IMPORT': this.eventCategories.DATA_MODIFICATION,
            'DATA_CREATE': this.eventCategories.DATA_MODIFICATION,
            'DATA_UPDATE': this.eventCategories.DATA_MODIFICATION,
            'DATA_DELETE': this.eventCategories.DATA_MODIFICATION,
            
            'USER_CREATE': this.eventCategories.SYSTEM_ADMIN,
            'USER_UPDATE': this.eventCategories.SYSTEM_ADMIN,
            'USER_DELETE': this.eventCategories.SYSTEM_ADMIN,
            'SETTINGS_CHANGE': this.eventCategories.SYSTEM_ADMIN,
            
            'SECURITY_VIOLATION': this.eventCategories.SECURITY,
            'SUSPICIOUS_ACTIVITY': this.eventCategories.SECURITY,
            'ENCRYPTION_FAILURE': this.eventCategories.SECURITY,
            
            'COMPLIANCE_REPORT': this.eventCategories.COMPLIANCE,
            'AUDIT_ACCESS': this.eventCategories.COMPLIANCE,
            
            'SYSTEM_ERROR': this.eventCategories.ERROR,
            'APPLICATION_ERROR': this.eventCategories.ERROR
        };

        return categoryMap[eventType] || this.eventCategories.DATA_ACCESS;
    }

    /**
     * Determine event severity automatically
     */
    determineSeverity(eventType) {
        const severityMap = {
            // Critical events
            'LOGIN_LOCKOUT': this.severityLevels.CRITICAL,
            'SECURITY_VIOLATION': this.severityLevels.CRITICAL,
            'DATA_DELETE': this.severityLevels.CRITICAL,
            'USER_DELETE': this.severityLevels.CRITICAL,
            'ENCRYPTION_FAILURE': this.severityLevels.CRITICAL,
            
            // High severity events
            'LOGIN_FAILED': this.severityLevels.HIGH,
            'ACCESS_DENIED': this.severityLevels.HIGH,
            'SUSPICIOUS_ACTIVITY': this.severityLevels.HIGH,
            'DATA_EXPORT': this.severityLevels.HIGH,
            'SETTINGS_CHANGE': this.severityLevels.HIGH,
            
            // Medium severity events
            'LOGIN_SUCCESS': this.severityLevels.MEDIUM,
            'DATA_UPDATE': this.severityLevels.MEDIUM,
            'DATA_CREATE': this.severityLevels.MEDIUM,
            'USER_UPDATE': this.severityLevels.MEDIUM,
            
            // Low severity events
            'DATA_VIEW': this.severityLevels.LOW,
            'LOGOUT': this.severityLevels.LOW,
            'SESSION_EXPIRED': this.severityLevels.LOW
        };

        return severityMap[eventType] || this.severityLevels.LOW;
    }

    /**
     * Get compliance level for regulatory requirements
     */
    getComplianceLevel(eventType) {
        const complianceTypes = {
            'DATA_DELETE': 'SOX,GDPR',
            'DATA_EXPORT': 'SOX,GDPR',
            'USER_DELETE': 'SOX,GDPR',
            'FINANCIAL_ACCESS': 'SOX',
            'PERSONAL_DATA_ACCESS': 'GDPR',
            'LOGIN_SUCCESS': 'GENERAL',
            'LOGIN_FAILED': 'SECURITY',
            'SECURITY_VIOLATION': 'SECURITY,SOX,GDPR'
        };

        return complianceTypes[eventType] || 'GENERAL';
    }

    /**
     * Sanitize sensitive details for logging
     */
    sanitizeDetails(details) {
        const sanitized = { ...details };
        
        // Remove or mask sensitive fields
        const sensitiveFields = ['password', 'ssn', 'creditCard', 'token', 'apiKey'];
        
        sensitiveFields.forEach(field => {
            if (sanitized[field]) {
                sanitized[field] = '[REDACTED]';
            }
        });

        // Mask email addresses partially
        if (sanitized.email && typeof sanitized.email === 'string') {
            const parts = sanitized.email.split('@');
            if (parts.length === 2) {
                const username = parts[0];
                const domain = parts[1];
                sanitized.email = `${username.substring(0, 2)}***@${domain}`;
            }
        }

        // Truncate long text fields
        Object.keys(sanitized).forEach(key => {
            if (typeof sanitized[key] === 'string' && sanitized[key].length > 1000) {
                sanitized[key] = sanitized[key].substring(0, 1000) + '... [TRUNCATED]';
            }
        });

        return sanitized;
    }

    /**
     * Calculate integrity checksum for tamper detection
     */
    calculateChecksum(entry) {
        // Simple hash function for demo - use crypto.subtle.digest in production
        const str = JSON.stringify({
            id: entry.id,
            timestamp: entry.timestamp,
            eventType: entry.eventType,
            userId: entry.userId,
            details: entry.details
        });
        
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        
        return hash.toString(16);
    }

    /**
     * Generate unique audit ID
     */
    generateAuditId() {
        return 'audit_' + Date.now().toString(36) + '_' + Math.random().toString(36).substr(2, 9);
    }

    /**
     * Query audit logs with filtering and pagination
     */
    query(options = {}) {
        let results = [...this.logs];

        // Filter by date range
        if (options.startDate) {
            const startTime = new Date(options.startDate).getTime();
            results = results.filter(log => log.timestampMs >= startTime);
        }

        if (options.endDate) {
            const endTime = new Date(options.endDate).getTime();
            results = results.filter(log => log.timestampMs <= endTime);
        }

        // Filter by user
        if (options.userId) {
            results = results.filter(log => log.userId === options.userId);
        }

        // Filter by event type
        if (options.eventType) {
            results = results.filter(log => log.eventType === options.eventType);
        }

        // Filter by category
        if (options.category) {
            results = results.filter(log => log.category === options.category);
        }

        // Filter by severity
        if (options.minSeverity) {
            results = results.filter(log => log.severity >= options.minSeverity);
        }

        // Filter by module
        if (options.module) {
            results = results.filter(log => log.module === options.module);
        }

        // Search in details
        if (options.search) {
            const searchTerm = options.search.toLowerCase();
            results = results.filter(log => {
                const searchableText = JSON.stringify(log.details).toLowerCase();
                return searchableText.includes(searchTerm) || 
                       log.eventType.toLowerCase().includes(searchTerm);
            });
        }

        // Sort results
        results.sort((a, b) => {
            if (options.sortOrder === 'asc') {
                return a.timestampMs - b.timestampMs;
            } else {
                return b.timestampMs - a.timestampMs;
            }
        });

        // Pagination
        const page = options.page || 1;
        const pageSize = options.pageSize || 50;
        const startIndex = (page - 1) * pageSize;
        const endIndex = startIndex + pageSize;

        return {
            logs: results.slice(startIndex, endIndex),
            totalCount: results.length,
            page: page,
            pageSize: pageSize,
            totalPages: Math.ceil(results.length / pageSize)
        };
    }

    /**
     * Generate compliance report
     */
    generateComplianceReport(options = {}) {
        const reportPeriod = options.period || 'last30days';
        const complianceType = options.complianceType || 'ALL';
        
        let startDate;
        const endDate = new Date();

        // Determine report period
        switch (reportPeriod) {
            case 'today':
                startDate = new Date();
                startDate.setHours(0, 0, 0, 0);
                break;
            case 'last7days':
                startDate = new Date();
                startDate.setDate(startDate.getDate() - 7);
                break;
            case 'last30days':
                startDate = new Date();
                startDate.setDate(startDate.getDate() - 30);
                break;
            case 'last90days':
                startDate = new Date();
                startDate.setDate(startDate.getDate() - 90);
                break;
            default:
                startDate = options.customStartDate || new Date();
                startDate.setDate(startDate.getDate() - 30);
        }

        // Query logs for the period
        const queryResult = this.query({
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
            pageSize: 10000 // Get all records for report
        });

        const logs = queryResult.logs;

        // Generate report statistics
        const report = {
            reportId: this.generateAuditId(),
            generatedAt: new Date().toISOString(),
            period: {
                start: startDate.toISOString(),
                end: endDate.toISOString(),
                description: reportPeriod
            },
            complianceType: complianceType,
            totalEvents: logs.length,
            
            // Event breakdown by category
            eventsByCategory: this.groupByCategory(logs),
            
            // Event breakdown by severity
            eventsBySeverity: this.groupBySeverity(logs),
            
            // User activity summary
            userActivity: this.generateUserActivitySummary(logs),
            
            // Security events
            securityEvents: this.getSecurityEvents(logs),
            
            // Compliance-specific events
            complianceEvents: this.getComplianceEvents(logs, complianceType),
            
            // Failed access attempts
            failedAccess: this.getFailedAccessAttempts(logs),
            
            // Data access summary
            dataAccess: this.getDataAccessSummary(logs),
            
            // System integrity
            integrityChecks: this.performIntegrityChecks(logs)
        };

        return report;
    }

    /**
     * Group logs by category for reporting
     */
    groupByCategory(logs) {
        const grouped = {};
        logs.forEach(log => {
            if (!grouped[log.category]) {
                grouped[log.category] = 0;
            }
            grouped[log.category]++;
        });
        return grouped;
    }

    /**
     * Group logs by severity for reporting
     */
    groupBySeverity(logs) {
        const grouped = { LOW: 0, MEDIUM: 0, HIGH: 0, CRITICAL: 0 };
        logs.forEach(log => {
            const severityName = Object.keys(this.severityLevels).find(
                key => this.severityLevels[key] === log.severity
            ) || 'LOW';
            grouped[severityName]++;
        });
        return grouped;
    }

    /**
     * Generate user activity summary
     */
    generateUserActivitySummary(logs) {
        const userStats = {};
        
        logs.forEach(log => {
            if (log.userId) {
                if (!userStats[log.userId]) {
                    userStats[log.userId] = {
                        totalActions: 0,
                        loginAttempts: 0,
                        failedLogins: 0,
                        dataAccess: 0,
                        lastActivity: null
                    };
                }
                
                const stats = userStats[log.userId];
                stats.totalActions++;
                
                if (log.eventType.includes('LOGIN')) {
                    stats.loginAttempts++;
                    if (log.eventType === 'LOGIN_FAILED') {
                        stats.failedLogins++;
                    }
                }
                
                if (log.category === this.eventCategories.DATA_ACCESS) {
                    stats.dataAccess++;
                }
                
                if (!stats.lastActivity || log.timestampMs > new Date(stats.lastActivity).getTime()) {
                    stats.lastActivity = log.timestamp;
                }
            }
        });
        
        return userStats;
    }

    /**
     * Get security-related events
     */
    getSecurityEvents(logs) {
        return logs.filter(log => 
            log.category === this.eventCategories.SECURITY ||
            log.eventType.includes('FAILED') ||
            log.eventType.includes('DENIED') ||
            log.severity >= this.severityLevels.HIGH
        );
    }

    /**
     * Get compliance-specific events
     */
    getComplianceEvents(logs, complianceType) {
        if (complianceType === 'ALL') {
            return logs.filter(log => log.complianceLevel && log.complianceLevel !== 'GENERAL');
        }
        
        return logs.filter(log => 
            log.complianceLevel && log.complianceLevel.includes(complianceType)
        );
    }

    /**
     * Get failed access attempts
     */
    getFailedAccessAttempts(logs) {
        return logs.filter(log => 
            log.eventType === 'LOGIN_FAILED' || 
            log.eventType === 'ACCESS_DENIED' ||
            log.eventType === 'LOGIN_LOCKOUT'
        );
    }

    /**
     * Get data access summary
     */
    getDataAccessSummary(logs) {
        const dataEvents = logs.filter(log => 
            log.category === this.eventCategories.DATA_ACCESS ||
            log.category === this.eventCategories.DATA_MODIFICATION
        );
        
        const summary = {
            totalDataEvents: dataEvents.length,
            dataViews: 0,
            dataExports: 0,
            dataModifications: 0,
            sensitiveDataAccess: 0
        };
        
        dataEvents.forEach(log => {
            if (log.eventType.includes('VIEW')) summary.dataViews++;
            if (log.eventType.includes('EXPORT')) summary.dataExports++;
            if (log.eventType.includes('UPDATE') || log.eventType.includes('DELETE') || log.eventType.includes('CREATE')) {
                summary.dataModifications++;
            }
            if (log.dataClassification === 'confidential' || log.dataClassification === 'restricted') {
                summary.sensitiveDataAccess++;
            }
        });
        
        return summary;
    }

    /**
     * Perform integrity checks on audit logs
     */
    performIntegrityChecks(logs) {
        let corruptedEntries = 0;
        let totalEntries = logs.length;
        
        logs.forEach(log => {
            const recalculatedChecksum = this.calculateChecksum({...log, checksum: null});
            if (log.checksum !== recalculatedChecksum) {
                corruptedEntries++;
                console.warn(`⚠️ Integrity check failed for audit entry: ${log.id}`);
            }
        });
        
        return {
            totalEntries,
            corruptedEntries,
            integrityScore: totalEntries > 0 ? ((totalEntries - corruptedEntries) / totalEntries) * 100 : 100
        };
    }

    /**
     * Export audit logs in various formats
     */
    exportLogs(format = 'json', options = {}) {
        const queryResult = this.query(options);
        const logs = queryResult.logs;
        
        switch (format.toLowerCase()) {
            case 'json':
                return this.exportAsJSON(logs);
            case 'csv':
                return this.exportAsCSV(logs);
            case 'xml':
                return this.exportAsXML(logs);
            default:
                throw new Error(`Unsupported export format: ${format}`);
        }
    }

    /**
     * Export as JSON
     */
    exportAsJSON(logs) {
        return JSON.stringify({
            exportedAt: new Date().toISOString(),
            totalRecords: logs.length,
            auditLogs: logs
        }, null, 2);
    }

    /**
     * Export as CSV
     */
    exportAsCSV(logs) {
        if (logs.length === 0) return 'No audit logs to export';
        
        const headers = [
            'ID', 'Timestamp', 'Event Type', 'Category', 'Severity', 
            'User ID', 'Session ID', 'IP Address', 'Module', 'Action', 'Details'
        ];
        
        let csv = headers.join(',') + '\n';
        
        logs.forEach(log => {
            const row = [
                log.id,
                log.timestamp,
                log.eventType,
                log.category,
                log.severity,
                log.userId || '',
                log.sessionId || '',
                log.ipAddress || '',
                log.module || '',
                log.action || '',
                JSON.stringify(log.details).replace(/"/g, '""') // Escape quotes for CSV
            ];
            csv += row.map(field => `"${field}"`).join(',') + '\n';
        });
        
        return csv;
    }

    /**
     * Export as XML
     */
    exportAsXML(logs) {
        let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
        xml += '<auditLogs>\n';
        xml += `  <metadata>\n`;
        xml += `    <exportedAt>${new Date().toISOString()}</exportedAt>\n`;
        xml += `    <totalRecords>${logs.length}</totalRecords>\n`;
        xml += `  </metadata>\n`;
        xml += `  <logs>\n`;
        
        logs.forEach(log => {
            xml += `    <log>\n`;
            xml += `      <id>${this.escapeXml(log.id)}</id>\n`;
            xml += `      <timestamp>${this.escapeXml(log.timestamp)}</timestamp>\n`;
            xml += `      <eventType>${this.escapeXml(log.eventType)}</eventType>\n`;
            xml += `      <category>${this.escapeXml(log.category)}</category>\n`;
            xml += `      <severity>${log.severity}</severity>\n`;
            xml += `      <userId>${this.escapeXml(log.userId || '')}</userId>\n`;
            xml += `      <sessionId>${this.escapeXml(log.sessionId || '')}</sessionId>\n`;
            xml += `      <ipAddress>${this.escapeXml(log.ipAddress || '')}</ipAddress>\n`;
            xml += `      <module>${this.escapeXml(log.module || '')}</module>\n`;
            xml += `      <action>${this.escapeXml(log.action || '')}</action>\n`;
            xml += `      <details><![CDATA[${JSON.stringify(log.details)}]]></details>\n`;
            xml += `    </log>\n`;
        });
        
        xml += `  </logs>\n`;
        xml += '</auditLogs>';
        
        return xml;
    }

    /**
     * Escape XML special characters
     */
    escapeXml(text) {
        if (!text) return '';
        return text.toString()
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    /**
     * Persist audit entry to storage
     */
    async persistAuditEntry(entry) {
        try {
            // In production: send to secure database
            // For demo: use localStorage with encryption
            const encryptedEntry = this.encryptEntry(entry);
            const storageKey = `audit_${entry.id}`;
            localStorage.setItem(storageKey, encryptedEntry);
            return true;
        } catch (error) {
            console.error('Failed to persist audit entry:', error);
            return false;
        }
    }

    /**
     * Load existing audit logs from storage
     */
    loadAuditLogs() {
        try {
            const storageKeys = Object.keys(localStorage).filter(key => key.startsWith('audit_'));
            
            storageKeys.forEach(key => {
                const encryptedEntry = localStorage.getItem(key);
                const entry = this.decryptEntry(encryptedEntry);
                if (entry && this.validateAuditEntry(entry)) {
                    this.logs.push(entry);
                }
            });

            // Sort by timestamp (newest first)
            this.logs.sort((a, b) => b.timestampMs - a.timestampMs);
            
            console.log(`📋 Loaded ${this.logs.length} audit entries from storage`);
        } catch (error) {
            console.error('Failed to load audit logs:', error);
        }
    }

    /**
     * Simple encryption for demo (use proper encryption in production)
     */
    encryptEntry(entry) {
        // In production: use proper encryption like AES-256
        const jsonString = JSON.stringify(entry);
        return btoa(jsonString); // Base64 encoding for demo
    }

    /**
     * Simple decryption for demo
     */
    decryptEntry(encryptedEntry) {
        try {
            const jsonString = atob(encryptedEntry);
            return JSON.parse(jsonString);
        } catch (error) {
            console.error('Failed to decrypt audit entry:', error);
            return null;
        }
    }

    /**
     * Archive old logs based on retention policy
     */
    archiveOldLogs() {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - this.retentionDays);
        const cutoffTime = cutoffDate.getTime();

        const logsToArchive = this.logs.filter(log => log.timestampMs < cutoffTime);
        
        if (logsToArchive.length > 0) {
            console.log(`📦 Archiving ${logsToArchive.length} old audit logs`);
            // In production: move to archive storage
            this.logs = this.logs.filter(log => log.timestampMs >= cutoffTime);
        }
    }

    /**
     * Start maintenance tasks
     */
    startMaintenanceTasks() {
        // Clean up old logs daily
        setInterval(() => {
            this.archiveOldLogs();
        }, 24 * 60 * 60 * 1000);

        // Integrity check weekly
        setInterval(() => {
            this.performIntegrityChecks(this.logs);
        }, 7 * 24 * 60 * 60 * 1000);
    }

    /**
     * Setup error handlers
     */
    setupErrorHandlers() {
        window.addEventListener('error', (event) => {
            this.logSystemError('JAVASCRIPT_ERROR', {
                message: event.message,
                filename: event.filename,
                line: event.lineno,
                column: event.colno
            });
        });
    }

    /**
     * Log system errors
     */
    logSystemError(errorType, details) {
        try {
            this.log(errorType, details, { 
                severity: this.severityLevels.HIGH,
                category: this.eventCategories.ERROR
            });
        } catch (error) {
            // Last resort - console log if audit logging fails
            console.error('Critical: Audit logging system failure', error);
        }
    }

    /**
     * Handle high priority events with immediate actions
     */
    async handleHighPriorityEvent(auditEntry) {
        console.warn('⚠️ High priority audit event:', auditEntry.eventType);
        
        // In production: send alerts, notifications, etc.
        if (auditEntry.severity === this.severityLevels.CRITICAL) {
            console.error('🚨 Critical security event detected:', auditEntry);
            // Could trigger security team notification
        }
    }

    /**
     * Initialize remote logging (mock implementation)
     */
    initializeRemoteLogging() {
        console.log('🌐 Remote audit logging initialized');
        // In production: configure secure remote logging endpoint
    }

    /**
     * Send to remote logger (mock implementation)
     */
    async sendToRemoteLogger(auditEntry) {
        // In production: send to secure remote logging service
        console.log('🌐 Sending audit entry to remote logger:', auditEntry.id);
        return true;
    }

    /**
     * Utility methods
     */
    isValidTimestamp(timestamp) {
        return !isNaN(Date.parse(timestamp));
    }

    getCurrentModule() {
        // Try to determine current module from URL or global state
        return window.currentModule || 'unknown';
    }

    getClientIP() {
        return '127.0.0.1'; // Mock - would be handled server-side in production
    }
}

// Export for use in other modules
if (typeof window !== 'undefined') {
    window.AuditLogger = AuditLogger;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = AuditLogger;
}
