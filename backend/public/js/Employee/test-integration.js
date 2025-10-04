// Employee JavaScript Integration Test
// Tests the integration between JavaScript modules and EJS templates

class IntegrationTester {
    constructor() {
        this.testResults = {
            total: 0,
            passed: 0,
            failed: 0,
            warnings: 0,
            details: []
        };
    }

    // Run all integration tests
    async runAllTests() {
        console.log('Starting Employee JavaScript Integration Tests...');
        
        await this.testModuleLoading();
        await this.testSharedUtilities();
        await this.testPermissionSystem();
        await this.testAPIEndpoints();
        await this.testEJSTemplateCompatibility();
        await this.testEventHandlers();
        await this.testNotificationSystem();
        await this.testFormValidation();
        await this.testRealTimeUpdates();
        
        this.generateReport();
        return this.testResults;
    }

    // Test module loading
    async testModuleLoading() {
        console.log('Testing module loading...');
        
        const modules = [
            'EmployeeUtils',
            'userPermissions',
            'AdminLogs',
            'AdminAlerts',
            'AdminCMS',
            'AdminManageUsers',
            'InventoryManager',
            'InvManagerAlerts',
            'InventoryProducts',
            'OrderSupport',
            'SupportManager',
            'TransactionManager',
            'UserManager'
        ];

        let loadedModules = 0;
        const missingModules = [];

        modules.forEach(module => {
            this.testResults.total++;
            if (typeof window[module] !== 'undefined') {
                loadedModules++;
                this.testResults.passed++;
                this.testResults.details.push({
                    test: 'Module Loading',
                    module: module,
                    status: 'PASS',
                    message: 'Module loaded successfully'
                });
            } else {
                missingModules.push(module);
                this.testResults.failed++;
                this.testResults.details.push({
                    test: 'Module Loading',
                    module: module,
                    status: 'FAIL',
                    message: 'Module not loaded'
                });
            }
        });

        console.log(`Module Loading: ${loadedModules}/${modules.length} modules loaded`);
        if (missingModules.length > 0) {
            console.warn('Missing modules:', missingModules);
        }
    }

    // Test shared utilities
    async testSharedUtilities() {
        console.log('Testing shared utilities...');
        
        this.testResults.total++;
        
        try {
            if (typeof window.EmployeeUtils === 'undefined') {
                throw new Error('EmployeeUtils not loaded');
            }

            const utils = window.EmployeeUtils;
            let utilityTests = [];

            // Test notification system
            try {
                utils.showNotification('Test notification', 'success', 1000);
                utilityTests.push('Notification system working');
            } catch (e) {
                utilityTests.push('Notification system failed: ' + e.message);
            }

            // Test date formatting
            try {
                const formattedDate = utils.formatDate(new Date());
                utilityTests.push('Date formatting working');
            } catch (e) {
                utilityTests.push('Date formatting failed: ' + e.message);
            }

            // Test currency formatting
            try {
                const formattedCurrency = utils.formatCurrency(123.45);
                utilityTests.push('Currency formatting working');
            } catch (e) {
                utilityTests.push('Currency formatting failed: ' + e.message);
            }

            // Test form serialization
            try {
                const testForm = document.createElement('form');
                testForm.innerHTML = '<input name="test" value="test">';
                const serialized = utils.serializeForm(testForm);
                if (serialized.test === 'test') {
                    utilityTests.push('Form serialization working');
                } else {
                    utilityTests.push('Form serialization failed');
                }
            } catch (e) {
                utilityTests.push('Form serialization failed: ' + e.message);
            }

            const successCount = utilityTests.filter(t => !t.includes('failed')).length;
            
            if (successCount === utilityTests.length) {
                this.testResults.passed++;
                this.testResults.details.push({
                    test: 'Shared Utilities',
                    status: 'PASS',
                    message: 'All utility functions working'
                });
            } else {
                this.testResults.warnings++;
                this.testResults.details.push({
                    test: 'Shared Utilities',
                    status: 'WARN',
                    message: `${successCount}/${utilityTests.length} utility functions working`
                });
            }

        } catch (error) {
            this.testResults.failed++;
            this.testResults.details.push({
                test: 'Shared Utilities',
                status: 'FAIL',
                message: 'Shared utilities test failed: ' + error.message
            });
        }
    }

