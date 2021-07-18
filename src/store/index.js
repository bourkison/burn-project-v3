import Vue from 'vue'
import Vuex from 'vuex'
import { auth, db } from '../firebase'
import router from '../router'

Vue.use(Vuex)

export default new Vuex.Store({
    state: {
        burnPromises: [],
        userProfile: null,
        userBurns: null,
    },
    mutations: {
        setLoggedInUser: function(state, user) {
            state.userProfile = user;
        },

        setLoggedInUserBurns: function(state, burns) {
            state.userBurns = burns;
        },

        setLoadingBurns: function(state, promises) {
            state.burnPromises = promises;
        },

        pushBurnToUserBurns: function(state, burn) {
            state.userBurns.unshift(burn);
        }
    },
    actions: {
        // Fetch user gets called after firebase.onAuthChange in main.js
        // It pulls the user profile document using the user ID pass to it from auth change.
        async fetchUser({ commit }, user) {
            if (user) {
                const userProfile = await db.collection("users").doc(user.uid).get()
                if (userProfile.exists) {
                    commit("setLoggedInUser", { loggedIn: true, data: user, docData: userProfile.data() });

                    if (router.history.current.name == "Sign Up" || router.history.current.name == "Login") {
                        router.push("/");
                    }
                } else {
                    console.log("User signed in but no doc data. Signing out.")
                    auth.signOut();
                    commit("setLoggedInUser", { loggedIn: false, data: null, docData: null })
                } 
            } else {
                commit("setLoggedInUser", { loggedIn: false, data: null, docData: null })
            }
        },

        // As this function may get callled multiple times from different components,
        // Store the promise in an array to avoid loading it multiple times.
        fetchBurns: function({ commit }, user) {
            if (this.state.burnPromises.length === 0) {
                commit('setLoadingBurns', [db.collection("users").doc(user.uid).collection("burns").orderBy("createdAt", "desc").get()]);

                return Promise.all(this.state.burnPromises)
                .then(responses => {
                    responses.forEach(burnSnapshot => {
                        let burns = [];
                        if (burnSnapshot.size > 0) {
                            burnSnapshot.forEach(burn => {
                                let d = burn.data();
                                d.id = burn.id;
                                burns.push(d);
                            })
                        }

                        commit('setLoggedInUserBurns', burns);
                        commit('setLoadingBurns', []);
                    })
                })
            } else {
                return Promise.all(this.state.burnPromises).then(() => {
                    commit('setLoadingBurns', []);
                })
            }
        }
    },
    modules: {
    }
})
