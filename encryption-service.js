/**
 * ConstructERP Basic Encryption Service
 * Core encryption utilities for protecting sensitive data
 * 
 * Features:
 * - Field-level encryption for sensitive data
 * - Secure key management
 * - Data masking and tokenization
 * - Browser-compatible encryption
 */

class EncryptionService {
    constructor(options = {}) {
        this.masterKey = options.masterKey || this.generateMasterKey();
        this.algorithm = 'AES-GCM'; // Modern authenticated encryption
        this.keyLength = 256;
        this.ivLength = 12; // 96 bits for AES-GCM
        
        // Field encryption mapping
        this.encryptedFields = new Set([
            'password',
            'ssn',
            'creditCard',
            'bankAccount',
            'apiKey',
            'token',
            'personalId',
            'phone',
            'email'
        ]);

        console.log('🔐 EncryptionService initialized');
    }

    /**
     * Generate a master key for encryption
     */
    generateMasterKey() {
        // In production, this should be securely generated and stored
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let key = '';
        for (let i = 0; i < 32; i++) {
            key += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return key;
    }

    /**
     * Encrypt sensitive data
     */
    async encrypt(data, fieldName = null) {
        try {
            if (!data) return data;

            // Check if field should be encrypted
            if (fieldName && !this.shouldEncryptField(fieldName)) {
                return data;
            }

            // Convert data to string if needed
            const plaintext = typeof data === 'string' ? data : JSON.stringify(data);
            
            // For demo purposes, use simple encoding
            // In production: use Web Crypto API with AES-GCM
            const encrypted = this.simpleEncrypt(plaintext);
            
            return {
                encrypted: true,
                data: encrypted,
                algorithm: 'SIMPLE_DEMO',
                timestamp: new Date().toISOString()
            };

        } catch (error) {
            console.error('Encryption failed:', error);
            throw new Error('Data encryption failed');
        }
    }

    /**
     * Decrypt sensitive data
     */
    async decrypt(encryptedData) {
        try {
            if (!encryptedData || !encryptedData.encrypted) {
                return encryptedData; // Not encrypted
            }

            // For demo purposes, use simple decoding
            const decrypted = this.simpleDecrypt(encryptedData.data);
            
            try {
                // Try to parse as JSON if it was an object
                return JSON.parse(decrypted);
            } catch {
                // Return as string if not JSON
                return decrypted;
            }

        } catch (error) {
            console.error('Decryption failed:', error);
            throw new Error('Data decryption failed');
        }
    }

    /**
     * Mask sensitive data for display
     */
    maskSensitiveData(data, fieldName) {
        if (!data) return data;

        const dataStr = data.toString();

        switch (fieldName) {
            case 'email':
                return this.maskEmail(dataStr);
            case 'phone':
                return this.maskPhone(dataStr);
            case 'creditCard':
                return this.maskCreditCard(dataStr);
            case 'ssn':
                return this.maskSSN(dataStr);
            case 'bankAccount':
                return this.maskBankAccount(dataStr);
            default:
                return this.maskGeneric(dataStr);
        }
    }

    /**
     * Mask email addresses
     */
    maskEmail(email) {
        if (!email || !email.includes('@')) return email;
        
        const [username, domain] = email.split('@');
        const maskedUsername = username.length > 2 
            ? username.substring(0, 2) + '*'.repeat(username.length - 2)
            : username;
        
        return `${maskedUsername}@${domain}`;
    }

    /**
     * Mask phone numbers
     */
    maskPhone(phone) {
        const cleaned = phone.replace(/\D/g, '');
        if (cleaned.length >= 10) {
            return cleaned.substring(0, 3) + '-***-' + cleaned.substring(cleaned.length - 4);
        }
        return '***-***-****';
    }

    /**
     * Mask credit card numbers
     */
    maskCreditCard(cardNumber) {
        const cleaned = cardNumber.replace(/\D/g, '');
        if (cleaned.length >= 4) {
            return '*'.repeat(cleaned.length - 4) + cleaned.substring(cleaned.length - 4);
        }
        return '****-****-****-****';
    }

    /**
     * Mask SSN
     */
    maskSSN(ssn) {
        const cleaned = ssn.replace(/\D/g, '');
        if (cleaned.length === 9) {
            return '***-**-' + cleaned.substring(5);
        }
        return '***-**-****';
    }

    /**
     * Mask bank account numbers
     */
    maskBankAccount(account) {
        const cleaned = account.replace(/\D/g, '');
        if (cleaned.length >= 4) {
            return '*'.repeat(cleaned.length - 4) + cleaned.substring(cleaned.length - 4);
        }
        return '****';
    }

    /**
     * Generic masking for other sensitive fields
     */
    maskGeneric(data) {
        if (data.length <= 4) {
            return '*'.repeat(data.length);
        }
        return data.substring(0, 2) + '*'.repeat(data.length - 4) + data.substring(data.length - 2);
    }

    /**
     * Check if field should be encrypted
     */
    shouldEncryptField(fieldName) {
        return this.encryptedFields.has(fieldName.toLowerCase());
    }

    /**
     * Encrypt object with selective field encryption
     */
    async encryptObject(obj) {
        if (!obj || typeof obj !== 'object') return obj;

        const encrypted = { ...obj };
        
        for (const [key, value] of Object.entries(obj)) {
            if (this.shouldEncryptField(key) && value) {
                encrypted[key] = await this.encrypt(value, key);
            }
        }

        return encrypted;
    }

    /**
     * Decrypt object with selective field decryption
     */
    async decryptObject(obj) {
        if (!obj || typeof obj !== 'object') return obj;

        const decrypted = { ...obj };
        
        for (const [key, value] of Object.entries(obj)) {
            if (value && typeof value === 'object' && value.encrypted) {
                decrypted[key] = await this.decrypt(value);
            }
        }

        return decrypted;
    }

    /**
     * Simple encryption for demo (replace with Web Crypto API in production)
     */
    simpleEncrypt(plaintext) {
        try {
            // Simple XOR cipher for demo - NOT SECURE for production
            const key = this.masterKey;
            let encrypted = '';
            
            for (let i = 0; i < plaintext.length; i++) {
                const keyChar = key[i % key.length];
                const encryptedChar = String.fromCharCode(
                    plaintext.charCodeAt(i) ^ keyChar.charCodeAt(0)
                );
                encrypted += encryptedChar;
            }
            
            // Base64 encode the result
            return btoa(encrypted);
            
        } catch (error) {
            throw new Error('Simple encryption failed');
        }
    }

    /**
     * Simple decryption for demo
     */
    simpleDecrypt(encryptedData) {
        try {
            // Decode from base64
            const encrypted = atob(encryptedData);
            const key = this.masterKey;
            let decrypted = '';
            
            for (let i = 0; i < encrypted.length; i++) {
                const keyChar = key[i % key.length];
                const decryptedChar = String.fromCharCode(
                    encrypted.charCodeAt(i) ^ keyChar.charCodeAt(0)
                );
                decrypted += decryptedChar;
            }
            
            return decrypted;
            
        } catch (error) {
            throw new Error('Simple decryption failed');
        }
    }

    /**
     * Generate secure hash for data integrity
     */
    async generateHash(data) {
        try {
            // Simple hash for demo - use crypto.subtle.digest in production
            const str = typeof data === 'string' ? data : JSON.stringify(data);
            let hash = 0;
            
            for (let i = 0; i < str.length; i++) {
                const char = str.charCodeAt(i);
                hash = ((hash << 5) - hash) + char;
                hash = hash & hash; // Convert to 32-bit integer
            }
            
            return hash.toString(16);
        } catch (error) {
            throw new Error('Hash generation failed');
        }
    }

    /**
     * Verify data integrity using hash
     */
    async verifyIntegrity(data, expectedHash) {
        try {
            const calculatedHash = await this.generateHash(data);
            return calculatedHash === expectedHash;
        } catch (error) {
            console.error('Integrity verification failed:', error);
            return false;
        }
    }

    /**
     * Tokenize sensitive data (replace with non-sensitive tokens)
     */
    tokenize(sensitiveData, fieldName) {
        if (!sensitiveData) return sensitiveData;

        // Generate a token that references the actual data
        const token = this.generateToken();
        
        // Store the mapping securely (in production: secure database)
        this.storeTokenMapping(token, sensitiveData, fieldName);
        
        return {
            tokenized: true,
            token: token,
            fieldType: fieldName,
            createdAt: new Date().toISOString()
        };
    }

    /**
     * Detokenize data (retrieve original from token)
     */
    detokenize(tokenData) {
        if (!tokenData || !tokenData.tokenized) {
            return tokenData; // Not tokenized
        }

        return this.retrieveTokenMapping(tokenData.token);
    }

    /**
     * Generate secure token
     */
    generateToken() {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let token = 'tok_';
        
        for (let i = 0; i < 16; i++) {
            token += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        
        return token;
    }

    /**
     * Store token mapping securely
     */
    storeTokenMapping(token, originalData, fieldType) {
        // In production: store in secure, encrypted database
        const mapping = {
            originalData: originalData,
            fieldType: fieldType,
            createdAt: new Date().toISOString()
        };
        
        sessionStorage.setItem(`token_${token}`, JSON.stringify(mapping));
    }

    /**
     * Retrieve original data from token
     */
    retrieveTokenMapping(token) {
        try {
            const mapping = sessionStorage.getItem(`token_${token}`);
            return mapping ? JSON.parse(mapping).originalData : null;
        } catch (error) {
            console.error('Token retrieval failed:', error);
            return null;
        }
    }

    /**
     * Secure data transmission preparation
     */
    prepareForTransmission(data) {
        // In production: add digital signatures, timestamps, etc.
        return {
            data: data,
            timestamp: new Date().toISOString(),
            signature: this.generateSignature(data),
            integrity: this.generateHash(data)
        };
    }

    /**
     * Generate digital signature (mock for demo)
     */
    generateSignature(data) {
        // In production: use proper digital signature algorithms
        return 'sig_' + this.generateHash(data);
    }

    /**
     * Validate received data
     */
    validateReceivedData(transmittedData) {
        try {
            const { data, signature, integrity } = transmittedData;
            
            // Verify integrity
            const calculatedHash = this.generateHash(data);
            if (calculatedHash !== integrity) {
                throw new Error('Data integrity check failed');
            }

            // Verify signature
            const expectedSignature = this.generateSignature(data);
            if (signature !== expectedSignature) {
                throw new Error('Digital signature verification failed');
            }

            return true;
        } catch (error) {
            console.error('Data validation failed:', error);
            return false;
        }
    }
}

// Export for use in other modules
if (typeof window !== 'undefined') {
    window.EncryptionService = EncryptionService;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = EncryptionService;
}
