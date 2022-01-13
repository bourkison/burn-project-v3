import { Auth, withSSRContext } from "aws-amplify"
import { Middleware } from "@nuxt/types"

const requiresAuth: Middleware = async function({ redirect, req }) {
    if (process.server) {
        const SSR = withSSRContext({ req });
        await SSR.Auth.currentSession().catch(() => { redirect("/") })
    } else if (process.client) {
        await Auth.currentSession().catch(() => { redirect("/") })
    }

    return;
}

export default requiresAuth;