import { EndpointHandler } from "../interfaces";

export const endpoint = "/login";
export const handler: EndpointHandler = (context) => async (req, res) => {
    res.send(context.templates.get("login.pug")!({
        env: req.env
    }));
};
