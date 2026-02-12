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
            findRooms(username);
        }
    });
});
async function findRooms(username) {
    const booking = await getActiveBookingFromModal();
    if (booking && (booking.date === "" || booking.fromTime === "" || booking.toTime === "")) {
        alert("Please fill in all fields");
        return;
    }
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id) {
        console.error("No active tab found");
        return;
    }
    const response = await chrome.runtime.sendMessage({
        action: "findRooms",
        data: { booking, username }
    });
    const rooms = getAllRoomsAvailable(response.data);
    console.log("Rooms found:", rooms);
}
async function fetchTokensFromPage() {
    try {
        const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tabs.length === 0) {
            return null;
        }
        const activeTab = tabs[0];
        if (!activeTab?.id) {
            throw new Error("No active tab found");
        }
        const response = await chrome.tabs.sendMessage(activeTab.id, { action: "getTokens" });
        console.log("Tokens fetched from page:", response);
        return response?.tokens || null;
    }
    catch (error) {
        console.error("Error fetching tokens:", error);
        return null;
    }
}
function getAllRoomsAvailable(htmlString) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlString, 'text/html');
    const availableRooms = doc.querySelectorAll('a.room-available');
    let rooms = [];
    for (const roomItem of availableRooms) {
        console.log("Processing room item:", roomItem);
        const roomName = roomItem.querySelector('input.roomname').value || '';
        const roomId = roomItem.querySelector('input.roomid').value || '';
        const seats = roomItem.querySelector('div.roominfo');
        let capacity = 0;
        if (seats) {
            capacity = parseInt(seats.querySelector('span').innerText.replace(/\D/g, ""));
        }
        rooms.push({ roomName, capacity, roomId });
    }
    return rooms;
}
function renderBookingCards() {
    const bookingGrid = document.getElementById('bookingGrid');
    bookingGrid.innerHTML = '';
    createBookingCards(bookingGrid);
}
function createBookingCards(grid) {
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
        grid.appendChild(card);
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
async function getActiveBookingFromModal() {
    let booking = {
        date: document.getElementById("date").value,
        fromTime: document.getElementById("fromtime").value,
        toTime: document.getElementById("totime").value,
        groupNames: buildGroupNames(username),
        tokens: await fetchTokensFromPage() || {},
    };
    return booking;
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
    if (username === "") {
        alert("Please enter a username");
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

