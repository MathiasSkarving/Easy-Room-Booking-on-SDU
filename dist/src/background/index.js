chrome.runtime.onMessage.addListener(handleMessages);
function handleMessages(message, sender, sendResponse) {
    if (message !== 'findRooms')
        return;
    fetch('https://example.com')
        .then((response) => sendResponse({ statusCode: response.status }));
    // Since `fetch` is asynchronous, must return an explicit `true`
    return true;
}
export {};
