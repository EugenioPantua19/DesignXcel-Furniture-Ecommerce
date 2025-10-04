// Integration Test Script for Employee JavaScript Modules
// This script tests the integration between JavaScript modules and backend routes

const fs = require('fs');
const path = require('path');

class IntegrationTester {
    constructor() {
        this.testResults = {
            total: 0,
            passed: 0,
            failed: 0,
            warnings: 0,
            details: []
        };
        this.basePath = path.join(__dirname, '..');
    }

    // Run all integration tests
    async runAllTests() {
        console.log('Starting Employee JavaScript Integration Tests...\n');
        
        await this.testJavaScriptFiles();
        await this.testEJSTemplates();
        await this.testBackendRoutes();
        await this.testModuleDependencies();
        await this.testAPIConsistency();
        
        this.generateReport();
        return this.testResults;
    }

    // Test JavaScript files
    async testJavaScriptFiles() {
        console.log('Testing JavaScript files...');
        
        const jsFiles = [
            'public/js/Employee/shared/EmployeeUtils.js',
            'public/js/Employee/shared/PermissionsHandler.js',
            'public/js/Employee/Admin/AdminLogs.js',
            'public/js/Employee/Admin/AdminAlerts.js',
            'public/js/Employee/Admin/AdminCMS.js',
            'public/js/Employee/Admin/AdminManageUsers.js',
            'public/js/Employee/Inventory/InventoryManager.js',
            'public/js/Employee/Inventory/InvManagerAlerts.js',
            'public/js/Employee/Inventory/InventoryProducts.js',
            'public/js/Employee/Support/OrderSupport.js',
            'public/js/Employee/Support/SupportManager.js',
            'public/js/Employee/Transaction/TransactionManager.js',
            'public/js/Employee/UserManager/UserManager.js'
        ];

        let existingFiles = 0;
        const missingFiles = [];

        jsFiles.forEach(file => {
            this.testResults.total++;
            const filePath = path.join(this.basePath, file);
            
            if (fs.existsSync(filePath)) {
                existingFiles++;
                this.testResults.passed++;
                this.testResults.details.push({
                    test: 'JavaScript Files',
                    file: file,
                    status: 'PASS',
                    message: 'File exists'
                });
            } else {
                missingFiles.push(file);
                this.testResults.failed++;
                this.testResults.details.push({
                    test: 'JavaScript Files',
                    file: file,
                    status: 'FAIL',
                    message: 'File not found'
                });
            }
        });

        console.log(`JavaScript Files: ${existingFiles}/${jsFiles.length} files found`);
        if (missingFiles.length > 0) {
            console.warn('Missing files:', missingFiles);
        }
    }

    // Test EJS templates
    async testEJSTemplates() {
        console.log('Testing EJS templates...');
        
        const ejsFiles = [
            'views/Employee/Admin/AdminLogs.ejs',
            'views/Employee/Admin/AdminAlerts.ejs',
            'views/Employee/Admin/AdminCMS.ejs',
            'views/Employee/Admin/AdminManageUsers.ejs',
            'views/Employee/Inventory/InventoryManager.ejs',
            'views/Employee/Inventory/InventoryAlerts.ejs',
            'views/Employee/Inventory/InventoryProducts.ejs',
            'views/Employee/Support/OrderSupport.ejs',
            'views/Employee/Support/SupportManager.ejs',
            'views/Employee/Transaction/TransactionManager.ejs',
            'views/Employee/UserManager/UserManager.ejs'
        ];

        let existingTemplates = 0;
        const missingTemplates = [];

        ejsFiles.forEach(file => {
            this.testResults.total++;
            const filePath = path.join(this.basePath, file);
            
            if (fs.existsSync(filePath)) {
                existingTemplates++;
                
                // Check if template references JavaScript files
                try {
                    const content = fs.readFileSync(filePath, 'utf8');
                    const hasScriptTag = content.includes('<script src="/js/Employee/');
                    
                    if (hasScriptTag) {
                        this.testResults.passed++;
                        this.testResults.details.push({
                            test: 'EJS Templates',
                            file: file,
                            status: 'PASS',
                            message: 'Template exists and references JavaScript'
                        });
                    } else {
                        this.testResults.warnings++;
                        this.testResults.details.push({
                            test: 'EJS Templates',
                            file: file,
                            status: 'WARN',
                            message: 'Template exists but no JavaScript references found'
                        });
                    }
                } catch (error) {
                    this.testResults.failed++;
                    this.testResults.details.push({
                        test: 'EJS Templates',
                        file: file,
                        status: 'FAIL',
                        message: 'Error reading template: ' + error.message
                    });
                }
            } else {
                missingTemplates.push(file);
                this.testResults.failed++;
                this.testResults.details.push({
                    test: 'EJS Templates',
                    file: file,
                    status: 'FAIL',
                    message: 'Template not found'
                });
            }
        });

        console.log(`EJS Templates: ${existingTemplates}/${ejsFiles.length} templates found`);
        if (missingTemplates.length > 0) {
            console.warn('Missing templates:', missingTemplates);
        }
    }

