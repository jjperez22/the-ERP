module.exports = (app, { appData, authenticateToken, requirePermissions, logAuditEvent, generateId }) => {

    // Get all employees with filtering and pagination
    app.get('/api/employees', authenticateToken, requirePermissions(['read']), async (req, res) => {
        try {
            const {
                page = 1,
                limit = 50,
                department,
                status,
                search,
                sortBy = 'lastName',
                sortOrder = 'asc'
            } = req.query;

            let employees = [...appData.employees];

            // Apply filters
            if (department) {
                employees = employees.filter(e => e.department.toLowerCase() === department.toLowerCase());
            }

            if (status) {
                employees = employees.filter(e => e.status.toLowerCase() === status.toLowerCase());
            }

            if (search) {
                const searchTerm = search.toLowerCase();
                employees = employees.filter(e => 
                    e.fullName.toLowerCase().includes(searchTerm) ||
                    e.email.toLowerCase().includes(searchTerm) ||
                    e.position.toLowerCase().includes(searchTerm) ||
                    e.employeeNumber.toLowerCase().includes(searchTerm)
                );
            }

            // Apply sorting
            employees.sort((a, b) => {
                let aValue = a[sortBy];
                let bValue = b[sortBy];
                
                if (typeof aValue === 'string') {
                    aValue = aValue.toLowerCase();
                    bValue = bValue.toLowerCase();
                }

                if (sortOrder === 'desc') {
                    return bValue < aValue ? -1 : bValue > aValue ? 1 : 0;
                } else {
                    return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
                }
            });

            // Apply pagination
            const startIndex = (parseInt(page) - 1) * parseInt(limit);
            const endIndex = startIndex + parseInt(limit);
            const paginatedEmployees = employees.slice(startIndex, endIndex);

            res.json({
                success: true,
                data: {
                    employees: paginatedEmployees,
                    pagination: {
                        currentPage: parseInt(page),
                        totalPages: Math.ceil(employees.length / parseInt(limit)),
                        totalItems: employees.length,
                        itemsPerPage: parseInt(limit),
                        hasNextPage: endIndex < employees.length,
                        hasPrevPage: startIndex > 0
                    }
                }
            });

        } catch (error) {
            console.error('Get employees error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch employees',
                code: 'FETCH_EMPLOYEES_ERROR'
            });
        }
    });

    // Get single employee by ID
    app.get('/api/employees/:id', authenticateToken, requirePermissions(['read']), async (req, res) => {
        try {
            const { id } = req.params;
            const employee = appData.employees.find(e => e.id === id);

            if (!employee) {
                return res.status(404).json({
                    success: false,
                    error: 'Employee not found',
                    code: 'EMPLOYEE_NOT_FOUND'
                });
            }

            res.json({
                success: true,
                data: { employee }
            });

        } catch (error) {
            console.error('Get employee error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch employee',
                code: 'FETCH_EMPLOYEE_ERROR'
            });
        }
    });

    // Create new employee
    app.post('/api/employees', authenticateToken, requirePermissions(['write']), async (req, res) => {
        try {
            const {
                firstName,
                lastName,
                email,
                phone,
                position,
                department,
                salary,
                payType = 'Salary',
                status = 'Active',
                hireDate,
                location = 'Main Office',
                manager,
                emergencyContact,
                skills = []
            } = req.body;

            // Validate required fields
            if (!firstName || !lastName || !email || !position || !department || salary === undefined) {
                return res.status(400).json({
                    success: false,
                    error: 'Missing required fields: firstName, lastName, email, position, department, salary',
                    code: 'MISSING_REQUIRED_FIELDS'
                });
            }

            // Validate email format
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                return res.status(400).json({
                    success: false,
                    error: 'Invalid email format',
                    code: 'INVALID_EMAIL'
                });
            }

            // Check if email already exists
            const existingEmployee = appData.employees.find(e => 
                e.email.toLowerCase() === email.toLowerCase()
            );
            if (existingEmployee) {
                return res.status(409).json({
                    success: false,
                    error: 'Employee with this email already exists',
                    code: 'EMAIL_EXISTS'
                });
            }

            // Generate employee number
            const existingNumbers = appData.employees.map(e => 
                parseInt(e.employeeNumber.replace('E', ''))
            ).filter(n => !isNaN(n));
            const nextNumber = Math.max(...existingNumbers, 2024000) + 1;
            const employeeNumber = `E${nextNumber}`;

            const newEmployee = {
                id: generateId('EMP'),
                employeeNumber,
                firstName: firstName.trim(),
                lastName: lastName.trim(),
                fullName: `${firstName.trim()} ${lastName.trim()}`,
                email: email.trim().toLowerCase(),
                phone: phone ? phone.trim() : null,
                position: position.trim(),
                department: department.trim(),
                salary: parseFloat(salary),
                payType,
                status,
                hireDate: hireDate || new Date().toISOString().split('T')[0],
                location: location.trim(),
                manager: manager ? manager.trim() : null,
                emergencyContact: emergencyContact ? emergencyContact.trim() : null,
                skills: Array.isArray(skills) ? skills : [],
                performanceRating: 3.0, // Default rating
                createdAt: new Date(),
                updatedAt: new Date()
            };

            appData.employees.push(newEmployee);

            logAuditEvent(req.user.id, 'EMPLOYEE_CREATED', 'employee', newEmployee.id, {
                name: newEmployee.fullName,
                position: newEmployee.position,
                department: newEmployee.department
            });

            res.status(201).json({
                success: true,
                data: { employee: newEmployee }
            });

        } catch (error) {
            console.error('Create employee error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to create employee',
                code: 'CREATE_EMPLOYEE_ERROR'
            });
        }
    });

};
