import { API } from "aws-amplify";
import Vue from 'vue';

export const state = () => {
    return {
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
    }
};

export const mutations = {
    setWorkout(state, workout) {
        state.workout = workout;
    },

    setWorkoutValue(state, data) {
        state.workout[data.key] = data.value;
    },

    setPreviousWorkout(state, previousWorkout) {
        state.previousWorkout = previousWorkout;
    },

    addExercise(state, exercise) {
        state.workout.recordedExercises.push(exercise);
    },

    removeExercise(state, exerciseIndex) {
        state.workout.recordedExercises.splice(exerciseIndex, 1);
    },

    changeExerciseOrder(state, data) {
        state.workout.recordedExercises.splice(
            data.n,
            0,
            state.workout.recordedExercises.splice(data.o, 1)[0]
        );
    },

    setExerciseValue(state, data) {
        Vue.set(state.workout.recordedExercises[data.exerciseIndex], data.key, data.value);
    },

    addSet(state, data) {
        state.workout.recordedExercises[data.exerciseIndex].sets.push(data.set);
    },

    removeSet(state, exerciseIndex) {
        state.workout.recordedExercises[exerciseIndex].sets.pop();
    },

    setSetValue(state, data) {
        Vue.set(
            state.workout.recordedExercises[data.exerciseIndex].sets[data.setIndex],
            data.key,
            data.value
        );

    },

    setEmptyWorkout(state, value) {
        state.emptyWorkout = value;
    },

    setIsFinishing(state, value) {
        state.isFinishing = value;
    },

    setWorkoutCommenced(state, value) {
        state.workoutCommenced = value;
    },

    setStartTime(state, startTime) {
        state.startTime = startTime;
    },

    setFinishTime(state, finishTime) {
        state.finishTime = finishTime;
    },

    setDisplayToast(state, value) {
        state.displayToast = value;
    },

    setInterval(state, timer) {
        state.interval = window.setInterval(() => {
            this.commit("activeWorkout/setTimeString");
        }, timer);
    },

    setTimeString(state) {
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

    resetVariables(state) {
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

    setTimer(state, seconds) {
        if (seconds !== 0) {

            state.countdownEndTime = new Date().getTime() + (seconds * 1000);
            state.countdownActive = true;

            state.countdownInterval = window.setInterval(() => {
                this.commit("activeWorkout/setTimerString");
            })
        } else {
            state.countdownActive = false;
            state.countdownTimeString = "00:00";
            state.countdownEndTime = 0;
            window.clearInterval(state.countdownInterval);
        }
    },

    setTimerString(state) {
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
    },

    pushToWorkoutCharts(state, options) {
        state.workoutCharts.push(options);
        console.log("PUSHED TO WORKOUT CHARTS", state.workoutCharts);
    },

    updateExerciseOptions(state, data) {
        console.log("UPDATE EXERCISE OPTIONS:", data);
        state.workout.recordedExercises[data.exerciseIndex].options = Object.assign({}, state.workout.recordedExercises[data.exerciseIndex].options, data.options)
    },

    setInitialUrl(state, url) {
        state.initialUrl = url;
    }
};

export const actions = {
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
    }
};