import type { Booking, Room, Tokens } from "../background/job.ts";

let bookings: Booking[] = [];
let activeBookingIndex: number | null = null;
let username: string = "";
let numRooms: number = 0;

document.addEventListener('DOMContentLoaded', () => {
    renderBookingCards();
    document.getElementById('numRooms')?.addEventListener('change', (e) => {
        numRooms = (e.target as HTMLInputElement).valueAsNumber;
        createBookings();
        renderBookingCards();
    });

    document.getElementById("SDUusername")?.addEventListener('change', (e) => {
        username = (e.target as HTMLInputElement).value;
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
        } else {
            findRooms(username);
        }
    });
})

async function findRooms(username: string) {
    const booking: Booking | null = await getActiveBookingFromModal();
    if (booking && (booking.date === "" || booking.fromTime === "" || booking.toTime === "")) {
        alert("Please fill in all fields");
        return;
    }

    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (!tab?.id) {
        console.error("No active tab found");
        return;
    }

    const response: { status: number, data: string } = await chrome.runtime.sendMessage({
        action: "findRooms",
        data: { booking, username }
    });

    const rooms: Room[] = getAllRoomsAvailable(response.data);

    console.log("Rooms found:", rooms);
}

async function fetchTokensFromPage(): Promise<Tokens | null> {
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

function getAllRoomsAvailable(htmlString: string): Room[] {
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlString, 'text/html');
    const availableRooms = doc.querySelectorAll('a.room-available');
    let rooms: Room[] = [];

    for (const roomItem of availableRooms) {
        console.log("Processing room item:", roomItem);
        const roomName: string = (roomItem.querySelector('input.roomname') as HTMLInputElement).value || '';
        const roomId: string = (roomItem.querySelector('input.roomid') as HTMLInputElement).value || '';
        const seats = roomItem.querySelector('div.roominfo');
        let capacity: number = 0;
        if (seats) {
            capacity = parseInt((seats.querySelector('span') as HTMLInputElement).innerText.replace(/\D/g, ""));
        }

        rooms.push({ roomName, capacity, roomId });
    }

    return rooms;
}

function renderBookingCards() {
    const bookingGrid = document.getElementById('bookingGrid') as HTMLDivElement;
    bookingGrid.innerHTML = '';
    createBookingCards(bookingGrid);
}

function createBookingCards(grid: HTMLDivElement) {
    for (let i = 0; i < numRooms; i++) {
        const card = document.createElement('div');
        card.className = "booking-card";
        card.id = "bookingCard" + i;
        card.addEventListener('click', () => {
            if (activeBookingIndex === i) {
                closeEditModal();
                activeBookingIndex = null;
            } else {
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


function renderEditModal(index: number) {
    const modal = document.getElementById('editModal') as HTMLDivElement;
    const booking = bookings[index];

    if (!booking) {
        console.error(`Booking at index ${index} not found`);
        return;
    }

    (document.getElementById("date") as HTMLInputElement).value = booking.date || "";
    (document.getElementById("fromtime") as HTMLInputElement).value = booking.fromTime || "";
    (document.getElementById("totime") as HTMLInputElement).value = booking.toTime || "";

    modal.style.display = 'block';

    for (let i = 0; i < numRooms; i++) {
        if (i === index) {
            continue;
        } else {
            (document.getElementById("bookingCard" + i) as HTMLDivElement).style.display = 'none';
        }
    }
}

function closeEditModal() {
    const modal = document.getElementById('editModal') as HTMLDivElement;
    modal.style.display = 'none';

    for (let i = 0; i < numRooms; i++) {
        (document.getElementById("bookingCard" + i) as HTMLDivElement).style.display = 'block';
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
    booking.date = (document.getElementById("date") as HTMLInputElement).value;
    booking.fromTime = (document.getElementById("fromtime") as HTMLInputElement).value;
    booking.toTime = (document.getElementById("totime") as HTMLInputElement).value;
    booking.groupNames = buildGroupNames(username);

    activeBookingIndex = null;

    closeEditModal();
}

async function getActiveBookingFromModal(): Promise<Booking | null> {
    let booking: Booking = {
        date: (document.getElementById("date") as HTMLInputElement).value,
        fromTime: (document.getElementById("fromtime") as HTMLInputElement).value,
        toTime: (document.getElementById("totime") as HTMLInputElement).value,
        groupNames: buildGroupNames(username),
        tokens: await fetchTokensFromPage() || {},
    };
    return booking;
}

function createBookings(): void {
    bookings.length = numRooms;

    for (let i = 0; i < numRooms; i++) {
        if (bookings[i] === undefined) {
            bookings[i] = {};
        }
    }
}

function buildGroupNames(username: string): string[] {
    if (username === "") {
        alert("Please enter a username");
        return [];
    }

    const groupNames: string[] = [];
    groupNames.push(username.toUpperCase());
    groupNames.push(username.charAt(0).toUpperCase() + username.slice(1).toLowerCase());
    groupNames.push(username.charAt(0).toLowerCase() + username.charAt(1).toUpperCase() + username.slice(2).toLowerCase());
    groupNames.push(username.charAt(0).toLowerCase() + username.charAt(1).toLowerCase() + username.charAt(2).toUpperCase() + username.slice(3).toLowerCase());

    return groupNames;
}

function storeRooms(rooms: Room[]) {
    localStorage.setItem("selectedRooms", JSON.stringify(rooms));
}

function getStoredRooms(): Room[] {
    return JSON.parse(localStorage.getItem("selectedRooms") ?? "[]");
}
