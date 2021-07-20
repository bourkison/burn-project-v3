import Vue from 'vue'
import Vuex from 'vuex'
import { userWorkoutsCollection } from '../firebase'
import { Auth } from 'aws-amplify'
import router from '../router'

Vue.use(Vuex)

// Used for tracking live workout
const activeWorkoutModule = {
    namespaced: true,
    state: () => ({
        isFinishing: false,
        workoutCommenced: false,
        workout: {},
        previousWorkout: {},
        emptyWorkout: true,
        displayToast: false,
        startTime: 0,
        finishTime: 0,
        interval: null,
        timeString: '00:00'
    }),

    mutations: {
        setWorkout: function(state, workout) {
            state.workout = workout;
        },

        setWorkoutValue: function(state, data) {
            state.workout[data.key] = data.value;
        },

        setPreviousWorkout: function(state, previousWorkout) {
            state.previousWorkout = previousWorkout;
        },

        addExercise: function(state, exercise) {
            state.workout.exercises.push(exercise);
        },

        removeExercise: function(state, exerciseIndex) {
            state.workout.exercises.splice(exerciseIndex, 1);
        },

        changeExerciseOrder: function(state, data) {
            state.workout.exercises.splice(data.n, 0, state.workout.exercises.splice(data.o, 1)[0]);
        },

        setExerciseValue: function(state, data) {
            Vue.set(state.workout.exercises[data.exerciseIndex], data.key, data.value);
        },

        addSet: function(state, data) {
            state.workout.exercises[data.exerciseIndex].sets.push(data.set);
        },

        removeSet: function(state, exerciseIndex) {
            state.workout.exercises[exerciseIndex].sets.pop();
        },

        setSetValue: function(state, data) {
            Vue.set(state.workout.exercises[data.exerciseIndex].sets[data.setIndex], data.key, data.value);
        },

        setEmptyWorkout: function(state, value) {
            state.emptyWorkout = value;
        },

        setIsFinishing: function(state, value) {
            state.isFinishing = value;
        },

        setWorkoutCommenced: function(state, value) {
            state.workoutCommenced = value;
        },

        setStartTime: function(state, startTime) {
            state.startTime = startTime;
        },

        setFinishTime: function(state, finishTime) {
            state.finishTime = finishTime;
        },

        setDisplayToast: function(state, value) {
            state.displayToast = value;
        },

        setInterval: function(state, timer) {
            state.interval = window.setInterval(() => {
                const now = new Date().getTime();
                let duration = now - state.startTime;

                let hours = Math.floor((duration % (1000 * 60 * 60 * 24)) / (1000 * 60 * 24));
                let minutes = (Math.floor((duration % (1000 * 60 * 60)) / (1000 * 60))).toLocaleString('en-US', { minimumIntegerDigits: 2, useGrouping: false });
                let seconds = (Math.floor((duration % (1000 * 60)) / 1000)).toLocaleString('en-US', { minimumIntegerDigits: 2, useGrouping: false });

                if (!state.isFinishing) {
                    if (!hours) {
                        state.timeString = minutes + ":" + seconds;
                    } else {
                        state.timeString = hours + ":" + minutes + ":" + seconds;
                    }
                }
            }, timer);
        },

        setTimeString: function(state) {
            const now = new Date().getTime();
            let duration = now - state.startTime;

            let hours = Math.floor((duration % (1000 * 60 * 60 * 24)) / (1000 * 60 * 24));
            let minutes = (Math.floor((duration % (1000 * 60 * 60)) / (1000 * 60))).toLocaleString('en-US', { minimumIntegerDigits: 2, useGrouping: false });
            let seconds = (Math.floor((duration % (1000 * 60)) / 1000)).toLocaleString('en-US', { minimumIntegerDigits: 2, useGrouping: false });

            if (!state.isFinishing) {
                if (!hours) {
                    state.timeString = minutes + ":" + seconds;
                } else {
                    state.timeString = hours + ":" + minutes + ":" + seconds;
                }
            }
        },

        resetVariables: function(state) {
            window.clearInterval(state.interval);

            state.isFinishing = false;
            state.workoutCommenced = false;
            state.workout = {};
            state.previousWorkout = {};
            state.emptyWorkout = true,
            state.startTime = 0;
            state.finishTime = 0;
            state.interval = null;
            state.timeString = "00:00";
            state.displayToast = false;
        }
    },

    actions: {
        async uploadWorkout({ state, commit }, userId) {
            let payload = JSON.parse(JSON.stringify(state.workout));

            // Put unique exercises into array so we can query in Firebase.
            payload.exerciseIds = [];
            payload.exercises.forEach(exercise => {
                exercise.sets.forEach(set => {
                    if (!set.kg) {
                        set.kg = 0;
                    } else {
                        set.kg = Number(set.kg);
                    }

                    if (!set.measureAmount) {
                        set.measureAmount = 0;
                    } else {
                        set.measureAmount = Number(set.measureAmount);
                    }
                })

                if (!exercise.notes) {
                    exercise.notes = "";
                }
                
                if (!payload.exerciseIds.includes(exercise.id)) {
                    payload.exerciseIds.push(exercise.id);
                }
            })

            payload.createdAt = new Date();
            payload.duration = state.finishTime - state.startTime;

            const d = await userWorkoutsCollection(userId).add(payload);
            let temp = d.data();
            temp.id = d.id;
            commit('pushWorkoutToUserWorkouts', temp);
        }
    }
};

export default new Vuex.Store({
    state: {
        apiName: 'burnprojectapi',
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
        // async fetchUser({ commit }, user) {
        //     if (user) {
        //         const userProfile = await db.collection("users").doc(user.uid).get()
        //         if (userProfile.exists) {
        //             commit("setLoggedInUser", { loggedIn: true, data: user, docData: userProfile.data() });

        //             if (router.history.current.name == "Sign Up" || router.history.current.name == "Login") {
        //                 router.push("/");
        //             }
        //         } else {
        //             console.log("User signed in but no doc data. Signing out.")
        //             auth.signOut();
        //             commit("setLoggedInUser", { loggedIn: false, data: null, docData: null })
        //         } 
        //     } else {
        //         commit("setLoggedInUser", { loggedIn: false, data: null, docData: null })
        //     }
        // },

        async fetchUser({ commit }, reroute) {
            const user = await Auth.currentAuthenticatedUser().catch(() => { commit("setLoggedInUser", { loggedIn: false, data: null, docData: null }); })
            
            if (user) {
                console.log("LOGGED IN:", user);
                commit("setLoggedInUser", { loggedIn: true, data: user, docData: 1 });
                if (router.history.current.name == "Sign Up" || router.history.current.name == "Login" || reroute) {
                    router.push("/");
                }
            } else {
                commit("setLoggedInUser", { loggedIn: false, data: null, docData: null });
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
        activeWorkout: activeWorkoutModule
    }
})