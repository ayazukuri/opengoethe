import { Request, Response } from "express";
import { Transporter } from "nodemailer";
import Mail from "nodemailer/lib/mailer";
import { compileTemplate } from "pug";
import { DBHandler, IDGenerator, User } from "./classes";

export interface Env {
    loggedIn: boolean;
    user?: User;
}

type TransactionKey = string;

export interface Transaction {
    id: string;
    userId: string;
    key: TransactionKey;
    status: "pending" | "approved" | "rejected";
    action: string;
    data?: string;
    friendly?: string;
}

export interface Context {
    dbh: DBHandler;
    templates: Map<string, compileTemplate>;
    emailTransporter: Transporter;
    idGenerator: IDGenerator;
    config: any;
}

interface InstantiatorResult {
    email: Mail.Options;
    friendly: string;
}

export type EndpointHandler = (context: Context) => (req: Request, res: Response) => Promise<void>;
export type TransactionHandler = (context: Context) => (transaction: Transaction, user: User) => Promise<void>;
export type TransactionInstantiator = (context: Context) => (tKey: string, user: User) => Promise<InstantiatorResult>;

export interface Endpoint {
    endpoint: string | string[];
    permissionLevel?: number;
    get?: EndpointHandler;
    post?: EndpointHandler;
    put?: EndpointHandler;
    delete?: EndpointHandler;
}
