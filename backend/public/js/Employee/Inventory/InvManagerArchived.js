document.addEventListener('DOMContentLoaded', function() {
    // Check permissions before initializing
    if (window.userPermissions) {
        if (!window.userPermissions.hasPermission('archived')) {
            console.log('User does not have archived permissions');
            window.userPermissions.redirectToForbidden();
            return;
        }
        window.userPermissions.updateUI();
    }
    
    // Initialize archived items functionality
    console.log('Initializing Archived Items Manager...');
    
    // Load archived products and materials
    loadArchivedItems();
    
    function loadArchivedItems() {
        // Implementation for loading archived items
        console.log('Loading archived items...');
    }
});