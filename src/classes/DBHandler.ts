import { Pool, PoolConnection, QueryOptions } from "mariadb";
import { User } from "./User";

type InteractionResult<Explicit extends "void" | "unique" | "multi"> = Explicit extends "unique"
    ? any
    : Explicit extends "multi"
        ? any[]
        : void;

export class DBHandler {
    private pool: Pool;

    constructor(pool: Pool) {
        this.pool = pool;
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

    async interaction<Explicit extends "void" | "unique" | "multi">(...cbs: ((con: PoolConnection) => any)[]): Promise<InteractionResult<Explicit>> {
        const con: PoolConnection = await this.pool.getConnection();
        const pr = [];
        for (const cb of cbs) {
            pr.push(cb.call(null, con));
        }
        const res = await Promise.all(pr);
        con.release();
        if (pr.length === 0) return <any>undefined;
        else if (pr.length === 1) return res[0];
        return <any>res;
    }

    fetch(sql: string | QueryOptions, ...params: any[]): Promise<any> {
        return this.pool.query(sql, params).then((v) => v[0]);
    }

    all(sql: string | QueryOptions, ...params: any[]): Promise<any[]> {
        return this.pool.query(sql, params);
    }

    run(sql: string, ...params: any[]): Promise<void> {
        return this.pool.query(sql, params).then(() => undefined);
    }
}
