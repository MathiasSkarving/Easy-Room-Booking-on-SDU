export interface Booking {
    date: string;
    room: Room;
    area: string;
    fromTime: string;
    toTime: string;
    groupNames: string[];
    tokens: Tokens;
}

export interface Room {
    roomName: string;
    capacity: number;
    area: string;
    roomId: string;
}

export interface Tokens {
    viewState: string;
    viewStateGenerator: string;
    eventValidation: string;
}
