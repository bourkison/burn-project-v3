import { API, Auth } from "aws-amplify";
import Vue from "vue";
import Vuex from "vuex";

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
        timeString: "00:00",
        initialUrl: "",

        // Countdown/timer
        countdownActive: false,
        countdownInterval: null,
        countdownEndTime: 0,
        countdownTimeString: "00:00",

        // Charts
        workoutCharts: []
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
            state.countdownActive = false;
            state.countdownEndTime = 0;
            state.countdownTimeString = "00:00";
            state.workoutCharts = []
            window.clearInterval(state.countdownInterval);

        },

        setTimer: function(state, seconds) {
            if (seconds !== 0) {

                state.countdownEndTime = new Date().getTime() + (seconds * 1000);
                state.countdownActive = true;
    
                state.countdownInterval = window.setInterval(() => {
                    const now = new Date().getTime();
                    let timeLeft = state.countdownEndTime - now;
    
                    if (timeLeft > 0) {
                        let hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 24));
                        let minutes = Math.floor(
                            (timeLeft % (1000 * 60 * 60)) / (1000 * 60)
                        ).toLocaleString("en-US", {
                            minimumIntegerDigits: 2,
                            useGrouping: false
                        });
                        let seconds = Math.floor((timeLeft % (1000 * 60)) / 1000).toLocaleString("en-US", {
                            minimumIntegerDigits: 2,
                            useGrouping: false
                        });
        
                        if (!hours) {
                            state.countdownTimeString = minutes + ":" + seconds;
                        } else {
                            state.countdownTimeString = hours + ":" + minutes + ":" + seconds;
                        }
                    } else {
                        // PLAY SOUND AND END TIMER.
                        state.countdownActive = false;
                        state.countdownTimeString = "00:00";
                        state.countdownEndTime = 0;
                        window.clearInterval(state.countdownInterval);
                    }
    
                })
            } else {
                state.countdownActive = false;
                state.countdownTimeString = "00:00";
                state.countdownEndTime = 0;
                window.clearInterval(state.countdownInterval);
            }
        },

        pushToWorkoutCharts: function(state, options) {
            state.workoutCharts.push(options);
            console.log("PUSHED TO WORKOUT CHARTS", state.workoutCharts);
        },

        updateExerciseOptions: function(state, data) {
            console.log("UPDATE EXERCISE OPTIONS:", data);
            state.workout.recordedExercises[data.exerciseIndex].options = Object.assign({}, state.workout.recordedExercises[data.exerciseIndex].options, data.options)
        },

        setInitialUrl: function(state, url) {
            state.initialUrl = url;
        }
    },

    actions: {
        async uploadWorkout({ state, commit, rootState, dispatch }) {
            let payload = JSON.parse(JSON.stringify(state.workout));

            payload.duration = state.finishTime - state.startTime;
            payload.uniqueExercises = [];
            payload.recordedExercises.forEach(exercise => {
                delete exercise.exerciseReference._id;
                delete exercise.exerciseReference.createdAt;
                delete exercise.exerciseReference.updatedAt;
                delete exercise.exerciseReference.isFollow;

                exercise.sets.forEach(set => {
                    if (!set.weightAmount) {
                        set.weightAmount = 0;
                    } else {
                        set.weightAmount = Number(set.weightAmount) || 0;
                    }

                    if (!set.measureAmount) {
                        set.measureAmount = 0;
                    } else {
                        set.measureAmount = Number(set.measureAmount) || 0;
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
                    Authorization: await dispatch("fetchJwtToken", null, { root: true })
                },
                body: {
                    workoutForm: payload
                }
            };

            console.log("WORKOUT PAYLOAD", payload);

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
        userWorkouts: null,
        videoTokens: {}
    },
    mutations: {
        setVideoToken: function(state, data) {
            if (!state.videoTokens[data.key]) {
                Vue.set(state.videoTokens, data.key, { token: data.token, amount: 1 });
            } else {
                state.videoTokens[data.key].token = data.token;
                state.videoTokens[data.key].amount++;
            }
        },

        deleteVideoToken: function(state, key) {
            state.videoTokens[key].amount--;
            if (state.videoTokens[key].amount <= 0) {
                delete state.videoTokens[key];
            }
        },

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
        },

        updateChart: async function(state, data) {
            switch (data.position) {
                case "homepageLeftRail":
                    Vue.set(state.userProfile.docData.options.charts.homepage.leftRail, data.index, data.options);
                    break;
                case "profileLeftRail":
                    Vue.set(state.userProfile.docData.options.charts.profile.leftRail, data.index, data.options)
                    break;
                case "newWorkoutRightRail":
                    Vue.set(state.activeWorkout.workoutCharts, data.index, data.options);
                    break;

            }            
        }

    },
    actions: {
        fetchUser: async function({ state, commit, dispatch }, data) {
            const path = "/user/" + data.idToken.payload["cognito:username"];
            const myInit = {
                headers: {
                    Authorization: await dispatch("fetchJwtToken")
                }
            };

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

        fetchJwtToken: async function() {
            return (await Auth.currentSession()).getIdToken().getJwtToken();
        },

        updateChart: async function({ state, commit, dispatch }, data) {
            if (data.save) {
                const path = "/stats/" + data.position;
                const myInit = {
                    headers: {
                        Authorization: await dispatch("fetchJwtToken")
                    },
                    body: {
                        options: data.options,
                        index: data.index
                    }
                }

                const response = await API.put(state.apiName, path, myInit);
                console.log(response);
            }

            commit("updateChart", data);
            return;     
        }
    },
    modules: {
        activeWorkout: activeWorkoutModule
    }
});
