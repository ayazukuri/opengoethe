import { EndpointHandler } from "../interfaces";

export const endpoint = "/user/*";
export const get: EndpointHandler = (context) => async (req, res) => {
    let profile;
    if (req.path.match(/\/user\/([0-9]+)/)) {
        const id = req.path.match(/\/user\/([0-9]+)/)![1];
        profile = await context.dbh.fetch(`
            SELECT
                CAST(id AS varchar(50)) AS id,
                username,
                permission_level,
                ((id >> 22) + 1640991600000) AS creation_time,
                summary
            FROM
                user
            WHERE
                id = CAST(? AS UNSIGNED);
        `, id);
    } else {
        const username = req.path.match(/\/user\/(.*)/)![1];
        profile = await context.dbh.fetch(`
            SELECT
                CAST(id AS varchar(50)) AS id,
                username,
                permission_level,
                ((id >> 22) + 1640991600000) AS creation_time,
                summary
            FROM
                user
            WHERE
                username = ?;
        `, username);
    }
    if (!profile) {
        res.redirect(404, "/");
        return;
    }
    res.status(200).send(context.templates.get("user.pug")!({
        env: req.env,
        f: {
            profile
        }
    }));
};
