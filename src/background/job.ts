export interface BookJob {
    date: string;
    room: Room;
    fromtime: Date;
    totime: Date;
    groupnames: string[];
}

export interface Room {
    roomname: string;
    areacode: string;
    capacity: number;
}

export interface FindRoomJob {
    date: string;
    fromtime: Date;
    totime: Date;
    groupnames: string[];
}

