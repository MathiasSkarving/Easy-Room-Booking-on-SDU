import type { Room, Booking, Tokens } from "./job.ts";

chrome.runtime.onMessage.addListener(handleFindRooms);

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
        sendResponse({ status: result.status });
    } else {
        const findRoomPayload = buildPayload({
            'ctl00$ScriptManager1': 'ctl00$BodyContent$ChooseRoomUP|ChooseRoomUP',
            'ctl00$BodyContent$datepickerinput': message.data.booking.date,
            'ctl00$BodyContent$FromTime': message.data.booking.fromTime,
            'ctl00$BodyContent$ToTime': message.data.booking.toTime,
            'ctl00$BodyContent$ParticipantTB': '',
            'booktype': 'search',
            'ctl00$BodyContent$SeatsHF': 20,
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
            sendResponse({ status: response.status });
        } else {
            const rooms = getAllRoomsAvailable(await response.text());
            sendResponse({ status: response.status, rooms: rooms });
        }
    }

    return true;
}

async function handleAddParticipants(message: {
    action: string,
    data: {
        booking: Booking,
        username: string
    }
}): Promise<{ status: number, tokens: Tokens }> {

    let tokens: Tokens = message.data.booking.tokens;

    for (const username of message.data.booking.groupNames) {

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

        const response = await sendPostRequest('https://mitsdu.sdu.dk/booking/Book.aspx', JSON.stringify(participantPayload));

        tokens = await updateTokens(response);

        if (response.status !== 200) {
            return { status: response.status, tokens: tokens };
        }
    }

    return { status: 200, tokens: tokens };
}

function getAllRoomsAvailable(htmlString: string): Room[] {
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlString, 'text/html');
    const availableRooms = doc.querySelectorAll('a.room-available');
    let rooms: Room[] = [];

    for (const roomItem of availableRooms) {
        const allText: string = roomItem.textContent.toLowerCase();
        const roomName: string = (roomItem.querySelector('input.roomname') as HTMLInputElement).value || '';
        const roomId: string = (roomItem.querySelector('input.roomid') as HTMLInputElement).value || '';
        const area: string = (roomItem.querySelector('input.area') as HTMLInputElement).value || '';
        const capacity: number = parseInt((roomItem.querySelector('input.capacity') as HTMLInputElement).value || '0');

        rooms.push({ roomName, capacity, area, roomId });
    }

    return rooms;
}

async function updateTokens(response: Response): Promise<Tokens> {
    const parser = new DOMParser();
    const doc = parser.parseFromString(await response.text(), 'text/html');

    let viewState = doc.getElementById('__VIEWSTATE')?.getAttribute('value') || '';
    let viewStateGenerator = doc.getElementById('__VIEWSTATEGENERATOR')?.getAttribute('value') || '';
    let eventValidation = doc.getElementById('__EVENTVALIDATION')?.getAttribute('value') || '';

    return { viewState, viewStateGenerator, eventValidation };
}

async function sendPostRequest(url: string, payload: string) {
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
        },
        body: payload
    });
    if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
    }

    return response;
}

function buildPayload(data: any) {
    let params: URLSearchParams = new URLSearchParams();
    for (const key in data) {
        params.append(key, data[key]);
    }
    return params;
}