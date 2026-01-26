import type { Room, Booking } from "./job.ts";

chrome.runtime.onMessage.addListener(handleMessages);

function handleMessages(message: {
    action: string, data: {
        booking: Booking,
        username: string
    }
}, sender: any, sendResponse: any) {

    if (message.action !== 'findRooms') return;

    fetch('https://sdu-booker-v2.sdu.dk/api/rooms', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(message.data)
    })
        .then((response) => sendResponse({ statusCode: response.status }))

    // Since `fetch` is asynchronous, must return an explicit `true`
    return true;
}