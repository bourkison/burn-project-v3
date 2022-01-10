import { Auth, withSSRContext } from "aws-amplify"

export default async function({ redirect, req }) {
    if (process.server) {
        const SSR = withSSRContext(req);
        const user = await SSR.Auth.currentSession().catch(() => { redirect("/") })
    } else if (process.client) {
        const user = await Auth.currentSession().catch(() => { redirect("/") })
    }
}