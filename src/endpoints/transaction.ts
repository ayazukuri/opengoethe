import { EndpointHandler } from "../interfaces";

export const endpoint = ["/transaction", "/transaction/*"];
export const get: EndpointHandler = (context) => async (req, res) => {
    const m = req.path.match(/\/transaction\/(.*)/);
    if (!m) {
        res.status(404).redirect("/");
        return;
    }
    const transaction = context.transactions.get(m![1]);
    if (!transaction) {
        res.status(404).redirect("/");
        return;
    }
    res.status(200).send(context.templates.get("transaction.pug")!({
        env: req.env,
        f: {
            friendlyAction: transaction.friendlyAction,
            tKey: m![1]
        }
    }));
};
export const post: EndpointHandler = (context) => async (req, res) => {
    const transaction = context.transactions.get(req.body.transactionKey);
    if (!transaction) {
        res.status(404).send("unknown transaction");
        return;
    }
    if (req.body.approved) await transaction.action();
    context.transactions.delete(req.body.transactionKey);
    res.status(200).send("OK");
};