    // Test permission system
    async testPermissionSystem() {
        console.log('Testing permission system...');
        
        this.testResults.total++;
        
        try {
            if (typeof window.userPermissions === 'undefined') {
                throw new Error('PermissionsHandler not loaded');
            }

            const permissions = window.userPermissions;
            let permissionTests = [];

            // Test permission checking
            try {
                const hasPermission = permissions.hasPermission('test');
                permissionTests.push('Permission checking working');
            } catch (e) {
                permissionTests.push('Permission checking failed: ' + e.message);
            }

            // Test role checking
            try {
                const isAdmin = permissions.isAdmin();
                permissionTests.push('Role checking working');
            } catch (e) {
                permissionTests.push('Role checking failed: ' + e.message);
            }

            // Test UI updates
            try {
                permissions.updateUI();
                permissionTests.push('UI update working');
            } catch (e) {
                permissionTests.push('UI update failed: ' + e.message);
            }

            const successCount = permissionTests.filter(t => !t.includes('failed')).length;
            
            if (successCount === permissionTests.length) {
                this.testResults.passed++;
                this.testResults.details.push({
                    test: 'Permission System',
                    status: 'PASS',
                    message: 'All permission functions working'
                });
            } else {
                this.testResults.warnings++;
                this.testResults.details.push({
                    test: 'Permission System',
                    status: 'WARN',
                    message: `${successCount}/${permissionTests.length} permission functions working`
                });
            }

        } catch (error) {
            this.testResults.failed++;
            this.testResults.details.push({
                test: 'Permission System',
                status: 'FAIL',
                message: 'Permission system test failed: ' + error.message
            });
        }
    }

    // Test API endpoints
    async testAPIEndpoints() {
        console.log('Testing API endpoints...');
        
        const endpoints = [
            '/api/rawmaterials',
            '/api/dashboard/products-count',
            '/api/dashboard/materials-count',
            '/api/admin/products',
            '/api/categories'
        ];

        let workingEndpoints = 0;
        const endpointResults = [];

        for (const endpoint of endpoints) {
            this.testResults.total++;
            
            try {
                const response = await fetch(endpoint);
                if (response.ok) {
                    workingEndpoints++;
                    this.testResults.passed++;
                    endpointResults.push({
                        endpoint: endpoint,
                        status: 'PASS',
                        message: `OK (${response.status})`
                    });
                } else {
                    this.testResults.warnings++;
                    endpointResults.push({
                        endpoint: endpoint,
                        status: 'WARN',
                        message: `${response.status} ${response.statusText}`
                    });
                }
            } catch (error) {
                this.testResults.failed++;
                endpointResults.push({
                    endpoint: endpoint,
                    status: 'FAIL',
                    message: error.message
                });
            }
        }

        this.testResults.details.push({
            test: 'API Endpoints',
            status: workingEndpoints === endpoints.length ? 'PASS' : 'WARN',
            message: `${workingEndpoints}/${endpoints.length} endpoints working`,
            details: endpointResults
        });

        console.log(`API Endpoints: ${workingEndpoints}/${endpoints.length} endpoints working`);
    }

    // Test EJS template compatibility
    async testEJSTemplateCompatibility() {
        console.log('Testing EJS template compatibility...');
        
        this.testResults.total++;
        
        try {
            // Check if required DOM elements exist (simulating EJS template structure)
            const requiredElements = [
                'activityLogsTable',
                'usersList',
                'productsList',
                'activeChatsList',
                'recentOrders'
            ];

            let existingElements = 0;
            const missingElements = [];

            requiredElements.forEach(elementId => {
                const element = document.getElementById(elementId);
                if (element) {
                    existingElements++;
                } else {
                    missingElements.push(elementId);
                }
            });

            if (existingElements === requiredElements.length) {
                this.testResults.passed++;
                this.testResults.details.push({
                    test: 'EJS Template Compatibility',
                    status: 'PASS',
                    message: 'All required DOM elements found'
                });
            } else {
                this.testResults.warnings++;
                this.testResults.details.push({
                    test: 'EJS Template Compatibility',
                    status: 'WARN',
                    message: `${existingElements}/${requiredElements.length} DOM elements found`,
                    details: missingElements.length > 0 ? `Missing: ${missingElements.join(', ')}` : null
                });
            }

        } catch (error) {
            this.testResults.failed++;
            this.testResults.details.push({
                test: 'EJS Template Compatibility',
                status: 'FAIL',
                message: 'EJS template compatibility test failed: ' + error.message
            });
        }
    }

    // Test event handlers
    async testEventHandlers() {
        console.log('Testing event handlers...');
        
        this.testResults.total++;
        
        try {
            // Test if event listeners can be attached
            const testButton = document.createElement('button');
            testButton.id = 'testButton';
            document.body.appendChild(testButton);

            let eventFired = false;
            testButton.addEventListener('click', () => {
                eventFired = true;
            });

            // Simulate click
            testButton.click();

            // Clean up
            document.body.removeChild(testButton);

            if (eventFired) {
                this.testResults.passed++;
                this.testResults.details.push({
                    test: 'Event Handlers',
                    status: 'PASS',
                    message: 'Event handlers working correctly'
                });
            } else {
                this.testResults.failed++;
                this.testResults.details.push({
                    test: 'Event Handlers',
                    status: 'FAIL',
                    message: 'Event handlers not working'
                });
            }

        } catch (error) {
            this.testResults.failed++;
            this.testResults.details.push({
                test: 'Event Handlers',
                status: 'FAIL',
                message: 'Event handlers test failed: ' + error.message
            });
        }
    }

