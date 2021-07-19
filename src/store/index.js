import Vue from 'vue'
import Vuex from 'vuex'
import { auth, db, userWorkoutsCollection } from '../firebase'
import router from '../router'

Vue.use(Vuex)

export default new Vuex.Store({
    state: {
        workoutPromises: [],
        userProfile: null,
        userWorkouts: null,
    },
    mutations: {
        setLoggedInUser: function(state, user) {
            state.userProfile = user;
        },

        setLoggedInUserWorkouts: function(state, workouts) {
            state.userWorkouts = workouts;
        },

        setLoadingWorkouts: function(state, promises) {
            state.workoutPromises = promises;
        },

        pushWorkoutToUserWorkouts: function(state, workout) {
            state.userWorkouts.unshift(workout);
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
        fetchWorkouts: function({ commit }, user) {
            if (this.state.workoutPromises.length === 0) {
                commit('setLoadingWorkouts', [userWorkoutsCollection(user.uid).orderBy("createdAt", "desc").get()]);

                return Promise.all(this.state.workoutPromises)
                .then(responses => {
                    responses.forEach(workoutSnapshot => {
                        let workouts = [];
                        if (workoutSnapshot.size > 0) {
                            workoutSnapshot.forEach(workout => {
                                let d = workout.data();
                                d.id = workout.id;
                                workouts.push(d);
                            })
                        }

                        commit('setLoggedInUserWorkouts', workouts);
                        commit('setLoadingWorkouts', []);
                    })
                })
            } else {
                return Promise.all(this.state.workoutPromises).then(() => {
                    commit('setLoadingWorkouts', []);
                })
            }
        }
    },
    modules: {
    }
})
