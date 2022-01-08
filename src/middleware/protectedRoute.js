import { Auth, withSSRContext } from "aws-amplify"

export default async function({ redirect, req }) {
    if (process.server) {
        const SSR = withSSRContext(req);
        try {
            const user = await SSR.Auth.currentSession()
            if (!user) {
                return redirect("/");
            }
        }
        catch {
            console.error("Unauthenticated, redirecting");
            return redirect("/");
        }
    } else if (process.client) {
        try {
            const user = Auth.currentSession()
            if (!user) {
                return redirect("/");
            }
        }
        catch {
            console.error("Unauthenticated, redirecting");
            return redirect("/");
        }
    }
}