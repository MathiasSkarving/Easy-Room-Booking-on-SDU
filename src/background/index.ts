import type { Room, Booking, Tokens } from "./job.ts";

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'findRooms') {
        handleFindRooms(message, sender, sendResponse);
        return true;
    }
});

async function handleFindRooms(message: {
    action: string,
    data: {
        booking: Booking,
        username: string
    }
}, sender: any, sendResponse: any) {

    if (message.action !== 'findRooms') return;

    const result = await handleAddParticipants(message);

    if (result.status !== 200) {
        console.log("Failed to add participants");
        sendResponse({ status: result.status });
    } else {
        console.log("Participants added successfully");
        console.log("finding rooms with booking data:", message.data.booking);

        const findRoomPayload = buildPayload({
            'ctl00$ScriptManager1': 'ctl00$BodyContent$ChooseRoomUP|ChooseRoomUP',
            'ctl00$BodyContent$datepickerinput': message.data.booking.date,
            'ctl00$BodyContent$FromTime': message.data.booking.fromTime,
            'ctl00$BodyContent$ToTime': message.data.booking.toTime,
            'ctl00$BodyContent$ParticipantTB': '',
            'booktype': 'search',
            'ctl00$BodyContent$SeatsHF': 2,
            'ctl00$BodyContent$BuildingDDL': message.data.booking.area,
            'ctl00$BodyContent$CommentTB': '',
            'ctl00$BodyContent$RoomHF': '',
            'ctl00$BodyContent$MethodHF': 'chooseroom',
            '__EVENTTARGET': 'ChooseRoomUP',
            '__EVENTARGUMENT': 'ChooseRoom',
            '__VIEWSTATE': result.tokens.viewState,
            '__VIEWSTATEGENERATOR': result.tokens.viewStateGenerator,
            '__EVENTVALIDATION': result.tokens.eventValidation,
            '__ASYNCPOST': 'true'
        });

        const response = await sendPostRequest('https://mitsdu.sdu.dk/booking/Book.aspx', JSON.stringify(findRoomPayload));

        if (response.status !== 200) {
            console.log("Failed to find rooms");
            sendResponse({ status: response.status, data: "" });
        } else {
            console.log("Rooms found successfully");
            sendResponse({ status: response.status, data: response.text });
        }
    }
}

async function handleAddParticipants(message: {
    action: string,
    data: {
        booking: Booking,
        username: string
    }
}): Promise<{ status: number, tokens: Tokens }> {

    let tokens: Tokens = message.data.booking.tokens || {};

    for (const username of message.data.booking.groupNames || []) {
        console.log("Adding participant:", username);

        const participantPayload = buildPayload({
            'ctl00$ScriptManager1': 'ctl00$BodyContent$ParticipantsUP|ctl00$BodyContent$AddParticipantButton',
            'ctl00$BodyContent$datepickerinput': message.data.booking.date,
            'ctl00$BodyContent$FromTime': message.data.booking.fromTime,
            'ctl00$BodyContent$ToTime': message.data.booking.toTime,
            'ctl00$BodyContent$ParticipantTB': username,
            'booktype': 'name',
            'ctl00$BodyContent$MethodHF': '',
            '__EVENTTARGET': 'ctl00$BodyContent$AddParticipantButton',
            '__EVENTARGUMENT': '',
            '__VIEWSTATE': tokens.viewState,
            '__VIEWSTATEGENERATOR': tokens.viewStateGenerator,
            '__EVENTVALIDATION': tokens.eventValidation,
            '__ASYNCPOST': 'true'
        });

        const response = await sendPostRequest('https://mitsdu.sdu.dk/booking/Book.aspx', participantPayload.toString());

        tokens = await updateTokens(response.text)
        console.log(typeof tokens);

        console.log("Tokens after adding participant:", tokens);

        if (response.status !== 200) {
            return { status: response.status, tokens: tokens };
        }
    }

    return { status: 200, tokens: tokens };
}

function extractFromHtml(string: string, key: string): string | null {
    const parts = string.split('|');

    let value = '';

    for (let i = 0; i < parts.length; i++) {
        if (parts[i] === key) {
            value = parts[i + 1]!;
            break;
        }
    }

    return value || null;
}

async function updateTokens(response: string): Promise<Tokens> {
    let tokens: Tokens = {};

    console.log("updating tokesns with response:", response);

    let viewState = extractFromHtml(response, '__VIEWSTATE');
    if (typeof viewState === 'string') {
        tokens.viewState = viewState;
    } else {
        console.log("VIEWSTATE not found in response");
    }
    let viewStateGenerator = extractFromHtml(response, '__VIEWSTATEGENERATOR');
    if (typeof viewStateGenerator === 'string') {
        tokens.viewStateGenerator = viewStateGenerator;
    } else {
        console.log("VIEWSTATEGENERATOR not found in response");
    }
    let eventValidation = extractFromHtml(response, '__EVENTVALIDATION');
    if (typeof eventValidation === 'string') {
        tokens.eventValidation = eventValidation;
    } else {
        console.log("EVENTVALIDATION not found in response");
    }

    tokens = {
        viewState: tokens.viewState || '',
        viewStateGenerator: tokens.viewStateGenerator || '',
        eventValidation: tokens.eventValidation || ''
    };
    return tokens;
}


async function sendPostRequest(url: string, payload: string): Promise<{ status: number, text: string }> {
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
        },
        credentials: 'include',
        body: payload
    });
    if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
    }
    const responseText = await response.text();

    return { status: response.status, text: responseText };
}

function buildPayload(data: any) {
    let params: URLSearchParams = new URLSearchParams();
    for (const key in data) {
        params.append(key, data[key]);
    }
    return params;
}