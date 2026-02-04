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
        removeBookings();
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
            findRooms(bookings[activeBookingIndex], username);
        }
    });
})

function removeBookings() {
    bookings.length = numRooms;
}

function findRooms(booking: Booking | undefined, username: string) {
    if (!booking) {
        console.error("No booking");
        return;
    }

    const tokens = getFreshTokens();
    if (!tokens) {
        console.error("Tokens are null");
        return;
    } else {
        booking.tokens = tokens;
    }

    (async () => {
        const response: Room[] = await chrome.runtime.sendMessage({
            action: "findRooms",
            data: {
                booking: booking,
                username: username
            }
        });
        console.log(response);
    })();
}

function getFreshTokens(): Tokens | null {
    let viewState: string = (document.querySelector('input[name="__VIEWSTATE"]') as HTMLInputElement).value;
    let viewStateGenerator: string = (document.querySelector('input[name="__VIEWSTATEGENERATOR"]') as HTMLInputElement).value;
    let eventValidation: string = (document.querySelector('input[name="__EVENTVALIDATION"]') as HTMLInputElement).value;

    if (viewState === null || viewStateGenerator === null || eventValidation === null) {
        console.error("Tokens are null");
        return null;
    }

    return { viewState, viewStateGenerator, eventValidation };
}

function renderBookingCards() {
    const bookingGrid = document.getElementById('bookingGrid') as HTMLDivElement;
    bookingGrid.innerHTML = '';

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
        bookingGrid.appendChild(card);
    }
}

function renderEditModal(index: number) {
    const modal = document.getElementById('editModal') as HTMLDivElement;
    const booking = bookings[index];

    if (!booking) {
        console.error(`Booking at index ${index} not found`);
        return;
    }

    (document.getElementById("date") as HTMLInputElement).value = booking.date;
    (document.getElementById("fromtime") as HTMLInputElement).value = booking.fromTime;
    (document.getElementById("totime") as HTMLInputElement).value = booking.toTime;

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

function createBookings(): void {
    for (let i = 0; i < numRooms; i++) {
        if (bookings[i] === undefined) {
            bookings[i] = {
                date: "",
                fromTime: "",
                toTime: "",
                room: null as unknown as Room,
                area: "TEK",
                groupNames: [],
                tokens: null as unknown as Tokens
            };
        }
    }
}

function buildGroupNames(username: string): string[] {
    if (username.length < 7) {
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
