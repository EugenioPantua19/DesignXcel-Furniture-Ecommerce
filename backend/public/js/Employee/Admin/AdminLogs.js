// public/js/Employee/Admin/AdminLogs.js

document.addEventListener('DOMContentLoaded', function() {
    console.log('AdminLogs.js loaded, fetching activity logs...');
    fetchActivityLogs();

    async function fetchActivityLogs() {
        try {
            console.log('Making request to /Employee/Admin/Logs/Data...');
            const response = await fetch('/Employee/Admin/Logs/Data');
            console.log('Response received:', response.status, response.statusText);
            
            const data = await response.json();
            console.log('Parsed response data:', data);

            if (data.success) {
                console.log('Successfully fetched logs:', data.logs);
                displayActivityLogs(data.logs);
            } else {
                console.error('Error in response data:', data.message, data.error);
                // Display error message to user
                document.getElementById('activityLogsTable').style.display = 'none';
                document.getElementById('errorMessage').style.display = 'block';
                document.getElementById('errorMessage').textContent = 
                    `Failed to load activity logs: ${data.message || 'Unknown error'}. ${data.error ? `Details: ${data.error}` : ''}`;
            }
        } catch (error) {
            console.error('Error fetching activity logs:', error);
            // Display detailed error message to user
            document.getElementById('activityLogsTable').style.display = 'none';
            document.getElementById('errorMessage').style.display = 'block';
            document.getElementById('errorMessage').textContent = 
                `Error loading activity logs: ${error.message}. Please check the console for more details.`;
        }
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
            errorMessage.style.display = 'block';
            errorMessage.textContent = 'Invalid data format received from server.';
            return;
        }

        if (logs.length === 0) {
            console.log('No logs found to display');
            noLogsMessage.style.display = 'block';
            return;
        }

        console.log('Rendering', logs.length, 'log entries');
        noLogsMessage.style.display = 'none';

        // Group logs by date
        const logsByDate = logs.reduce((acc, log) => {
            const date = new Date(log.Timestamp).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
            if (!acc[date]) {
                acc[date] = [];
            }
            acc[date].push(log);
            return acc;
        }, {});

        // Sort dates in descending order (most recent first)
        const sortedDates = Object.keys(logsByDate).sort((a, b) => new Date(b) - new Date(a));

        sortedDates.forEach(date => {
            // Add a row for the date header
            const dateHeaderRow = tableBody.insertRow();
            dateHeaderRow.className = 'date-header';
            const dateHeaderCell = dateHeaderRow.insertCell();
            dateHeaderCell.colSpan = 5; // Span across all 5 columns
            dateHeaderCell.textContent = date;

            // Add logs for this date
            logsByDate[date].forEach((log, index) => {
            try {
                const row = tableBody.insertRow();
                // Add data-date attribute in YYYY-MM-DD format
                const logDateISO = new Date(log.Timestamp).toISOString().slice(0, 10);
                row.setAttribute('data-date', logDateISO);
                // Format the timestamp to show exact time from database with AM/PM
                const dbTimestamp = new Date(log.Timestamp);
                // Display the time exactly as it appears in the database
                const timeString = dbTimestamp.toLocaleTimeString('en-US', { 
                    hour12: false 
                });
                const timestamp = formatTimeWithAMPM(timeString);
                // Create a more readable action description
                const actionDescription = formatActionDescription(log.Action, log.TableAffected, log.Description);
                row.innerHTML = `
                    <td>${log.LogID}</td>
                    <td>${log.FullName || 'Unknown User'}</td>
                    <td>${log.RoleName || 'Unknown Role'}</td>
                    <td>${actionDescription}</td>
                    <td>${timestamp}</td>
                `;
            } catch (err) {
                    console.error(`Error rendering log entry for date ${date}, index ${index}:`, err, log);
            }
            });
        });
    }

    function formatActionDescription(action, tableAffected, description) {
        try {
            // Format the action description to be more user-friendly
            const actionMap = {
                'INSERT': 'Added',
                'UPDATE': 'Updated',
                'DELETE': 'Deleted'
            };

            const tableMap = {
                'Products': 'Product',
                'RawMaterials': 'Raw Material',
                'Users': 'User',
                'Customers': 'Customer'
            };

            const formattedAction = actionMap[action] || action;
            const formattedTable = tableMap[tableAffected] || tableAffected;

            return `${formattedAction} ${formattedTable}: ${description}`;
        } catch (err) {
            console.error('Error formatting action description:', err, { action, tableAffected, description });
            return `${action} ${tableAffected}: ${description}`;
        }
    }

    function formatTimeWithAMPM(timeString) {
        const [hours, minutes, seconds] = timeString.split(':');
        const formattedTime = `${hours % 12 || 12}:${minutes}:${seconds} ${hours >= 12 ? 'PM' : 'AM'}`;
        return formattedTime;
    }
}); 