    // Test backend routes
    async testBackendRoutes() {
        console.log('Testing backend routes...');
        
        const routesFile = path.join(this.basePath, 'routes.js');
        
        this.testResults.total++;
        
        if (!fs.existsSync(routesFile)) {
            this.testResults.failed++;
            this.testResults.details.push({
                test: 'Backend Routes',
                status: 'FAIL',
                message: 'Routes file not found'
            });
            return;
        }

        try {
            const content = fs.readFileSync(routesFile, 'utf8');
            
            // Check for API routes
            const apiRoutes = [
                '/api/rawmaterials',
                '/api/dashboard/products-count',
                '/api/dashboard/materials-count',
                '/api/admin/products',
                '/api/categories'
            ];

            let foundRoutes = 0;
            const missingRoutes = [];

            apiRoutes.forEach(route => {
                if (content.includes(route)) {
                    foundRoutes++;
                } else {
                    missingRoutes.push(route);
                }
            });

            if (foundRoutes === apiRoutes.length) {
                this.testResults.passed++;
                this.testResults.details.push({
                    test: 'Backend Routes',
                    status: 'PASS',
                    message: 'All required API routes found'
                });
            } else {
                this.testResults.warnings++;
                this.testResults.details.push({
                    test: 'Backend Routes',
                    status: 'WARN',
                    message: `${foundRoutes}/${apiRoutes.length} API routes found`,
                    details: missingRoutes.length > 0 ? `Missing: ${missingRoutes.join(', ')}` : null
                });
            }

        } catch (error) {
            this.testResults.failed++;
            this.testResults.details.push({
                test: 'Backend Routes',
                status: 'FAIL',
                message: 'Error reading routes file: ' + error.message
            });
        }
    }

    // Test module dependencies
    async testModuleDependencies() {
        console.log('Testing module dependencies...');
        
        this.testResults.total++;
        
        try {
            // Check if shared utilities are referenced in other modules
            const sharedFiles = [
                'public/js/Employee/shared/EmployeeUtils.js',
                'public/js/Employee/shared/PermissionsHandler.js'
            ];

            const moduleFiles = [
                'public/js/Employee/Admin/AdminLogs.js',
                'public/js/Employee/Admin/AdminAlerts.js',
                'public/js/Employee/Admin/AdminCMS.js',
                'public/js/Employee/Admin/AdminManageUsers.js',
                'public/js/Employee/Inventory/InventoryManager.js',
                'public/js/Employee/Inventory/InvManagerAlerts.js',
                'public/js/Employee/Inventory/InventoryProducts.js',
                'public/js/Employee/Support/OrderSupport.js',
                'public/js/Employee/Support/SupportManager.js',
                'public/js/Employee/Transaction/TransactionManager.js',
                'public/js/Employee/UserManager/UserManager.js'
            ];

            let dependenciesFound = 0;
            const missingDependencies = [];

            moduleFiles.forEach(file => {
                const filePath = path.join(this.basePath, file);
                
                if (fs.existsSync(filePath)) {
                    try {
                        const content = fs.readFileSync(filePath, 'utf8');
                        
                        // Check for references to shared utilities
                        const hasEmployeeUtils = content.includes('window.EmployeeUtils') || content.includes('EmployeeUtils');
                        const hasUserPermissions = content.includes('window.userPermissions') || content.includes('userPermissions');
                        
                        if (hasEmployeeUtils || hasUserPermissions) {
                            dependenciesFound++;
                        } else {
                            missingDependencies.push(file);
                        }
                    } catch (error) {
                        missingDependencies.push(file);
                    }
                }
            });

            if (dependenciesFound === moduleFiles.length) {
                this.testResults.passed++;
                this.testResults.details.push({
                    test: 'Module Dependencies',
                    status: 'PASS',
                    message: 'All modules reference shared utilities'
                });
            } else {
                this.testResults.warnings++;
                this.testResults.details.push({
                    test: 'Module Dependencies',
                    status: 'WARN',
                    message: `${dependenciesFound}/${moduleFiles.length} modules reference shared utilities`,
                    details: missingDependencies.length > 0 ? `Missing dependencies: ${missingDependencies.join(', ')}` : null
                });
            }

        } catch (error) {
            this.testResults.failed++;
            this.testResults.details.push({
                test: 'Module Dependencies',
                status: 'FAIL',
                message: 'Error testing module dependencies: ' + error.message
            });
        }
    }

