export interface UserEntry {
    id: string;
    email: string;
    username: string;
    permission_level: number;
    avatar?: string;
}

export class User {
    id: string;
    email: string;
    username: string;
    permissionLevel: number;
    avatar?: string;

    constructor({
        id,
        email,
        username,
        permission_level: permissionLevel,
        avatar
    }: UserEntry) {
        this.id = id;
        this.email = email;
        this.username = username;
        this.permissionLevel = permissionLevel;
        this.avatar = avatar;
    }
}
