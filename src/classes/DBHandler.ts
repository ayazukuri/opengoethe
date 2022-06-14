import { Database, Statement } from "sqlite3";
import { readdirSync, readFileSync } from "fs";
import { promisify } from "util";
import { User } from "./User";

export class DBHandler {
    db: Database;
    statements: Map<string, Statement>;

    constructor(db: Database) {
        this.db = db;
        this.statements = new Map();
        for (const file of readdirSync("./src/sql_statements")) {
            if (!file.endsWith(".sql")) continue;
            const statement = db.prepare(readFileSync("./src/sql_statements/" + file).toString("utf-8"));
            const name = file.split(".").slice(0, -1).join(".");
            this.statements.set(name, statement);
        }
    }

    async user(by: "id" | "email" | "username" | "session", res: string): Promise<User | null> {
        let row;
        switch (by) {
            case "id":
                row = await this.fetch("user_by_id", {
                    $id: res
                });
                break;
            case "email":
                row = await this.fetch("user_by_email", {
                    $email: res
                });
                break;
            case "username":
                row = await this.fetch("user_by_username", {
                    $username: res
                });
                break;
            case "session":
                row = await this.fetch("user_by_session", {
                    $token: res
                });
                break;
        }
        if (!row) return null;
        return new User(row);
    }

    fetch(identifier: string, params = {}): Promise<any> {
        const statement = this.statements.get(identifier);
        if (!statement) throw new Error("Unknown statement.");
        return promisify<any, any>(statement.get.bind(statement))(params);
    }

    all(identifier: string, params = {}): Promise<any[]> {
        const statement = this.statements.get(identifier);
        if (!statement) throw new Error("Unknown statement.");
        return promisify<any, any[]>(statement.all.bind(statement))(params);
    }

    run(identifier: string, params = {}): Promise<void> {
        const statement = this.statements.get(identifier);
        if (!statement) throw new Error("Unknown statement.");
        return promisify<any, void>(statement.run.bind(statement))(params);
    }
}
