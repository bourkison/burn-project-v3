import Amplify, { Auth, Hub, withSSRContext } from "aws-amplify";
import awsconfig from "@/aws-exports";

import { HubCallback } from '@aws-amplify/core/lib/Hub'
import { Module, Context } from "@nuxt/types"

Amplify.configure({ ...awsconfig, ssr: true });

const amplifyModule: Module = async ({ req, app: { $accessor } }: Context) => {
    // Check if user logs in or out.
    // If log in we also fetch the user document, else we commit user data to equal null.
    if (process.server && (!$accessor.userProfile || !$accessor.userProfile.loggedIn)) {
        // Log in on server init.
        const SSR = withSSRContext({ req });

        // Set logged in on initial load.
        try {
            const user = await SSR.Auth.currentSession();
            await $accessor.fetchUser({ user, req });
        }
        catch(err) {
            console.error("Error logging in server side:", err);
            // Don't set anything so application shows spinning wheel while it tries to log in client side.
        }
    } else if (process.client) {
        const authListener: HubCallback = async ({ payload: { event, data } }) => {
            switch (event) {
                case "signIn":
                    console.log("SIGNEDIN");
                    await $accessor.fetchUser({ user: await Auth.currentSession() })
                    break;
                case "signOut":
                    console.log("SIGNEDOUT");
                    $accessor.activeWorkout.RESET_VARIABLES();
                    $accessor.SET_LOGGED_IN_USER({ loggedIn: false, data: null, docData: null });
                    break;
                case "tokenRefresh":
                    console.log("TOKEN REFRESH", event, data);
                    break;
                case "tokenRefresh_failure":
                    console.log("TOKEN REFRESH FAILURE", event, data);
                    break;
                case "configured":
                    break;
                default:
                    console.log("Unhandled Auth Hub use case:", event, data);
                    break;
            }
        }

        Hub.listen("auth", authListener);

        // Try login again if not already logged in.
        if (!$accessor.userProfile || !$accessor.userProfile.loggedIn) {
            try {
                const user = await Auth.currentSession();
                console.log("Logged in client side");
                await $accessor.fetchUser({ user });
            }
            catch(err) {
                console.error("Error logging in client side:", err);
                $accessor.SET_LOGGED_IN_USER({ loggedIn: false, data: null, docData: null });
            }
        }
    }
}

export default amplifyModule;