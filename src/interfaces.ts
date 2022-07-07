import { Request, Response } from "express";
import { Transporter } from "nodemailer";
import { compileTemplate } from "pug";
import { DBHandler, IDGenerator, User } from "./classes";

export interface Env {
    loggedIn: boolean;
    user?: User;
}

type TransactionKey = string;

export interface Transaction {
    id: string;
    key: TransactionKey;
    friendlyAction: string;
    issued: Date;
    action: () => any;
}

export interface Context {
    dbh: DBHandler;
    templates: Map<string, compileTemplate>;
    emailTransporter: Transporter;
    idGenerator: IDGenerator;
    config: any;
    transactions: Map<TransactionKey, Transaction>;
}

export type EndpointHandler = (context: Context) => (req: Request, res: Response) => Promise<void>;

export interface Endpoint {
    endpoint: string | string[];
    permissionLevel?: number;
    get?: EndpointHandler;
    post?: EndpointHandler;
    put?: EndpointHandler;
    delete?: EndpointHandler;
}
