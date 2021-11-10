import { API } from "aws-amplify";
import Vue from "vue";
import Vuex from "vuex";
import { userWorkoutsCollection } from "../firebase";

Vue.use(Vuex);

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
        timeString: "00:00"
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
            state.workout.recordedExercises.push(exercise);
        },

        removeExercise: function(state, exerciseIndex) {
            state.workout.recordedExercises.splice(exerciseIndex, 1);
        },

        changeExerciseOrder: function(state, data) {
            state.workout.recordedExercises.splice(
                data.n,
                0,
                state.workout.recordedExercises.splice(data.o, 1)[0]
            );
        },

        setExerciseValue: function(state, data) {
            Vue.set(state.workout.recordedExercises[data.exerciseIndex], data.key, data.value);
        },

        addSet: function(state, data) {
            state.workout.recordedExercises[data.exerciseIndex].sets.push(data.set);
        },

        removeSet: function(state, exerciseIndex) {
            state.workout.recordedExercises[exerciseIndex].sets.pop();
        },

        setSetValue: function(state, data) {
            Vue.set(
                state.workout.recordedExercises[data.exerciseIndex].sets[data.setIndex],
                data.key,
                data.value
            );
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
                let minutes = Math.floor(
                    (duration % (1000 * 60 * 60)) / (1000 * 60)
                ).toLocaleString("en-US", {
                    minimumIntegerDigits: 2,
                    useGrouping: false
                });
                let seconds = Math.floor((duration % (1000 * 60)) / 1000).toLocaleString("en-US", {
                    minimumIntegerDigits: 2,
                    useGrouping: false
                });

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
            let minutes = Math.floor((duration % (1000 * 60 * 60)) / (1000 * 60)).toLocaleString(
                "en-US",
                {
                    minimumIntegerDigits: 2,
                    useGrouping: false
                }
            );
            let seconds = Math.floor((duration % (1000 * 60)) / 1000).toLocaleString("en-US", {
                minimumIntegerDigits: 2,
                useGrouping: false
            });

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
            (state.emptyWorkout = true), (state.startTime = 0);
            state.finishTime = 0;
            state.interval = null;
            state.timeString = "00:00";
            state.displayToast = false;
        }
    },

    actions: {
        async uploadWorkout({ state, commit, rootState }) {
            let payload = JSON.parse(JSON.stringify(state.workout));

            payload.duration = state.finishTime - state.startTime;
            payload.uniqueExercises = [];
            payload.recordedExercises.forEach(exercise => {
                delete exercise.exerciseReference._id;
                delete exercise.exerciseReference.createdAt;
                delete exercise.exerciseReference.updatedAt;
                delete exercise.exerciseReference.isFollow;

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
                });

                if (!exercise.notes) {
                    exercise.notes = "";
                }

                if (!payload.uniqueExercises.includes(exercise.exerciseReference.exerciseId)) {
                    payload.uniqueExercises.push(exercise.exerciseReference.exerciseId);
                }
            });

            const path = "/workout";
            const myInit = {
                headers: {
                    Authorization: rootState.userProfile.data.idToken.jwtToken
                },
                body: {
                    workoutForm: payload
                }
            };

            console.log(JSON.stringify({ workoutForm: payload }));

            const result = (
                await API.post(rootState.apiName, path, myInit).catch(err => {
                    console.error("Error uploading result:", err);
                })
            ).data.workout;

            commit("pushWorkoutToUserWorkouts", result, { root: true });
            commit("resetVariables");
            console.log(payload, result);
        }
    }
};

export default new Vuex.Store({
    state: {
        apiName: "projectburnapi",
        workoutPromises: [],
        userProfile: null,
        userWorkouts: null
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
            if (!state.workouts) {
                state.userWorkouts = [workout];
            } else {
                state.userWorkouts.unshift(workout);
            }
        }
    },
    actions: {
        fetchUser: async function({ state, commit }, data) {
            const path = "/user/" + data.idToken.payload["cognito:username"];
            const myInit = {
                headers: {
                    Authorization: data.idToken.jwtToken
                }
            };

            console.log("PATH:", path);
            console.log("INIT:", myInit);

            const docData = (
                await API.get(state.apiName, path, myInit).catch(err => {
                    console.error("USER DOC ERR:", err);
                    commit("setLoggedInUser", { loggedIn: false, data: null, docData: null });
                    return;
                })
            ).data;

            commit("setLoggedInUser", {
                loggedIn: true,
                data: data,
                docData: docData
            });

            return;
        },

        // As this function may get callled multiple times from different components,
        // Store the promise in an array to avoid loading it multiple times.
        fetchWorkouts: async function({ commit, state }, user) {
            if (state.workoutPromises.length === 0) {
                commit("setLoadingWorkouts", [
                    userWorkoutsCollection(user.uid)
                        .orderBy("createdAt", "desc")
                        .get()
                ]);

                const responses = await Promise.all(state.workoutPromises);

                responses.forEach(workoutSnapshot => {
                    let workouts = [];
                    if (workoutSnapshot.size > 0) {
                        workoutSnapshot.forEach(workout => {
                            let d = workout.data();
                            d.id = workout.id;
                            workouts.push(d);
                        });
                    }

                    commit("setLoggedInUserWorkouts", workouts);
                    commit("setLoadingWorkouts", []);
                });
            } else {
                await Promise.all(state.workoutPromises).then(() => {
                    commit("setLoadingWorkouts", []);
                });
            }
        }
    },
    modules: {
        activeWorkout: activeWorkoutModule
    }
});
