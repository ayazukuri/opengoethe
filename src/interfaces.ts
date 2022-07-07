import { Request, Response } from "express";
import { Transporter } from "nodemailer";
import { compileTemplate } from "pug";
import { DBHandler, IDGenerator, User } from "./classes";

export interface Env {
    loggedIn: boolean;
    user?: User;
}
export interface Context {
    dbh: DBHandler;
    templates: Map<string, compileTemplate>;
    emailTransporter: Transporter;
    idGenerator: IDGenerator;
    config: any;
}
export type EndpointHandler = (context: Context) => (req: Request, res: Response) => Promise<void>;
export interface Endpoint {
    endpoint: string;
    permissionLevel?: number;
    handler: EndpointHandler;
}
