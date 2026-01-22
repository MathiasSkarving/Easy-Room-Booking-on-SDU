import type { FindRoomJob, Booking, Room } from "../background/job.ts";

let bookings: Booking[] = [];
let activeBookingIndex: number | null = null;


document.addEventListener('DOMContentLoaded', () => {
    renderBookingCards();
    document.getElementById('numRooms')?.addEventListener('change', (e) => {
        const value = (e.target as HTMLInputElement).valueAsNumber;
        createBookings(value);
        renderBookingCards();
    });
})

function renderBookingCards() {
    const bookingGrid = document.getElementById('bookingGrid') as HTMLDivElement;
    const numRooms = document.getElementById('numRooms') as HTMLInputElement;
    bookingGrid.innerHTML = '';

    for (let i = 0; i < numRooms.valueAsNumber; i++) {
        const card = document.createElement('div');
        card.className = "booking-card";
        card.dataset.index = i.toString();
        card.innerHTML = `
            <h2>Booking ${i + 1}</h2>
            <small>Click to edit</small>`;
        bookingGrid.appendChild(card);
    }
}

function createBookings(count: number): void {
    const username = document.getElementById("SDUusername") as HTMLInputElement;
    const groupnames: string[] = [];
    groupnames.push(username.value.toUpperCase());
    groupnames.push(username.value.charAt(0).toUpperCase() + username.value.slice(1).toLowerCase());
    groupnames.push(username.value.charAt(0).toLowerCase() + username.value.charAt(1).toUpperCase() + username.value.slice(2).toLowerCase());
    groupnames.push(username.value.charAt(0).toLowerCase() + username.value.charAt(1).toLowerCase() + username.value.charAt(2).toUpperCase() + username.value.slice(3).toLowerCase());

    for (let i = 0; i < count; i++) {
        bookings.push({
            date: "",
            fromtime: "",
            totime: "",
            room: null as unknown as Room,
            area: "TEK",
            groupnames: groupnames
        });
    }
}

function updateBookings(): void {
    for (let i = 0; i < bookings.length; i++) {
        bookings
    }
}

function storeRoom(room: Room): void {
    let currentRooms = localStorage.length;
    localStorage.setItem("selectedRoom" + currentRooms, JSON.stringify(room));
}

function getStoredRooms(): Room[] | null {
    const foundRooms: Room[] = [];
    if (localStorage.length === 0) {
        return null;
    }
    for (let i = 0; i < localStorage.length; i++) {
        foundRooms[i] = JSON.parse(localStorage.getItem("selectedRoom" + i) as string) as Room;
    }
    return foundRooms;
}

