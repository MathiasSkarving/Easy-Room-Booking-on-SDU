export interface Booking {
    date: string;
    room: Room;
    area: string;
    fromtime: string;
    totime: string;
    groupnames: string[];
}

export interface Room {
    roomname: string;
    capacity: number;
    area: string;
}
