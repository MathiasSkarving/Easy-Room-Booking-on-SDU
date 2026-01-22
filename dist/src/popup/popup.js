document.addEventListener('DOMContentLoaded', () => {
    renderBookingCards();
    document.getElementById('numRooms')?.addEventListener('change', () => {
        renderBookingCards();
    });
});
function renderBookingCards() {
    const bookingGrid = document.getElementById('bookingGrid');
    const numRooms = document.getElementById('numRooms');
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
function storeRoom(room) {
    let currentRooms = localStorage.length;
    localStorage.setItem("selectedRoom" + currentRooms, JSON.stringify(room));
}
function getStoredRooms() {
    const foundRooms = [];
    if (localStorage.length === 0) {
        return null;
    }
    for (let i = 0; i < localStorage.length; i++) {
        foundRooms[i] = JSON.parse(localStorage.getItem("selectedRoom" + i));
    }
    return foundRooms;
}
export {};
