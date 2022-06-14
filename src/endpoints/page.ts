import { EndpointHandler } from "../interfaces";

export const endpoint = "/page/*";
export const handler: EndpointHandler = (context) => async (req, res) => {
    let page;
    if (req.path.match(/\/page\/([0-9]+)/)) {
        const id = req.path.match(/\/page\/([0-9]+)/)![1];
        page = await context.dbh.fetch("page_by_id", {
            $id: id
        });
    } else {
        const name = req.path.match(/\/page\/(.*)/)![1];
        page = await context.dbh.fetch("page_by_name", {
            $name: decodeURIComponent(name)
        });
    }
    if (!page) {
        res.status(404).redirect("/");
        return;
    }
    res.status(200).send(context.templates.get("page.pug")!({
        env: req.env,
        md: context.md,
        f: {
            page
        }
    }));
};
