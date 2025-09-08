module.exports = (app, { appData, authenticateToken, requirePermissions, logAuditEvent, generateId, upload, csv, createCsvWriter, fs, path }) => {

    // Export data endpoints
    
    // Export products to CSV
    app.get('/api/export/products/csv', authenticateToken, requirePermissions(['read']), async (req, res) => {
        try {
            const { format = 'csv' } = req.query;
            
            if (format === 'csv') {
                const csvWriter = createCsvWriter({
                    path: path.join(__dirname, '../temp/products-export.csv'),
                    header: [
                        { id: 'id', title: 'ID' },
                        { id: 'sku', title: 'SKU' },
                        { id: 'name', title: 'Name' },
                        { id: 'category', title: 'Category' },
                        { id: 'price', title: 'Price' },
                        { id: 'cost', title: 'Cost' },
                        { id: 'stock', title: 'Stock' },
                        { id: 'reorderPoint', title: 'Reorder Point' },
                        { id: 'supplier', title: 'Supplier' },
                        { id: 'location', title: 'Location' }
                    ]
                });

                await csvWriter.writeRecords(appData.products);
                
                logAuditEvent(req.user.id, 'PRODUCTS_EXPORTED', 'export', 'products-csv', {
                    count: appData.products.length,
                    format: 'csv'
                });

                res.download(path.join(__dirname, '../temp/products-export.csv'), 'products-export.csv');
            } else {
                // JSON export
                res.setHeader('Content-Type', 'application/json');
                res.setHeader('Content-Disposition', 'attachment; filename="products-export.json"');
                
                logAuditEvent(req.user.id, 'PRODUCTS_EXPORTED', 'export', 'products-json', {
                    count: appData.products.length,
                    format: 'json'
                });

                res.json(appData.products);
            }

        } catch (error) {
            console.error('Export products error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to export products',
                code: 'EXPORT_PRODUCTS_ERROR'
            });
        }
    });

    // Export customers to CSV
    app.get('/api/export/customers/csv', authenticateToken, requirePermissions(['read']), async (req, res) => {
        try {
            const { format = 'csv' } = req.query;
            
            if (format === 'csv') {
                const csvWriter = createCsvWriter({
                    path: path.join(__dirname, '../temp/customers-export.csv'),
                    header: [
                        { id: 'id', title: 'ID' },
                        { id: 'name', title: 'Name' },
                        { id: 'type', title: 'Type' },
                        { id: 'email', title: 'Email' },
                        { id: 'phone', title: 'Phone' },
                        { id: 'address', title: 'Address' },
                        { id: 'paymentTerms', title: 'Payment Terms' },
                        { id: 'status', title: 'Status' },
                        { id: 'churnRisk', title: 'Churn Risk' },
                        { id: 'revenue', title: 'Revenue' },
                        { id: 'orders', title: 'Orders' }
                    ]
                });

                await csvWriter.writeRecords(appData.customers);
                
                logAuditEvent(req.user.id, 'CUSTOMERS_EXPORTED', 'export', 'customers-csv', {
                    count: appData.customers.length,
                    format: 'csv'
                });

                res.download(path.join(__dirname, '../temp/customers-export.csv'), 'customers-export.csv');
            } else {
                // JSON export
                res.setHeader('Content-Type', 'application/json');
                res.setHeader('Content-Disposition', 'attachment; filename="customers-export.json"');
                
                logAuditEvent(req.user.id, 'CUSTOMERS_EXPORTED', 'export', 'customers-json', {
                    count: appData.customers.length,
                    format: 'json'
                });

                res.json(appData.customers);
            }

        } catch (error) {
            console.error('Export customers error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to export customers',
                code: 'EXPORT_CUSTOMERS_ERROR'
            });
        }
    });

    // Import products from CSV
    app.post('/api/import/products/csv', authenticateToken, requirePermissions(['write']), upload.single('file'), async (req, res) => {
        try {
            if (!req.file) {
                return res.status(400).json({
                    success: false,
                    error: 'No file uploaded',
                    code: 'NO_FILE_UPLOADED'
                });
            }

            const results = [];
            const errors = [];
            let processedCount = 0;
            let skippedCount = 0;

            // Read and process CSV file
            const fileStream = require('fs').createReadStream(req.file.path);
            
            await new Promise((resolve, reject) => {
                fileStream
                    .pipe(csv())
                    .on('data', (data) => {
                        try {
                            // Validate required fields
                            if (!data.sku || !data.name || !data.category || !data.price) {
                                errors.push({
                                    row: processedCount + 1,
                                    error: 'Missing required fields (sku, name, category, price)',
                                    data
                                });
                                skippedCount++;
                                return;
                            }

                            // Check for existing SKU
                            const existingProduct = appData.products.find(p => 
                                p.sku.toLowerCase() === data.sku.toLowerCase()
                            );

                            if (existingProduct) {
                                // Update existing product
                                existingProduct.name = data.name;
                                existingProduct.category = data.category;
                                existingProduct.price = parseFloat(data.price) || 0;
                                existingProduct.cost = parseFloat(data.cost) || 0;
                                existingProduct.stock = parseInt(data.stock) || 0;
                                existingProduct.reorderPoint = parseInt(data.reorderPoint) || 10;
                                existingProduct.supplier = data.supplier || 'Unknown';
                                existingProduct.location = data.location || 'Warehouse A';
                                existingProduct.updatedAt = new Date();

                                results.push({
                                    action: 'updated',
                                    sku: data.sku,
                                    name: data.name
                                });
                            } else {
                                // Create new product
                                const newProduct = {
                                    id: generateId('P'),
                                    sku: data.sku.trim(),
                                    name: data.name.trim(),
                                    category: data.category.trim(),
                                    price: parseFloat(data.price) || 0,
                                    cost: parseFloat(data.cost) || 0,
                                    stock: parseInt(data.stock) || 0,
                                    reorderPoint: parseInt(data.reorderPoint) || 10,
                                    supplier: data.supplier || 'Unknown',
                                    location: data.location || 'Warehouse A',
                                    createdAt: new Date(),
                                    updatedAt: new Date()
                                };

                                appData.products.push(newProduct);

                                results.push({
                                    action: 'created',
                                    sku: data.sku,
                                    name: data.name
                                });
                            }

                            processedCount++;

                        } catch (error) {
                            errors.push({
                                row: processedCount + 1,
                                error: error.message,
                                data
                            });
                            skippedCount++;
                        }
                    })
                    .on('end', resolve)
                    .on('error', reject);
            });

            // Clean up uploaded file
            await fs.unlink(req.file.path);

            logAuditEvent(req.user.id, 'PRODUCTS_IMPORTED', 'import', 'products-csv', {
                processedCount,
                skippedCount,
                errorsCount: errors.length
            });

            res.json({
                success: true,
                data: {
                    summary: {
                        processedCount,
                        skippedCount,
                        errorsCount: errors.length
                    },
                    results,
                    errors: errors.slice(0, 10) // Return first 10 errors
                }
            });

        } catch (error) {
            console.error('Import products error:', error);
            
            // Clean up uploaded file
            if (req.file) {
                try {
                    await fs.unlink(req.file.path);
                } catch (unlinkError) {
                    console.error('Failed to clean up uploaded file:', unlinkError);
                }
            }

            res.status(500).json({
                success: false,
                error: 'Failed to import products',
                code: 'IMPORT_PRODUCTS_ERROR'
            });
        }
    });

    // Import customers from CSV
    app.post('/api/import/customers/csv', authenticateToken, requirePermissions(['write']), upload.single('file'), async (req, res) => {
        try {
            if (!req.file) {
                return res.status(400).json({
                    success: false,
                    error: 'No file uploaded',
                    code: 'NO_FILE_UPLOADED'
                });
            }

            const results = [];
            const errors = [];
            let processedCount = 0;
            let skippedCount = 0;

            // Read and process CSV file
            const fileStream = require('fs').createReadStream(req.file.path);
            
            await new Promise((resolve, reject) => {
                fileStream
                    .pipe(csv())
                    .on('data', (data) => {
                        try {
                            // Validate required fields
                            if (!data.name || !data.type) {
                                errors.push({
                                    row: processedCount + 1,
                                    error: 'Missing required fields (name, type)',
                                    data
                                });
                                skippedCount++;
                                return;
                            }

                            // Validate email format if provided
                            if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
                                errors.push({
                                    row: processedCount + 1,
                                    error: 'Invalid email format',
                                    data
                                });
                                skippedCount++;
                                return;
                            }

                            // Check for existing customer by email
                            let existingCustomer = null;
                            if (data.email) {
                                existingCustomer = appData.customers.find(c => 
                                    c.email && c.email.toLowerCase() === data.email.toLowerCase()
                                );
                            }

                            if (existingCustomer) {
                                // Update existing customer
                                existingCustomer.name = data.name;
                                existingCustomer.type = data.type;
                                existingCustomer.phone = data.phone || null;
                                existingCustomer.address = data.address || null;
                                existingCustomer.paymentTerms = data.paymentTerms || 'Net 30';
                                existingCustomer.status = data.status || 'Active';
                                existingCustomer.churnRisk = data.churnRisk || 'Low';
                                existingCustomer.revenue = parseFloat(data.revenue) || 0;
                                existingCustomer.orders = parseInt(data.orders) || 0;
                                existingCustomer.updatedAt = new Date();

                                results.push({
                                    action: 'updated',
                                    name: data.name,
                                    email: data.email
                                });
                            } else {
                                // Create new customer
                                const newCustomer = {
                                    id: generateId('C'),
                                    name: data.name.trim(),
                                    type: data.type.trim(),
                                    email: data.email ? data.email.trim().toLowerCase() : null,
                                    phone: data.phone ? data.phone.trim() : null,
                                    address: data.address ? data.address.trim() : null,
                                    paymentTerms: data.paymentTerms || 'Net 30',
                                    status: data.status || 'Active',
                                    churnRisk: data.churnRisk || 'Low',
                                    revenue: parseFloat(data.revenue) || 0,
                                    orders: parseInt(data.orders) || 0,
                                    lastOrder: null,
                                    createdAt: new Date(),
                                    updatedAt: new Date()
                                };

                                appData.customers.push(newCustomer);

                                results.push({
                                    action: 'created',
                                    name: data.name,
                                    email: data.email
                                });
                            }

                            processedCount++;

                        } catch (error) {
                            errors.push({
                                row: processedCount + 1,
                                error: error.message,
                                data
                            });
                            skippedCount++;
                        }
                    })
                    .on('end', resolve)
                    .on('error', reject);
            });

            // Clean up uploaded file
            await fs.unlink(req.file.path);

            logAuditEvent(req.user.id, 'CUSTOMERS_IMPORTED', 'import', 'customers-csv', {
                processedCount,
                skippedCount,
                errorsCount: errors.length
            });

            res.json({
                success: true,
                data: {
                    summary: {
                        processedCount,
                        skippedCount,
                        errorsCount: errors.length
                    },
                    results,
                    errors: errors.slice(0, 10) // Return first 10 errors
                }
            });

        } catch (error) {
            console.error('Import customers error:', error);
            
            // Clean up uploaded file
            if (req.file) {
                try {
                    await fs.unlink(req.file.path);
                } catch (unlinkError) {
                    console.error('Failed to clean up uploaded file:', unlinkError);
                }
            }

            res.status(500).json({
                success: false,
                error: 'Failed to import customers',
                code: 'IMPORT_CUSTOMERS_ERROR'
            });
        }
    });

    // Bulk export endpoint for multiple data types
    app.post('/api/export/bulk', authenticateToken, requirePermissions(['read']), async (req, res) => {
        try {
            const { entities = ['products'], format = 'json' } = req.body;
            
            const exportData = {};
            let totalRecords = 0;

            // Export requested entities
            if (entities.includes('products')) {
                exportData.products = appData.products;
                totalRecords += appData.products.length;
            }
            
            if (entities.includes('customers')) {
                exportData.customers = appData.customers;
                totalRecords += appData.customers.length;
            }
            
            if (entities.includes('orders')) {
                exportData.orders = appData.orders;
                totalRecords += appData.orders.length;
            }
            
            if (entities.includes('employees')) {
                exportData.employees = appData.employees;
                totalRecords += appData.employees.length;
            }

            exportData.exportMeta = {
                exportedAt: new Date(),
                exportedBy: req.user.name,
                entities,
                totalRecords,
                version: '1.0'
            };

            logAuditEvent(req.user.id, 'BULK_EXPORT', 'export', 'bulk-data', {
                entities,
                totalRecords,
                format
            });

            if (format === 'json') {
                res.setHeader('Content-Type', 'application/json');
                res.setHeader('Content-Disposition', 'attachment; filename="bulk-export.json"');
                res.json(exportData);
            } else {
                res.status(400).json({
                    success: false,
                    error: 'Bulk export only supports JSON format currently',
                    code: 'UNSUPPORTED_FORMAT'
                });
            }

        } catch (error) {
            console.error('Bulk export error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to perform bulk export',
                code: 'BULK_EXPORT_ERROR'
            });
        }
    });

};
