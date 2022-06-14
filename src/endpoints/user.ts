import { EndpointHandler } from "../interfaces";

export const endpoint = "/user/*";
export const handler: EndpointHandler = (context) => async (req, res) => {
    let profile;
    if (req.path.match(/\/user\/([0-9]+)/)) {
        const id = req.path.match(/\/user\/([0-9]+)/)![1];
        profile = await context.dbh.fetch("profile_by_id", {
            $id: id
        });
    } else {
        const username = req.path.match(/\/user\/(.*)/)![1];
        profile = await context.dbh.fetch("profile_by_username", {
            $username: decodeURIComponent(username)
        });
    }
    if (!profile) {
        res.status(404).redirect("/");
        return;
    }
    res.status(200).send(context.templates.get("user.pug")!({
        env: req.env,
        f: {
            profile
        }
    }));
};
