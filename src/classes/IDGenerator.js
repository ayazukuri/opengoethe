const crypto = require("crypto");

/**
 * Util class for generating resource identifiers.
 *
 * bit 63-22: timestamp        (42 bits)
 * bit 21-15: counter          (06 bits)
 * bit 15-00: random integer   (16 bits)
 */
class IDGenerator {
    /**
     *
     */
    constructor() {
        this._c = 0;
    }

    /**
     * Generates a random 16-bit integer.
     * @return {number} Random 16-bit integer.
     */
    randU16() {
        return crypto.randomBytes(16).readUInt16BE();
    }

    /**
     * Generates a resource identifier.
     * @return {string} Generated ID.
     */
    id() {
        const id = (BigInt(new Date().getTime() - 1640991600000) << 22n) + (BigInt(this._c) << 16n) + BigInt(this.randU16());
        this._c = (this._c + 1) % 64;
        return id.toString();
    }
}

module.exports = IDGenerator;
