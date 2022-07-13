import { Transaction } from "./interfaces";

const STATUS: Transaction["status"][] = [
    "pending",
    "approved",
    "rejected"
];

const ACTION: Transaction["action"][] = [
    "verify_email"
];

export function transactionFromDb(row: any, key?: string): Transaction | null {
    if (!row) return null;
    return {
        id: row.id,
        userId: row.user_id,
        key: row.key ?? key,
        status: STATUS[row.status],
        action: ACTION[row.action],
        data: row.data,
        friendly: row.friendly
    };
}