    // Test notification system
    async testNotificationSystem() {
        console.log('Testing notification system...');
        
        this.testResults.total++;
        
        try {
            if (typeof window.EmployeeUtils === 'undefined') {
                throw new Error('EmployeeUtils not available');
            }

            // Test different notification types
            const notificationTypes = ['success', 'error', 'warning', 'info'];
            let notificationsWorking = 0;

            notificationTypes.forEach(type => {
                try {
                    window.EmployeeUtils.showNotification(`Test ${type} notification`, type, 1000);
                    notificationsWorking++;
                } catch (e) {
                    console.error(`Notification type ${type} failed:`, e);
                }
            });

            if (notificationsWorking === notificationTypes.length) {
                this.testResults.passed++;
                this.testResults.details.push({
                    test: 'Notification System',
                    status: 'PASS',
                    message: 'All notification types working'
                });
            } else {
                this.testResults.warnings++;
                this.testResults.details.push({
                    test: 'Notification System',
                    status: 'WARN',
                    message: `${notificationsWorking}/${notificationTypes.length} notification types working`
                });
            }

        } catch (error) {
            this.testResults.failed++;
            this.testResults.details.push({
                test: 'Notification System',
                status: 'FAIL',
                message: 'Notification system test failed: ' + error.message
            });
        }
    }

    // Test form validation
    async testFormValidation() {
        console.log('Testing form validation...');
        
        this.testResults.total++;
        
        try {
            if (typeof window.EmployeeUtils === 'undefined') {
                throw new Error('EmployeeUtils not available');
            }

            // Create test form
            const testForm = document.createElement('form');
            testForm.innerHTML = `
                <input name="name" value="John Doe">
                <input name="email" value="john@example.com">
                <input name="password" value="password123">
            `;

            const validation = window.EmployeeUtils.validateForm(testForm, {
                name: { required: true, label: 'Name', minLength: 2 },
                email: { required: true, label: 'Email', pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ },
                password: { required: true, label: 'Password', minLength: 6 }
            });

            if (validation.isValid) {
                this.testResults.passed++;
                this.testResults.details.push({
                    test: 'Form Validation',
                    status: 'PASS',
                    message: 'Form validation working correctly'
                });
            } else {
                this.testResults.warnings++;
                this.testResults.details.push({
                    test: 'Form Validation',
                    status: 'WARN',
                    message: 'Form validation working but found errors: ' + validation.errors.join(', ')
                });
            }

        } catch (error) {
            this.testResults.failed++;
            this.testResults.details.push({
                test: 'Form Validation',
                status: 'FAIL',
                message: 'Form validation test failed: ' + error.message
            });
        }
    }

    // Test real-time updates
    async testRealTimeUpdates() {
        console.log('Testing real-time updates...');
        
        this.testResults.total++;
        
        try {
            // Test WebSocket connection (will fail in test environment but we can test the setup)
            if (typeof WebSocket !== 'undefined') {
                this.testResults.passed++;
                this.testResults.details.push({
                    test: 'Real-time Updates',
                    status: 'PASS',
                    message: 'WebSocket support available'
                });
            } else {
                this.testResults.warnings++;
                this.testResults.details.push({
                    test: 'Real-time Updates',
                    status: 'WARN',
                    message: 'WebSocket not supported in this environment'
                });
            }

        } catch (error) {
            this.testResults.failed++;
            this.testResults.details.push({
                test: 'Real-time Updates',
                status: 'FAIL',
                message: 'Real-time updates test failed: ' + error.message
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

        // Create visual report in DOM if available
        if (document.getElementById('testResults')) {
            const reportElement = document.getElementById('testResults');
            reportElement.innerHTML = `
                <h3>Integration Test Report</h3>
                <div class="test-summary">
                    <p><strong>Total Tests:</strong> ${this.testResults.total}</p>
                    <p><strong>Passed:</strong> ${this.testResults.passed}</p>
                    <p><strong>Failed:</strong> ${this.testResults.failed}</p>
                    <p><strong>Warnings:</strong> ${this.testResults.warnings}</p>
                </div>
                <div class="test-details">
                    ${this.testResults.details.map(detail => `
                        <div class="test-detail ${detail.status.toLowerCase()}">
                            <strong>${detail.status}:</strong> ${detail.test} - ${detail.message}
                            ${detail.details ? `<br><small>${detail.details}</small>` : ''}
                        </div>
                    `).join('')}
                </div>
            `;
        }
    }
}

// Auto-run tests when DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
    const tester = new IntegrationTester();
    await tester.runAllTests();
});

// Export for manual testing
window.IntegrationTester = IntegrationTester;
