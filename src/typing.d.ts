import { Env } from "./interfaces";

declare global {
    // eslint-disable-next-line no-unused-vars
    namespace Express {
        export interface Request {
            env: Env
        }
    }
}
