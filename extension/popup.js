document.addEventListener('DOMContentLoaded', function() {
    const toggleSwitch = document.getElementById('extensionToggle');
    const statusText = document.getElementById('statusText');
    const headerNameInput = document.getElementById('headerName');
    const headerValueInput = document.getElementById('headerValue');
    const headerSecretCheckbox = document.getElementById('headerSecret'); // New Secret Checkbox
    const addHeaderButton = document.getElementById('addHeader');
    const headersList = document.getElementById('headers-list');

    // Load saved state
    chrome.storage.local.get(['enabled', 'headers'], function(data) {
        toggleSwitch.checked = data.enabled || false;
        statusText.textContent = data.enabled ? 'Enabled' : 'Disabled';
        const headers = data.headers || [];
        renderHeadersList(headers);
    });

    // Toggle extension on/off
    toggleSwitch.addEventListener('change', function() {
        const enabled = toggleSwitch.checked;
        statusText.textContent = enabled ? 'Enabled' : 'Disabled';
        chrome.storage.local.set({ enabled });
        chrome.runtime.sendMessage({ action: 'toggleExtension', enabled });
    });

    // Add new header
    addHeaderButton.addEventListener('click', function() {
        const name = headerNameInput.value.trim();
        const value = headerValueInput.value.trim();
        const isSecret = headerSecretCheckbox.checked;

        if (name && value) {
            chrome.storage.local.get(['headers'], function(data) {
                const headers = data.headers || [];
                headers.push({ name, value, secret: isSecret });

                // Save updated headers
                chrome.storage.local.set({ headers });

                // Update UI
                renderHeadersList(headers);

                // Notify background script
                chrome.runtime.sendMessage({ action: 'updateHeaders', headers });

                // Clear inputs
                headerNameInput.value = '';
                headerValueInput.value = '';
                headerSecretCheckbox.checked = false; // Reset checkbox
            });
        }
    });

    // Render headers list
    function renderHeadersList(headers) {
        headersList.innerHTML = '';

        if (headers.length === 0) {
            headersList.innerHTML = '<p class="no-headers">No headers added yet</p>';
            return;
        }

        headers.forEach((header, index) => {
            const headerItem = document.createElement('div');
            headerItem.className = 'header-item';

            const displayedValue = header.secret ? '*****' : header.value;

            headerItem.innerHTML = `
                <div class="header-info">
                    <strong>${header.name}</strong>: ${displayedValue} 
                    ${header.secret ? '(Secret)' : ''}
                </div>
                <button class="delete-btn" data-index="${index}">Delete</button>
            `;

            headersList.appendChild(headerItem);
        });

        // Add delete event listeners
        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const index = parseInt(this.getAttribute('data-index'));

                chrome.storage.local.get(['headers'], function(data) {
                    const headers = data.headers || [];
                    headers.splice(index, 1); // Remove the selected header
                    chrome.storage.local.set({ headers }); // Save updated headers
                    renderHeadersList(headers); // Refresh UI
                    chrome.runtime.sendMessage({ action: 'updateHeaders', headers });
                });
            });
        });
    }
});
