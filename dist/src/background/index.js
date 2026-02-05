chrome.runtime.onMessage.addListener(handleFindRooms);
async function handleFindRooms(message, sender, sendResponse) {
    if (message.action !== 'findRooms')
        return;
    const result = await handleAddParticipants(message);
    if (result.status !== 200) {
        sendResponse({ status: result.status });
    }
    else {
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
            sendResponse({ status: response.status, data: "" });
        }
        else {
            sendResponse({ status: response.status, data: await response.text() });
        }
    }
    return true;
}
async function handleAddParticipants(message) {
    let tokens = message.data.booking.tokens || {};
    for (const username of message.data.booking.groupNames || []) {
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
async function updateTokens(response) {
    const text = await response.text();
    const parts = text.split('|');
    const getPipeValue = (id) => {
        const index = parts.indexOf(id);
        if (parts[index + 1]) {
            return parts[index + 1] || "";
        }
        return "";
    };
    const tokens = {
        viewState: getPipeValue('__VIEWSTATE'),
        viewStateGenerator: getPipeValue('__VIEWSTATEGENERATOR'),
        eventValidation: getPipeValue('__EVENTVALIDATION')
    };
    return tokens;
}
async function sendPostRequest(url, payload) {
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
    return response;
}
function buildPayload(data) {
    let params = new URLSearchParams();
    for (const key in data) {
        params.append(key, data[key]);
    }
    return params;
}
export {};