    // Test API consistency
    async testAPIConsistency() {
        console.log('Testing API consistency...');
        
        this.testResults.total++;
        
        try {
            const routesFile = path.join(this.basePath, 'routes.js');
            const content = fs.readFileSync(routesFile, 'utf8');
            
            // Check for consistent API patterns
            const apiPatterns = [
                'router.get(\'/api/',
                'router.post(\'/api/',
                'router.put(\'/api/',
                'router.delete(\'/api/'
            ];

            let patternsFound = 0;
            const missingPatterns = [];

            apiPatterns.forEach(pattern => {
                if (content.includes(pattern)) {
                    patternsFound++;
                } else {
                    missingPatterns.push(pattern);
                }
            });

            if (patternsFound === apiPatterns.length) {
                this.testResults.passed++;
                this.testResults.details.push({
                    test: 'API Consistency',
                    status: 'PASS',
                    message: 'All API patterns found'
                });
            } else {
                this.testResults.warnings++;
                this.testResults.details.push({
                    test: 'API Consistency',
                    status: 'WARN',
                    message: `${patternsFound}/${apiPatterns.length} API patterns found`,
                    details: missingPatterns.length > 0 ? `Missing patterns: ${missingPatterns.join(', ')}` : null
                });
            }

        } catch (error) {
            this.testResults.failed++;
            this.testResults.details.push({
                test: 'API Consistency',
                status: 'FAIL',
                message: 'Error testing API consistency: ' + error.message
            });
        }
    }

    // Generate test report
    generateReport() {
        console.log('\n=== INTEGRATION TEST REPORT ===');
        console.log(`Total Tests: ${this.testResults.total}`);
        console.log(`Passed: ${this.testResults.passed}`);
        console.log(`Failed: ${this.testResults.failed}`);
        console.log(`Warnings: ${this.testResults.warnings}`);
        console.log('\n=== DETAILED RESULTS ===');
        
        this.testResults.details.forEach(detail => {
            console.log(`${detail.status}: ${detail.test} - ${detail.message}`);
            if (detail.details) {
                console.log(`  Details: ${detail.details}`);
            }
        });

        // Calculate success rate
        const successRate = ((this.testResults.passed / this.testResults.total) * 100).toFixed(2);
        console.log(`\nSuccess Rate: ${successRate}%`);

        // Overall status
        if (this.testResults.failed === 0) {
            console.log('\n✅ All integration tests passed!');
        } else if (this.testResults.failed <= 2) {
            console.log('\n⚠️  Most integration tests passed with minor issues.');
        } else {
            console.log('\n❌ Several integration tests failed. Please review the issues above.');
        }
    }
}

// Run tests if this script is executed directly
if (require.main === module) {
    const tester = new IntegrationTester();
    tester.runAllTests().then(() => {
        process.exit(0);
    }).catch(error => {
        console.error('Integration test failed:', error);
        process.exit(1);
    });
}

module.exports = IntegrationTester;
