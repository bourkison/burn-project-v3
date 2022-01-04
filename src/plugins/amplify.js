import Amplify from "aws-amplify";
import { Auth, Hub } from "aws-amplify"
import awsconfig from "~/aws-exports";

Amplify.configure({ ...awsconfig, ssr: true });


export default async ({ store }, { req }) => {
    // Check if user logs in or out.
    // If log in we also fetch the user document, else we commit user data to equal null.
    console.log("AMPLIFY:", req);

    Hub.listen("auth", async ({ payload: { event, data } }) => {
        switch (event) {
            case "signIn":
                console.log("SIGNEDIN");
                await store.dispatch("fetchUser", data.signInUserSession);
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
            default:
                console.log("Unhandled Auth Hub use case:", event, data);
                break;
        }
    });

    // Set logged in on initial load.
    try {
        if (store.state.userProfile && !store.state.userProfile.loggedIn) {
            store.commit("setLoggedInUser", null);
        }

        const user = await Auth.currentSession();

        console.log("USER:", user);

        if (user) {
            store.dispatch("fetchUser", user);
        } else {
            store.commit("setLoggedInUser", {
                loggedIn: false,
                data: null,
                docData: null
            });
        }
    }
    catch(err) {
        store.commit("setLoggedInUser", {
            loggedIn: false,
            data: null,
            docData: null
        });
    }
}