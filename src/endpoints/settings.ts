import { EndpointHandler } from "../interfaces";

export const endpoint = "/settings";
export const get: EndpointHandler = (context) => async (req, res) => {
    if (!req.env.loggedIn) {
        res.status(403).redirect("/login");
        return;
    }
    res.status(200).send(context.templates.get("settings.pug")!({
        env: req.env,
        f: {
            user: req.env.user
        }
    }));
};
