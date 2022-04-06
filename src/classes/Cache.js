const { promisify } = require("util");
const { readdirSync, readFileSync } = require("fs");
const { join } = require("path");
const sqlite3 = require("sqlite3"); // eslint-disable-line no-unused-vars
const User = require("./User");

/**
 * Database interaction handler with integrated cache.
 * Partially implemented: "all" fetches not cached.
 * @property {sqlite3.Database} _db Database associated with this cache.
 * @property {Map<string, sqlite3.Statement>} _statements Statements read from ../sql_statements.
 * @property {Map<string, object>} cache Cache for fetched rows.
 */
class Cache {
    static ENUM_USER_STATEMENT_VAR = {
        "id": "$id",
        "email": "$email",
        "username": "$username",
        "session": "$token"
    };

    /**
     * @param {sqlite3.Database} db Database instance.
     */
    constructor(db) {
        this.clear();
        this._db = db;
        this._statements = new Map();
        for (const file of readdirSync(join(__dirname, "../sql_statements"))) {
            if (!file.endsWith(".sql")) continue;
            const statement = db.prepare(readFileSync(join(__dirname, "../sql_statements", file)).toString("utf-8"));
            const value = {};
            let method;
            let caching;
            let identifier;
            if (file.startsWith("fetch")) {
                [method, caching, identifier] = file.split(".");
                value.statement = statement;
                value.doCache = caching !== "nocache";
                value.maxAge = caching !== "nocache" ? parseInt(caching) : null;
            } else {
                [method, identifier] = file.split(".");
                value.statement = statement;
            }
            this._statements.set(`${method}.${identifier}`, value);
        }
    }

    /**
     * Retrieves a User instance.
     * @param {"id"|"email"|"username"|"session"} by Key type to search by.
     * @param {string} res Value to search by.
     * @return {?User} User instance, null if none found.
     */
    async user(by, res) {
        const params = {};
        params[Cache.ENUM_USER_STATEMENT_VAR[by]] = res;
        const row = await this.fetch(`user_by_${by}`, params);
        if (!row) return null;
        return new User(row);
    }

    /**
     * Resets the cache to starting conditions.
     */
    clear() {
        this.cache = new Map();
    }

    /**
     * Purges cache entries due to be deleted.
     */
    purge() {
        const time = parseInt(new Date().getTime() / 1000);
        for (const [k, { expiry }] of this.cache.entries()) {
            if (expiry < time) {
                this.cache.delete(k);
            }
        }
    }

    /**
     * Fetches data from cache or database.
     * @param {string} identifier Fetch statement to execute.
     * @param {object} params Parameters to pass to prepared statement.
     * @return {Promise<object>} Result row.
     */
    fetch(identifier, params = {}) {
        const { statement, doCache, maxAge } = this._statements.get(`fetch.${identifier}`);
        const k = `${encodeURIComponent(identifier)}?${new URLSearchParams(params).toString()}`;
        if (doCache) {
            if (this.cache.has(k)) {
                return new Promise(r => r(this.cache.get(k).row));
            }
        }
        return promisify(statement.get.bind(statement))(params).then(row => {
            if (doCache) {
                this.cache.set(k, {
                    row: row || null,
                    expiry: parseInt(new Date().getTime() / 1000 + maxAge)
                });
            }
            return row || null;
        });
    }

    /**
     * Fetches data from cache or database. Fetches multiple rows.
     * @param {string} identifier Fetch statement to execute.
     * @param {object} params Parameters to pass to prepared statement.
     * @return {object[]} Result rows.
     */
    all(identifier, params = {}) {
        const { statement } = this._statements.get(`all.${identifier}`);
        return promisify(statement.all.bind(statement))(params);
    }

    /**
     * Runs a statement without retrieving any rows.
     * @param {string} identifier Fetch statement to execute.
     * @param {object} params Parameters to pass to prepared statement.
     * @return {Promise<undefined>} Potential error.
     */
    run(identifier, params = {}) {
        const { statement } = this._statements.get(`run.${identifier}`);
        return promisify(statement.run.bind(statement))(params);
    }
}

module.exports = Cache;
