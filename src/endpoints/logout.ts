import { EndpointHandler } from "../interfaces";

export const endpoint = "/logout";
export const get: EndpointHandler = (context) => async (req, res) => {
    const token = req.cookies.session;
    if (!token) {
        res.status(200).send("OK");
        return;
    }
    context.dbh.run("destroy_session", {
        $token: token
    });
    res.status(200).clearCookie("session").send("OK");
};
