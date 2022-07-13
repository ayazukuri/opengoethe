export interface UserEntry {
    id: string;
    email: string;
    username: string;
    permission_level: 0 | 1 | 2 | 3 | 4 | 5;
    summary: string;
    realname: string;
}

export class User {
    id: string;
    email: string;
    username: string;
    permissionLevel: 0 | 1 | 2 | 3 | 4 | 5;
    summary: string;

    constructor({
        id,
        email,
        username,
        permission_level: permissionLevel,
        summary
    }: UserEntry) {
        this.id = id;
        this.email = email;
        this.username = username;
        this.permissionLevel = permissionLevel;
        this.summary = summary;
    }
}
