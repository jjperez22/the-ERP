module.exports = (app, { appData, authenticateToken, requirePermissions, logAuditEvent, generateId }) => {

    // Get all integrations status
    app.get('/api/integrations', authenticateToken, requirePermissions(['read']), async (req, res) => {
        try {
            const integrations = appData.integrations;
            
            // Create a summary with connection status
            const summary = {
                accounting: {
                    quickbooks: {
                        enabled: integrations.accounting.quickbooks.enabled,
                        connected: !!integrations.accounting.quickbooks.accessToken,
                        lastSync: integrations.accounting.quickbooks.lastSync
                    },
                    xero: {
                        enabled: integrations.accounting.xero.enabled,
                        connected: !!integrations.accounting.xero.accessToken,
                        lastSync: integrations.accounting.xero.lastSync
                    }
                },
                crm: {
                    salesforce: {
                        enabled: integrations.crm.salesforce.enabled,
                        connected: !!integrations.crm.salesforce.accessToken,
                        lastSync: integrations.crm.salesforce.lastSync
                    },
                    hubspot: {
                        enabled: integrations.crm.hubspot.enabled,
                        connected: !!integrations.crm.hubspot.accessToken,
                        lastSync: integrations.crm.hubspot.lastSync
                    }
                },
                ecommerce: {
                    shopify: {
                        enabled: integrations.ecommerce.shopify.enabled,
                        connected: !!integrations.ecommerce.shopify.accessToken,
                        lastSync: integrations.ecommerce.shopify.lastSync
                    },
                    woocommerce: {
                        enabled: integrations.ecommerce.woocommerce.enabled,
                        connected: !!integrations.ecommerce.woocommerce.consumerKey,
                        lastSync: integrations.ecommerce.woocommerce.lastSync
                    }
                }
            };

            res.json({
                success: true,
                data: { integrations: summary }
            });

        } catch (error) {
            console.error('Get integrations error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch integrations',
                code: 'FETCH_INTEGRATIONS_ERROR'
            });
        }
    });

    // Enable/disable integration
    app.post('/api/integrations/:category/:platform/toggle', authenticateToken, requirePermissions(['write']), async (req, res) => {
        try {
            const { category, platform } = req.params;
            const { enabled } = req.body;

            if (!appData.integrations[category] || !appData.integrations[category][platform]) {
                return res.status(404).json({
                    success: false,
                    error: 'Integration not found',
                    code: 'INTEGRATION_NOT_FOUND'
                });
            }

            const integration = appData.integrations[category][platform];
            const oldStatus = integration.enabled;
            integration.enabled = !!enabled;

            logAuditEvent(req.user.id, 'INTEGRATION_TOGGLED', 'integration', `${category}-${platform}`, {
                category,
                platform,
                oldStatus,
                newStatus: integration.enabled
            });

            res.json({
                success: true,
                data: {
                    category,
                    platform,
                    enabled: integration.enabled,
                    statusChanged: oldStatus !== integration.enabled
                }
            });

        } catch (error) {
            console.error('Toggle integration error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to toggle integration',
                code: 'TOGGLE_INTEGRATION_ERROR'
            });
        }
    });

    // QuickBooks OAuth callback simulation
    app.post('/api/integrations/quickbooks/connect', authenticateToken, requirePermissions(['write']), async (req, res) => {
        try {
            const { companyId, code } = req.body;

            if (!companyId || !code) {
                return res.status(400).json({
                    success: false,
                    error: 'Company ID and authorization code are required',
                    code: 'MISSING_CREDENTIALS'
                });
            }

            // Simulate token exchange (in real implementation, would call QuickBooks API)
            const mockAccessToken = `qb_access_${generateId()}`;
            const mockRefreshToken = `qb_refresh_${generateId()}`;

            appData.integrations.accounting.quickbooks = {
                enabled: true,
                clientId: 'mock_client_id',
                clientSecret: 'mock_client_secret',
                accessToken: mockAccessToken,
                refreshToken: mockRefreshToken,
                companyId,
                lastSync: null
            };

            logAuditEvent(req.user.id, 'QUICKBOOKS_CONNECTED', 'integration', 'quickbooks', { companyId });

            res.json({
                success: true,
                data: {
                    platform: 'QuickBooks',
                    connected: true,
                    companyId,
                    message: 'QuickBooks integration connected successfully'
                }
            });

        } catch (error) {
            console.error('QuickBooks connect error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to connect QuickBooks',
                code: 'QUICKBOOKS_CONNECT_ERROR'
            });
        }
    });

    // Salesforce OAuth callback simulation  
    app.post('/api/integrations/salesforce/connect', authenticateToken, requirePermissions(['write']), async (req, res) => {
        try {
            const { instanceUrl, code } = req.body;

            if (!instanceUrl || !code) {
                return res.status(400).json({
                    success: false,
                    error: 'Instance URL and authorization code are required',
                    code: 'MISSING_CREDENTIALS'
                });
            }

            // Simulate token exchange
            const mockAccessToken = `sf_access_${generateId()}`;
            const mockRefreshToken = `sf_refresh_${generateId()}`;

            appData.integrations.crm.salesforce = {
                enabled: true,
                clientId: 'mock_sf_client_id',
                clientSecret: 'mock_sf_client_secret',
                accessToken: mockAccessToken,
                refreshToken: mockRefreshToken,
                instanceUrl,
                lastSync: null
            };

            logAuditEvent(req.user.id, 'SALESFORCE_CONNECTED', 'integration', 'salesforce', { instanceUrl });

            res.json({
                success: true,
                data: {
                    platform: 'Salesforce',
                    connected: true,
                    instanceUrl,
                    message: 'Salesforce integration connected successfully'
                }
            });

        } catch (error) {
            console.error('Salesforce connect error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to connect Salesforce',
                code: 'SALESFORCE_CONNECT_ERROR'
            });
        }
    });

    // Generic sync endpoint for any integration
    app.post('/api/integrations/:category/:platform/sync', authenticateToken, requirePermissions(['write']), async (req, res) => {
        try {
            const { category, platform } = req.params;
            const { syncType = 'full' } = req.body; // 'full' or 'incremental'

            if (!appData.integrations[category] || !appData.integrations[category][platform]) {
                return res.status(404).json({
                    success: false,
                    error: 'Integration not found',
                    code: 'INTEGRATION_NOT_FOUND'
                });
            }

            const integration = appData.integrations[category][platform];

            if (!integration.enabled) {
                return res.status(400).json({
                    success: false,
                    error: 'Integration is not enabled',
                    code: 'INTEGRATION_DISABLED'
                });
            }

            if (!integration.accessToken && !integration.consumerKey) {
                return res.status(400).json({
                    success: false,
                    error: 'Integration is not connected',
                    code: 'INTEGRATION_NOT_CONNECTED'
                });
            }

            // Simulate sync process
            const syncResults = await simulateSync(category, platform, syncType);
            
            // Update last sync time
            integration.lastSync = new Date();

            logAuditEvent(req.user.id, 'INTEGRATION_SYNCED', 'integration', `${category}-${platform}`, {
                category,
                platform,
                syncType,
                results: syncResults
            });

            res.json({
                success: true,
                data: {
                    category,
                    platform,
                    syncType,
                    lastSync: integration.lastSync,
                    results: syncResults
                }
            });

        } catch (error) {
            console.error('Sync integration error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to sync integration',
                code: 'SYNC_INTEGRATION_ERROR'
            });
        }
    });

    // Disconnect integration
    app.post('/api/integrations/:category/:platform/disconnect', authenticateToken, requirePermissions(['write']), async (req, res) => {
        try {
            const { category, platform } = req.params;

            if (!appData.integrations[category] || !appData.integrations[category][platform]) {
                return res.status(404).json({
                    success: false,
                    error: 'Integration not found',
                    code: 'INTEGRATION_NOT_FOUND'
                });
            }

            const integration = appData.integrations[category][platform];

            // Clear credentials
            integration.accessToken = null;
            integration.refreshToken = null;
            integration.consumerKey = null;
            integration.consumerSecret = null;
            integration.apiKey = null;
            integration.enabled = false;
            integration.lastSync = null;

            logAuditEvent(req.user.id, 'INTEGRATION_DISCONNECTED', 'integration', `${category}-${platform}`, {
                category,
                platform
            });

            res.json({
                success: true,
                data: {
                    category,
                    platform,
                    connected: false,
                    message: `${platform} integration disconnected successfully`
                }
            });

        } catch (error) {
            console.error('Disconnect integration error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to disconnect integration',
                code: 'DISCONNECT_INTEGRATION_ERROR'
            });
        }
    });

    // Helper function to simulate sync results
    async function simulateSync(category, platform, syncType) {
        // Simulate different sync results based on category
        const baseResults = {
            startTime: new Date(),
            syncType,
            status: 'completed'
        };

        switch (category) {
            case 'accounting':
                return {
                    ...baseResults,
                    itemsSynced: {
                        customers: Math.floor(Math.random() * 50) + 10,
                        invoices: Math.floor(Math.random() * 100) + 20,
                        items: Math.floor(Math.random() * 200) + 50
                    },
                    errors: Math.floor(Math.random() * 3)
                };
            
            case 'crm':
                return {
                    ...baseResults,
                    itemsSynced: {
                        contacts: Math.floor(Math.random() * 100) + 25,
                        leads: Math.floor(Math.random() * 30) + 5,
                        opportunities: Math.floor(Math.random() * 15) + 3
                    },
                    errors: Math.floor(Math.random() * 2)
                };
            
            case 'ecommerce':
                return {
                    ...baseResults,
                    itemsSynced: {
                        products: Math.floor(Math.random() * 150) + 30,
                        orders: Math.floor(Math.random() * 75) + 15,
                        customers: Math.floor(Math.random() * 100) + 20
                    },
                    errors: Math.floor(Math.random() * 5)
                };
            
            default:
                return {
                    ...baseResults,
                    itemsSynced: Math.floor(Math.random() * 100) + 10,
                    errors: 0
                };
        }
    }

};
