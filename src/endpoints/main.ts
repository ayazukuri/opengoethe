import { EndpointHandler } from "../interfaces";

export const endpoint = "/";
export const get: EndpointHandler = (context) => async (req, res) => {
    const users = await context.dbh.all("preview_user", {
        $max: 12
    });
    res.status(200).send(context.templates.get("main.pug")!({
        env: req.env,
        f: {
            users
        }
    }));
};
