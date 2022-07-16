import { TransactionHandler, TransactionInstantiator } from "../interfaces";
import * as verifyEmail from "./verifyEmail";

export const handlers: {
    [index: string]: {
        action: number;
        handle: TransactionHandler;
        instantiate: TransactionInstantiator;
    }
} = {
    verify_email: verifyEmail
};
