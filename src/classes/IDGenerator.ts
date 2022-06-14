import crypto from "crypto";

const EPOCH = 1640991600000;

export class IDGenerator {
    private c: number;

    constructor() {
        this.c = 0;
    }

    randU16() {
        return crypto.randomBytes(16).readUInt16BE();
    }

    id() {
        const id = (BigInt(new Date().getTime() - EPOCH) << 22n) + (BigInt(this.c) << 16n) + BigInt(this.randU16());
        this.c = (this.c + 1) % 64;
        return id.toString();
    }
}
