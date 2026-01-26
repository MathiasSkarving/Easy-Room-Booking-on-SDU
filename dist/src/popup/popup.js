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
        removeBookings();
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
function removeBookings() {
    bookings.length = numRooms;
}
function findRooms(booking, username) {
    if (!booking) {
        console.error("No booking");
        return;
    }
    (async () => {
        const response = await chrome.runtime.sendMessage({
            action: "findRooms",
            data: {
                booking: booking,
                username: username
            }
        });
        console.log(response);
    })();
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
    document.getElementById("date").value = booking.date;
    document.getElementById("fromtime").value = booking.fromtime;
    document.getElementById("totime").value = booking.totime;
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
    booking.fromtime = document.getElementById("fromtime").value;
    booking.totime = document.getElementById("totime").value;
    booking.groupnames = buildGroupNames(username);
    activeBookingIndex = null;
    closeEditModal();
}
function createBookings() {
    for (let i = 0; i < numRooms; i++) {
        if (bookings[i] === undefined) {
            bookings[i] = {
                date: "",
                fromtime: "",
                totime: "",
                room: null,
                area: "TEK",
                groupnames: []
            };
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
