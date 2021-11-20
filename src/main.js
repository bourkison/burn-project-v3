import Vue from "vue";
import App from "./App.vue";
import router from "./router";
import store from "./store";

import VueMeta from "vue-meta";
import VueObserveVisibility from "vue-observe-visibility";

import Amplify from "aws-amplify";
import aws_exports from "./aws-exports";
import { Auth, Hub } from "aws-amplify";

import { BootstrapVue, BootstrapVueIcons } from "bootstrap-vue";

import "bootstrap/dist/css/bootstrap.css";
import "bootstrap-vue/dist/bootstrap-vue.css";

Vue.use(VueObserveVisibility);
Vue.use(VueMeta);

Vue.use(BootstrapVue);
Vue.use(BootstrapVueIcons);

Amplify.configure(aws_exports);

Vue.config.productionTip = false;

new Vue({
    router,
    store,
    render: h => h(App)
}).$mount("#app");

// Check if user logs in or out.
// If log in we also fetch the user document, else we commit user data to equal null.
Hub.listen("auth", async ({ payload: { event, data } }) => {
    switch (event) {
        case "signIn":
            console.log("SIGNEDIN");
            await store.dispatch("fetchUser", data);
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
