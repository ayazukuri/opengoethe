import { EndpointHandler } from "../interfaces";

export const endpoint = "/";
export const handler: EndpointHandler = (context) => async (req, res) => {
    const pages = await context.dbh.all("preview_page", {
        $max: 12
    });
    const users = await context.dbh.all("preview_user", {
        $max: 12
    });
    res.status(200).send(context.templates.get("main.pug")!({
        env: req.env,
        f: {
            pages,
            users
        }
    }));
};
