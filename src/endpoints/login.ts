import { EndpointHandler } from "../interfaces";

export const endpoint = "/login";
export const get: EndpointHandler = (context) => async (req, res) => {
    res.status(200).send(context.templates.get("login.pug")!({
        env: req.env
    }));
};
