/**
 * Represents a registered user.
 * @property {string} id User ID stringified to cope with Node.
 * @property {string} email Email address of user.
 * @property {string} username Username of user.
 * @property {0|1|2|3|4|5} permissionLevel Permission level of user.
 * @property {?string} avatar Filename of the user's avatar.
 */
class User {
    /**
     * @param {object} row Database row containing user information.
     */
    constructor({
        id,
        email,
        username,
        permission_level: permissionLevel,
        avatar
    }) {
        this.id = id;
        this.email = email;
        this.username = username;
        this.permissionLevel = permissionLevel;
        this.avatar = avatar;
    }
};

module.exports = User;
