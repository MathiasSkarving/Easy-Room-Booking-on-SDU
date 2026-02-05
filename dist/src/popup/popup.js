let bookings = [];
let activeBookingIndex = null;
let username = "";
let numRooms = 0;
document.addEventListener('DOMContentLoaded', () => {
    renderBookingCards();
    document.getElementById('numRooms')?.addEventListener('change', (e) => {
        numRooms = e.target.valueAsNumber;
        createBookings();
        renderBookingCards();
    });
    document.getElementById("SDUusername")?.addEventListener('change', (e) => {
        username = e.target.value;
    });
    document.getElementById("closeEditModal")?.addEventListener('click', () => {
        closeEditModal();
    });
    document.getElementById("saveButton")?.addEventListener('click', () => {
        saveActiveBooking();
    });
    document.getElementById("findRoomButton")?.addEventListener('click', () => {
        if (activeBookingIndex === null) {
            console.error("No active booking index");
            return;
        }
        else {
            findRooms(bookings[activeBookingIndex], username);
        }
    });
});
async function findRooms(booking, username) {
    if (!booking)
        return;
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id) {
        console.error("No active tab found");
        return;
    }
    const results = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: getFreshTokens
    });
    const tokens = results[0]?.result;
    if (!tokens) {
        alert("Could not find ASP.NET tokens. Are you on the right booking page?");
        return;
    }
    booking.tokens = tokens;
    const response = await chrome.runtime.sendMessage({
        action: "findRooms",
        data: { booking, username }
    });
    const rooms = getAllRoomsAvailable(response.data);
    console.log("Rooms found:", rooms);
}
function getFreshTokens() {
    const vs = document.querySelector('input[name="__VIEWSTATE"]');
    const vsg = document.querySelector('input[name="__VIEWSTATEGENERATOR"]');
    const ev = document.querySelector('input[name="__EVENTVALIDATION"]');
    if (!vs || !vsg || !ev) {
        console.error("ASP.NET Tokens not found in the current DOM.");
        return null;
    }
    return {
        viewState: vs.value,
        viewStateGenerator: vsg.value,
        eventValidation: ev.value
    };
}
function getAllRoomsAvailable(htmlString) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlString, 'text/html');
    const availableRooms = doc.querySelectorAll('a.room-available');
    let rooms = [];
    for (const roomItem of availableRooms) {
        const roomName = roomItem.querySelector('input.roomname').value || '';
        const roomId = roomItem.querySelector('input.roomid').value || '';
        const area = roomItem.querySelector('input.area').value || '';
        const capacity = parseInt(roomItem.querySelector('input.capacity').value || '0');
        rooms.push({ roomName, capacity, area, roomId });
    }
    return rooms;
}
function renderBookingCards() {
    const bookingGrid = document.getElementById('bookingGrid');
    bookingGrid.innerHTML = '';
    for (let i = 0; i < numRooms; i++) {
        const card = document.createElement('div');
        card.className = "booking-card";
        card.id = "bookingCard" + i;
        card.addEventListener('click', () => {
            if (activeBookingIndex === i) {
                closeEditModal();
                activeBookingIndex = null;
            }
            else {
                activeBookingIndex = i;
                renderEditModal(i);
            }
        });
        card.dataset.index = i.toString();
        card.innerHTML = `
            <h2>Booking ${i + 1}</h2>
            <small>Click to edit</small>`;
        bookingGrid.appendChild(card);
    }
}
function renderEditModal(index) {
    const modal = document.getElementById('editModal');
    const booking = bookings[index];
    if (!booking) {
        console.error(`Booking at index ${index} not found`);
        return;
    }
    document.getElementById("date").value = booking.date || "";
    document.getElementById("fromtime").value = booking.fromTime || "";
    document.getElementById("totime").value = booking.toTime || "";
    modal.style.display = 'block';
    for (let i = 0; i < numRooms; i++) {
        if (i === index) {
            continue;
        }
        else {
            document.getElementById("bookingCard" + i).style.display = 'none';
        }
    }
}
function closeEditModal() {
    const modal = document.getElementById('editModal');
    modal.style.display = 'none';
    for (let i = 0; i < numRooms; i++) {
        document.getElementById("bookingCard" + i).style.display = 'block';
    }
    activeBookingIndex = null;
}
function saveActiveBooking() {
    if (activeBookingIndex === null) {
        console.error("No active booking index");
        return;
    }
    const booking = bookings[activeBookingIndex];
    if (!booking) {
        console.error(`Booking at index ${activeBookingIndex} not found`);
        return;
    }
    booking.date = document.getElementById("date").value;
    booking.fromTime = document.getElementById("fromtime").value;
    booking.toTime = document.getElementById("totime").value;
    booking.groupNames = buildGroupNames(username);
    activeBookingIndex = null;
    closeEditModal();
}
function createBookings() {
    bookings.length = numRooms;
    for (let i = 0; i < numRooms; i++) {
        if (bookings[i] === undefined) {
            bookings[i] = {};
        }
    }
}
function buildGroupNames(username) {
    if (username.length < 7) {
        return [];
    }
    const groupNames = [];
    groupNames.push(username.toUpperCase());
    groupNames.push(username.charAt(0).toUpperCase() + username.slice(1).toLowerCase());
    groupNames.push(username.charAt(0).toLowerCase() + username.charAt(1).toUpperCase() + username.slice(2).toLowerCase());
    groupNames.push(username.charAt(0).toLowerCase() + username.charAt(1).toLowerCase() + username.charAt(2).toUpperCase() + username.slice(3).toLowerCase());
    return groupNames;
}
function storeRooms(rooms) {
    localStorage.setItem("selectedRooms", JSON.stringify(rooms));
}
function getStoredRooms() {
    return JSON.parse(localStorage.getItem("selectedRooms") ?? "[]");
}
export {};
