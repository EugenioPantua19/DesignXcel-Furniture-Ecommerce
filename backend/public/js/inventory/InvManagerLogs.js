document.addEventListener('DOMContentLoaded', function() {
    fetchActivityLogs();

    async function fetchActivityLogs() {
        try {
            const response = await fetch('/Employee/Inventory/InvManagerLogs/Data');
            const data = await response.json();

            if (data.success) {
                displayActivityLogs(data.logs);
            } else {
                document.getElementById('activityLogsTable').style.display = 'none';
                document.getElementById('errorMessage').style.display = 'block';
                document.getElementById('errorMessage').textContent = 
                    `Failed to load activity logs: ${data.message || 'Unknown error'}. ${data.error ? `Details: ${data.error}` : ''}`;
            }
        } catch (error) {
            document.getElementById('activityLogsTable').style.display = 'none';
            document.getElementById('errorMessage').style.display = 'block';
            document.getElementById('errorMessage').textContent = 
                `Error loading activity logs: ${error.message}. Please check the console for more details.`;
        }
    }

    function displayActivityLogs(logs) {
        const tableBody = document.querySelector('#activityLogsTable tbody');
        const noLogsMessage = document.getElementById('noLogsMessage');
        const errorMessage = document.getElementById('errorMessage');
        errorMessage.style.display = 'none';
        tableBody.innerHTML = '';

        if (!Array.isArray(logs)) {
            errorMessage.style.display = 'block';
            errorMessage.textContent = 'Invalid data format received from server.';
            return;
        }

        if (logs.length === 0) {
            noLogsMessage.style.display = 'block';
            return;
        }

        noLogsMessage.style.display = 'none';
        const logsByDate = logs.reduce((acc, log) => {
            const date = new Date(log.Timestamp).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
            if (!acc[date]) {
                acc[date] = [];
            }
            acc[date].push(log);
            return acc;
        }, {});
        const sortedDates = Object.keys(logsByDate).sort((a, b) => new Date(b) - new Date(a));
        sortedDates.forEach(date => {
            const dateHeaderRow = tableBody.insertRow();
            dateHeaderRow.className = 'date-header';
            const dateHeaderCell = dateHeaderRow.insertCell();
            dateHeaderCell.colSpan = 5;
            dateHeaderCell.textContent = date;
            logsByDate[date].forEach((log, index) => {
            try {
                const row = tableBody.insertRow();
                const logDateISO = new Date(log.Timestamp).toISOString().slice(0, 10);
                row.setAttribute('data-date', logDateISO);
                const dbTimestamp = new Date(log.Timestamp);
                // Display the time exactly as it appears in the database
                const timeString = dbTimestamp.toLocaleTimeString('en-US', { 
                    hour12: false 
                });
                const timestamp = formatTimeWithAMPM(timeString);
                const actionDescription = formatActionDescription(log.Action, log.TableAffected, log.Description);
                row.innerHTML = `
                    <td>${log.LogID}</td>
                    <td>${log.FullName || 'Unknown User'}</td>
                    <td>${log.RoleName || 'Unknown Role'}</td>
                    <td>${actionDescription}</td>
                    <td>${timestamp}</td>
                `;
            } catch (err) {
            }});
        });
    }

    function formatActionDescription(action, tableAffected, description) {
        try {
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
            return `${action} ${tableAffected}: ${description}`;
        }
    }

    function formatTimeWithAMPM(timeString) {
        const timeParts = timeString.split(':');
        const hours = parseInt(timeParts[0], 10);
        const minutes = timeParts[1];
        const seconds = timeParts[2];
        const ampm = hours >= 12 ? 'PM' : 'AM';
        const formattedHours = hours % 12 === 0 ? 12 : hours % 12;
        return `${formattedHours}:${minutes}:${seconds} ${ampm}`;
    }
});



