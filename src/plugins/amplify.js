import Amplify from "aws-amplify";
import { Auth, Hub } from "aws-amplify"
import awsconfig from "~/aws-exports";

Amplify.configure({ ...awsconfig, ssr: true });


export default ({ store }) => {
    // Check if user logs in or out.
    // If log in we also fetch the user document, else we commit user data to equal null.
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
    Auth.currentSession()
    .then(user => {
        if (user) {
            store.dispatch("fetchUser", user);
        } else {
            store.commit("setLoggedInUser", {
                loggedIn: false,
                data: null,
                docData: null
            });
        }
    })
    .catch(() => {
        store.commit("setLoggedInUser", {
            loggedIn: false,
            data: null,
            docData: null
        });
    });
}