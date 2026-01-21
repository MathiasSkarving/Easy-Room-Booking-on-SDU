document.addEventListener('DOMContentLoaded', () => {
    const bookingGrid = document.getElementById('bookingGrid');
    const numRooms = document.getElementById('numRooms');
    const editModal = document.getElementById('editModal');
    document.getElementById('numRooms')?.addEventListener('change', () => {
        bookingGrid.innerHTML = '';
        editModal.innerHTML = '';
        for (let i = 0; i < numRooms.valueAsNumber; i++) {
            const bookingCard = document.createElement('div');
            bookingCard.classList.add('booking-card');
            bookingCard.innerHTML = `
                <h2>Booking ${i + 1}</h2>
                <small>Click to edit</small>`;
            bookingGrid.appendChild(bookingCard);
            bookingCard.addEventListener('click', () => {
                if (!bookingGrid.classList.contains('hidden')) {
                    bookingGrid.classList.add('hidden');
                }
                editModal.innerHTML = `
                <fieldset>
                    <h2 class="section-title">
                    <svg viewBox="0 0 24 24">
                        <path
                            d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20a2 2 0 002 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V9h14v11zM9 11H7v2h2v-2zm4 0h-2v2h2v-2zm4 0h-2v2h2v-2z" />
                    </svg>
                    Booking ${i + 1}
                    </h2>
                    <input type="text" id="date${i}" placeholder="Date (DD-MM-YYYY)" value="05-12-2025" required>
                    <input type="text" id="area${i}" placeholder="Area Code (e.g., TEK)" value="TEK">
                    <button type="button" id="roomButton${i}">Select Room</button>
                    <input type="time" id="from_time${i}" value="08:00" required>
                    <input type="time" id="to_time${i}" value="12:00" required>
                    <button type="button" id="backButton${i}">Back</button>
                </fieldset>`;
                const backButton = document.getElementById(`backButton${i}`);
                backButton.addEventListener('click', () => {
                    bookingGrid.classList.remove('hidden');
                    editModal.classList.add('hidden');
                });
            });
        }
    });
});
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
