import { TransactionHandler, TransactionInstantiator } from "../interfaces";

export const action = 0;

export const handle: TransactionHandler = (context) => async (transaction, user) => {
    if (user.permissionLevel !== 0) throw new Error("user is already verified");
    await context.dbh.run(`
        UPDATE
            user
        SET
            permission_level = 1
        WHERE
            id = CAST(? AS UNSIGNED) AND
            permission_level = 0;
    `, transaction.userId);
};

export const instantiate: TransactionInstantiator = (context) => async (tKey, user) => {
    if (user.permissionLevel !== 0) throw new Error("user is already verified");
    return {
        email: {
            to: user.email,
            subject: "Registrierung bestätigen auf OpenGoethe!",
            text: `Hi ${user.username}!\n` +
                "Bestätige deine Registrierung bei OpenGoethe unter dem folgenden Link:\n\n" +
                `https://${context.config.domain}/transaction/${tKey}`
        },
        friendly: `Registrierung bestätigen für ${user.email}`
    };
};
