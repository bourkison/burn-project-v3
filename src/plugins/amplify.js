import Amplify, { Auth, Hub, withSSRContext } from "aws-amplify";
import awsconfig from "@/aws-exports";

Amplify.configure({ ...awsconfig, ssr: true });


export default async ({ store, req }) => {
    // Check if user logs in or out.
    // If log in we also fetch the user document, else we commit user data to equal null.
    if (process.server && (!store.state.userProfile || !store.state.userProfile.loggedIn)) {
        // Log in on server init.
        const SSR = withSSRContext({ req });

        // Set logged in on initial load.
        try {
            const user = await SSR.Auth.currentSession();
            console.log("Logged in server side");
            await store.dispatch("fetchUser", { user, req });
        }
        catch(err) {
            console.error("Error logging in server side:", err);
            // Don't set anything so application shows spinning wheel while it tries to log in client side.
        }
    } else if (process.client) {
        Hub.listen("auth", async ({ payload: { event, data } }) => {
            switch (event) {
                case "signIn":
                    console.log("SIGNEDIN");
                    await store.dispatch("fetchUser", { user: data.signInUserSession });
                    break;
                case "signOut":
                    console.log("SIGNEDOUT");
                    store.commit("activeWorkout/resetVariables");
                    store.commit("setLoggedInUser", {
                        loggedIn: false,
                        data: null,
                        docData: null
                    });
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
        });

        // Try login again if not already logged in.
        if (!store.state.userProfile || !store.state.userProfile.loggedIn) {
            try {
                const user = await Auth.currentSession();
                console.log("Logged in client side");
                await store.dispatch("fetchUser", { user });
            }
            catch(err) {
                console.error("Error logging in client side:", err);
                store.commit("setLoggedInUser", {
                    loggedIn: false,
                    data: null,
                    docData: null
                });
            }
        }
    }
}