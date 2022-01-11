import { Auth, withSSRContext } from "aws-amplify"

export default async function({ redirect, req }) {
    if (process.server) {
        const SSR = withSSRContext({ req });
        await SSR.Auth.currentSession().catch(() => { redirect("/") })
    } else if (process.client) {
        await Auth.currentSession().catch(() => { redirect("/") })
    }

    return;
}