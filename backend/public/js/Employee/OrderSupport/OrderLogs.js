// Enhanced OrderLogs.js with filtering and detailed display

document.addEventListener('DOMContentLoaded', function() {
    console.log('Enhanced OrderLogs.js loaded, fetching activity logs...');
    
    let allLogs = []; // Store all logs for filtering
    let filteredLogs = []; // Store filtered logs
    
    // Initialize
    fetchActivityLogs();
    
    // Set up event listeners for filters
    setupFilterEventListeners();

    async function fetchActivityLogs() {
        try {
            console.log('Making request to /Employee/OrderSupport/Logs/Data...');
            const response = await fetch('/Employee/OrderSupport/Logs/Data');
            console.log('Response received:', response.status, response.statusText);
            
            const data = await response.json();
            console.log('Parsed response data:', data);

            if (data.success) {
                console.log('Successfully fetched logs:', data.logs);
                allLogs = data.logs;
                filteredLogs = [...allLogs];
                displayActivityLogs(filteredLogs);
            } else {
                console.error('Error in response data:', data.message, data.error);
                showError(`Failed to load activity logs: ${data.message || 'Unknown error'}. ${data.error ? `Details: ${data.error}` : ''}`);
            }
        } catch (error) {
            console.error('Error fetching activity logs:', error);
            showError(`Error loading activity logs: ${error.message}. Please check the console for more details.`);
        }
    }

    function setupFilterEventListeners() {
        // Add event listeners for real-time filtering
        document.getElementById('searchFilter').addEventListener('input', debounce(applyFilters, 300));
        document.getElementById('actionFilter').addEventListener('change', applyFilters);
        document.getElementById('tableFilter').addEventListener('change', applyFilters);
        document.getElementById('userFilter').addEventListener('change', applyFilters);
        document.getElementById('dateFromFilter').addEventListener('change', applyFilters);
        document.getElementById('dateToFilter').addEventListener('change', applyFilters);
    }

    function applyFilters() {
        const actionFilter = document.getElementById('actionFilter').value;
        const tableFilter = document.getElementById('tableFilter').value;
        const userFilter = document.getElementById('userFilter').value;
        const dateFromFilter = document.getElementById('dateFromFilter').value;
        const dateToFilter = document.getElementById('dateToFilter').value;
        const searchFilter = document.getElementById('searchFilter').value.toLowerCase();

        filteredLogs = allLogs.filter(log => {
            // Action filter
            if (actionFilter && log.Action !== actionFilter) return false;
            
            // Table filter
            if (tableFilter && log.TableAffected !== tableFilter) return false;
            
            // User role filter
            if (userFilter && log.RoleName !== userFilter) return false;
            
            // Date range filter
            if (dateFromFilter) {
                const logDate = new Date(log.Timestamp || log.CreatedAt);
                const fromDate = new Date(dateFromFilter);
                if (logDate < fromDate) return false;
            }
            
            if (dateToFilter) {
                const logDate = new Date(log.Timestamp || log.CreatedAt);
                const toDate = new Date(dateToFilter);
                toDate.setHours(23, 59, 59, 999); // End of day
                if (logDate > toDate) return false;
            }
            
            // Search filter
            if (searchFilter) {
                const searchText = `${log.Description || ''} ${log.FullName || ''} ${log.RoleName || ''}`.toLowerCase();
                if (!searchText.includes(searchFilter)) return false;
            }
            
            return true;
        });

        displayActivityLogs(filteredLogs);
    }

    function clearFilters() {
        document.getElementById('actionFilter').value = '';
        document.getElementById('tableFilter').value = '';
        document.getElementById('userFilter').value = '';
        document.getElementById('dateFromFilter').value = '';
        document.getElementById('dateToFilter').value = '';
        document.getElementById('searchFilter').value = '';
        
        filteredLogs = [...allLogs];
        displayActivityLogs(filteredLogs);
    }

    function displayActivityLogs(logs) {
        console.log('Displaying logs:', logs);
        const tableBody = document.querySelector('#activityLogsTable tbody');
        const noLogsMessage = document.getElementById('noLogsMessage');
        const errorMessage = document.getElementById('errorMessage');
        
        // Clear any existing error message
        errorMessage.style.display = 'none';
        tableBody.innerHTML = ''; // Clear existing rows

        if (!Array.isArray(logs)) {
            console.error('Logs is not an array:', logs);
            showError('Invalid data format received from server.');
            return;
        }

        if (logs.length === 0) {
            tableBody.style.display = 'none';
            noLogsMessage.style.display = 'block';
            noLogsMessage.textContent = 'No activity logs found matching your criteria.';
            return;
        }

        tableBody.style.display = 'table-row-group';
        noLogsMessage.style.display = 'none';

        logs.forEach(log => {
            const row = createLogRow(log);
            tableBody.appendChild(row);
        });
    }

    function createLogRow(log) {
        const row = document.createElement('tr');
        
        // Format timestamp in Manila time (UTC+8)
        const timestamp = new Date(log.Timestamp || log.CreatedAt);
        const formattedTime = timestamp.toLocaleString('en-PH', {
            timeZone: 'Asia/Manila',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
        });
        
        // Create action badge
                const actionBadge = createActionBadge(log.Action);
                
        // Create changes display
        const changesDisplay = createChangesDisplay(log.Changes);
                
                row.innerHTML = `
            <td>${log.LogID || 'N/A'}</td>
            <td>
                <strong>${log.FullName || 'Unknown User'}</strong>
                <div class="log-details">ID: ${log.UserID || 'N/A'}</div>
            </td>
            <td>
                <span class="role-badge">${log.RoleName || 'N/A'}</span>
            </td>
                    <td>${actionBadge}</td>
            <td>${log.TableAffected || 'N/A'}</td>
            <td>
                <div class="description">${log.Description || 'No description'}</div>
                ${log.RecordID ? `<div class="log-details">Record ID: ${log.RecordID}</div>` : ''}
            </td>
                    <td>${changesDisplay}</td>
            <td>
                <div class="timestamp">${formattedTime}</div>
                <div class="log-details">${getTimeAgo(timestamp)}</div>
            </td>
        `;
        
        return row;
    }

    function createActionBadge(action) {
        const badgeClass = `action-${action.toLowerCase().replace('_', '-')}`;
        return `<span class="action-badge ${badgeClass}">${action}</span>`;
    }

    function createChangesDisplay(changes) {
        if (!changes) return '<span class="no-changes">No changes</span>';
        
        try {
            const parsedChanges = typeof changes === 'string' ? JSON.parse(changes) : changes;
            
            if (!parsedChanges || Object.keys(parsedChanges).length === 0) {
                return '<span class="no-changes">No changes</span>';
            }
            
            let changesHtml = '<div class="changes-display">';
            for (const [field, change] of Object.entries(parsedChanges)) {
                changesHtml += `
                    <div class="change-item">
                        <strong>${field}:</strong>
                        <span class="old-value">${change.old || 'null'}</span> → 
                        <span class="new-value">${change.new || 'null'}</span>
                    </div>
                `;
            }
            changesHtml += '</div>';
            
            return changesHtml;
        } catch (error) {
            console.error('Error parsing changes:', error);
            return `<div class="changes-display">${changes}</div>`;
        }
    }

    function getTimeAgo(date) {
        const now = new Date();
        const diffInSeconds = Math.floor((now - date) / 1000);
        
        if (diffInSeconds < 60) return 'Just now';
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
        if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)} days ago`;
        
        return date.toLocaleDateString();
    }

    function showError(message) {
        document.getElementById('activityLogsTable').style.display = 'none';
        document.getElementById('errorMessage').style.display = 'block';
        document.getElementById('errorMessage').textContent = message;
    }

    // Debounce function for search input
    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // Make functions globally available
    window.applyFilters = applyFilters;
    window.clearFilters = clearFilters;
    window.loadActivityLogs = fetchActivityLogs;
});