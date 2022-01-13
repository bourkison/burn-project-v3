import { API } from "aws-amplify";
import Vue from 'vue';

import { mutationTree, actionTree } from "typed-vuex";
import { IWorkout, IChart, IRecordedExercise, IRecordedSet } from "@/types"

export const state = () => {
    return {
        isFinishing: false,
        workoutCommenced: false,
        workout: undefined as IWorkout | undefined,
        previousWorkout: undefined as IWorkout | undefined,
        emptyWorkout: true,
        displayToast: false,
        startTime: 0,
        finishTime: 0,
        interval: undefined as number | undefined,
        timeString: "00:00",
        initialUrl: "",

        // Countdown/timer
        countdownActive: false,
        countdownInterval: undefined as number | undefined,
        countdownEndTime: 0,
        countdownTimeString: "00:00",

        // Charts
        workoutCharts: [] as IChart[]
    }
};

export type ActiveWorkoutState = ReturnType<typeof state>;

export const mutations = mutationTree(state, {
    SET_WORKOUT(state, workout: IWorkout): void {
        state.workout = workout;
    },

    SET_WORKOUT_VALUE(state, data: { key: "duration"|"name"|"notes"|"public", value: any }): void {
        if (state.workout) Vue.set(state.workout, data.key, data.value)
    },

    SET_PREVIOUS_WORKOUT(state, previousWorkout: IWorkout): void {
        state.previousWorkout = previousWorkout;
    },

    ADD_EXERCISE(state, exercise: IRecordedExercise): void {
        if (state.workout) state.workout.recordedExercises.push(exercise);
    },

    REMOVE_EXERCISE(state, exerciseIndex: number): void {
        if (state.workout) state.workout.recordedExercises.splice(exerciseIndex, 1);
    },

    CHANGE_EXERCISE_ORDER(state, data: { n: number, o: number }): void {
        if (state.workout) {
            state.workout.recordedExercises.splice(
                data.n,
                0,
                state.workout.recordedExercises.splice(data.o, 1)[0]
            );
        }
    },

    SET_EXERCISE_VALUE(state, data: { key: string, value: string, exerciseIndex: number }): void {
        if (state.workout) {
            Vue.set(state.workout.recordedExercises[data.exerciseIndex], data.key, data.value);
        }
    },

    ADD_SET(state, data: { set: IRecordedSet, exerciseIndex: number }): void {
        if (state.workout) state.workout.recordedExercises[data.exerciseIndex].sets.push(data.set);
    },

    REMOVE_SET(state, exerciseIndex: number): void {
        if (state.workout) state.workout.recordedExercises[exerciseIndex].sets.pop();
    },

    SET_SET_VALUE(state, data: { exerciseIndex: number, setIndex: number, key: "weightAmount"|"measureAmount"|"measureBy", value: string }): void {
        if (state.workout) {
            Vue.set(
                state.workout.recordedExercises[data.exerciseIndex].sets[data.setIndex],
                data.key,
                data.value
            );
        }

    },

    SET_EMPTY_WORKOUT(state, value: boolean): void {
        state.emptyWorkout = value;
    },

    SET_IS_FINISHING(state, value: boolean): void {
        state.isFinishing = value;
    },

    SET_WORKOUT_COMMENCED(state, value: boolean): void {
        state.workoutCommenced = value;
    },

    SET_START_TIME(state, startTime: number): void {
        state.startTime = startTime;
    },

    SET_FINISH_TIME(state, finishTime: number): void {
        state.finishTime = finishTime;
    },

    SET_DISPLAY_TOAST(state, value: boolean): void {
        state.displayToast = value;
    },

    SET_INERVAL(state, timer: number): void {
        state.interval = window.setInterval(() => {
            // @ts-ignore
            this.app.$accessor.activeWorkout.SET_TIME_STRING();
        }, timer);
    },

    SET_TIME_STRING(state): void {
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

    RESET_VARIABLES(state): void {
        window.clearInterval(state.interval);

        state.isFinishing = false;
        state.workoutCommenced = false;
        state.workout = undefined;
        state.previousWorkout = undefined;
        (state.emptyWorkout = true), (state.startTime = 0);
        state.finishTime = 0;
        state.interval = undefined;
        state.timeString = "00:00";
        state.displayToast = false;
        state.countdownActive = false;
        state.countdownEndTime = 0;
        state.countdownTimeString = "00:00";
        state.workoutCharts = []
        window.clearInterval(state.countdownInterval);

    },

    SET_TIMER(state, seconds: number): void {
        if (seconds !== 0) {

            state.countdownEndTime = new Date().getTime() + (seconds * 1000);
            state.countdownActive = true;

            state.countdownInterval = window.setInterval(() => {
                // @ts-ignore
                this.app.$accessor.activeWorkout.SET_TIMER();
            }, 1000)
        } else {
            state.countdownActive = false;
            state.countdownTimeString = "00:00";
            state.countdownEndTime = 0;
            window.clearInterval(state.countdownInterval);
        }
    },

    SET_TIMER_STRING(state): void {
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

    PUSH_TO_WORKOUT_CHART(state, options: IChart): void {
        state.workoutCharts.push(options);
    },

    UPDATE_EXERCISE_OPTIONS(state, data: { options: any, exerciseIndex: number }): void {
        console.log("UPDATE EXERCISE OPTIONS:", data);
        if (state.workout) {
            state.workout.recordedExercises[data.exerciseIndex].options = Object.assign({}, state.workout.recordedExercises[data.exerciseIndex].options, data.options)
        }
    },

    SET_INITIAL_URL(state, url): void {
        state.initialUrl = url;
    }
});

export const actions = actionTree({ state, mutations }, {
    async uploadWorkout({ state, commit }): Promise<void> {
        let payload = JSON.parse(JSON.stringify(state.workout));

        payload.duration = state.finishTime - state.startTime;
        payload.uniqueExercises = [];
        payload.recordedExercises.forEach((exercise: IRecordedExercise) => {
            // delete exercise.exerciseReference._id;
            // delete exercise.exerciseReference.createdAt;
            // delete exercise.exerciseReference.updatedAt;
            // delete exercise.exerciseReference.isFollow;

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
                Authorization: await this.app.$accessor.fetchJwtToken({ req: null })
            },
            body: {
                workoutForm: payload
            }
        };

        console.log("WORKOUT PAYLOAD", payload);

        const result = (
            await API.post(this.app.$accessor.apiName, path, myInit).catch(err => {
                console.error("Error uploading result:", err);
            })
        ).data.workout;

        this.app.$accessor.PUSH_WORKOUT_TO_USER_WORKOUTS(result);
        this.app.$accessor.activeWorkout.RESET_VARIABLES()
    }
});