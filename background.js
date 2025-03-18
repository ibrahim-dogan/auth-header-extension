// Initialize rules on installation
chrome.runtime.onInstalled.addListener(() => {
    updateRules(); // Directly call updateRules
});

// Listen for messages from popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'toggleExtension' || message.action === 'updateHeaders') {
        updateRules();
    }
});

// Update rules based on current headers and enabled state
async function updateRules() {
    try {
        const data = await chrome.storage.local.get(['enabled', 'headers']);
        const enabled = data.enabled || false;
        const headers = data.headers || [];

        // Clear existing dynamic rules
        const existingRules = await chrome.declarativeNetRequest.getDynamicRules();
        if (existingRules.length > 0) {
            await chrome.declarativeNetRequest.updateDynamicRules({
                removeRuleIds: existingRules.map(rule => rule.id)
            });
        }

        // If the extension is enabled and headers exist, create new rules
        if (enabled && headers.length > 0) {
            const rules = headers.map((header, index) => ({
                id: index + 1,
                priority: 1,
                action: {
                    type: 'modifyHeaders',
                    requestHeaders: [
                        {
                            header: header.name,
                            operation: 'set',
                            value: header.value
                        }
                    ]
                },
                condition: {
                    urlFilter: '*', // Apply to all URLs
                    resourceTypes: [
                        'main_frame', 'sub_frame', 'stylesheet', 'script',
                        'image', 'font', 'object', 'xmlhttprequest', 'ping',
                        'csp_report', 'media', 'websocket', 'other'
                    ]
                }
            }));

            // Add the new rules
            await chrome.declarativeNetRequest.updateDynamicRules({
                addRules: rules
            });
        }
    } catch (error) {
        console.error('Error updating rules:', error);
    }
}
