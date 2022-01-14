<template>
    <b-container>
        <b-row>
            <b-col sm="3">
                <b-card class="navCard" no-body>
                    <b-list-group>
                        <b-list-group-item
                            class="navItem"
                            to="/workout"
                            active-class="unset"
                            exact-active-class="active"
                        >
                            <div class="d-flex align-items-center">
                                Workout
                                <b-icon-house class="ml-auto" />
                            </div>
                        </b-list-group-item>
                        <b-list-group-item
                            class="navItem"
                            to="/workout/recent"
                            active-class="unset"
                            exact-active-class="active"
                        >
                            <div class="d-flex align-items-center">
                                Recent
                                <b-icon-search class="ml-auto" />
                            </div>
                        </b-list-group-item>
                        <b-list-group-item
                            class="navItem"
                            to="/workout/new"
                            active-class="active"
                            exact-active-class="active"
                            v-if="
                                !$store.state.activeWorkout.workoutCommenced ||
                                    $router.currentRoute.name === 'New Workout'
                            "
                        >
                            <div class="d-flex align-items-center">
                                New Workout
                                <b-icon-plus class="ml-auto" />
                            </div>
                        </b-list-group-item>
                        <b-list-group-item
                            v-else
                            class="navItem"
                            :to="$store.state.activeWorkout.initialUrl"
                            active-class="active"
                            exact-active-class="active"
                        >
                            <div class="d-flex align-items-center">
                                Resume Workout
                                <b-icon-play class="ml-auto" />
                            </div>
                        </b-list-group-item>
                    </b-list-group>
                </b-card>
            </b-col>

            <b-col sm="6">
                <b-container class="centerCol">
                    <div v-if="!isLoading">
                        <b-card no-body>
                            <b-card-body>
                                <div class="d-flex align-items">
                                    <h4>{{ workout.name }}</h4>
                                    <div class="d-flex ml-auto">
                                        <div class="text-muted">{{ timeString }}</div>
                                        <div class="ml-1">
                                            <span v-if="!countdownActive"
                                                ><b-icon-stopwatch
                                                    @click="countdownModal = true"
                                                    class="clickableIcon"
                                            /></span>
                                            <span v-else
                                                ><b-icon-stop
                                                    @click="stopTimer"
                                                    class="clickableIcon"
                                            /></span>
                                        </div>
                                        <div class="ml-1" v-if="countdownActive">
                                            {{ countdownTimeString }}
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <b-form-textarea
                                        :value="workout.notes"
                                        @input="setWorkoutValue('notes', $event)"
                                        rows="3"
                                        no-resize
                                        placeholder="Add workout notes..."
                                        class="p2 mt-2 border-white"
                                    ></b-form-textarea>
                                </div>
                            </b-card-body>
                        </b-card>
                        <div class="exercisesCont sortableContainer mb-2">
                            <ExerciseRecorder
                                v-for="exercise in workout.recordedExercises"
                                :key="exercise.uid"
                                @addSet="addSet"
                                @removeSet="removeSet"
                                @removeExercise="removeExercise"
                                @setSetValue="setSetValue"
                                :exercise="exercise"
                                :previousExercise="relevantPreviousExercise(exercise.uid)"
                                @pushChart="pushChart"
                                @updateExerciseOptions="updateExerciseOptions"
                            />
                        </div>
                        <b-card no-body class="mb-4">
                            <b-card-body>
                                <div>
                                    <div class="text-center">
                                        <b-button
                                            variant="outline-danger"
                                            class="mr-1"
                                            size="sm"
                                            @click="cancelWorkout"
                                            >Cancel</b-button
                                        >
                                        <b-button
                                            variant="outline-dark"
                                            class="ml-1 mr-1"
                                            size="sm"
                                            @click="searchExerciseModal = true"
                                            >Add Exercise</b-button
                                        >
                                        <b-button
                                            class="ml-1"
                                            variant="success"
                                            size="sm"
                                            @click="finishWorkout"
                                        >
                                            <span v-if="!isUploading">Finish</span>
                                            <span v-else><b-spinner small /></span>
                                        </b-button>
                                    </div>
                                </div>
                            </b-card-body>
                        </b-card>
                    </div>
                    <div class="text-center" v-else>
                        <b-spinner />
                    </div>

                    <b-modal
                        centered
                        title="Exercises"
                        hide-footer
                        button-size="sm"
                        v-model="searchExerciseModal"
                    >
                        <ExerciseSearch @selectExercise="addExercise" />
                    </b-modal>

                    <b-modal
                        id="startWorkoutModal"
                        ref="startworkoutmodal"
                        v-model="startWorkoutModal"
                        centered
                        @hide="preventModal"
                        @cancel="
                            $router.go(-1);
                            $store.commit('activeWorkout/resetVariables');
                        "
                        @ok="startWorkout"
                        hide-header-close
                        ok-title="Start"
                        ok-variant="success"
                        cancel-title="Go Back"
                        cancel-variant="outline-dark"
                        button-size="sm"
                    >
                        <template #modal-header>
                            <h4 v-if="!emptyWorkout">{{ workout.name }}</h4>
                            <h4 v-else>Empty Workout</h4>
                        </template>
                        <div v-if="!emptyWorkout">
                            <b-list-group>
                                <b-list-group-item
                                    v-for="(recordedExercise, index) in workout.recordedExercises"
                                    :key="index"
                                >
                                    {{ recordedExercise.exerciseReference.name }}
                                </b-list-group-item>
                            </b-list-group>
                        </div>
                        <div v-else>
                            <p><em>Start an empty workout</em></p>
                        </div>
                    </b-modal>

                    <b-modal
                        id="endWorkoutModal"
                        v-model="endWorkoutModal"
                        centered
                        @ok="uploadWorkout"
                        @hide="cancelFinish"
                        ok-title="Finish"
                        ok-variant="success"
                        cancel-title="Go Back"
                        cancel-variant="outline-dark"
                        button-size="sm"
                    >
                        <template #modal-header>
                            <h4>End Workout</h4>
                        </template>

                        <div>
                            <p>Would you like to save this workout under a new name?</p>
                            <p>
                                <em
                                    >(Names must be unique to appear seperately in Workout
                                    Home).</em
                                >
                            </p>
                            <b-form-input
                                :value="workout.name"
                                @input="setWorkoutValue('name', $event)"
                            ></b-form-input>
                        </div>
                    </b-modal>

                    <b-modal
                        id="countdownModal"
                        centered
                        hide-footer
                        size="sm"
                        v-model="countdownModal"
                        title="Timer"
                    >
                        <div>
                            <b-list-group>
                                <b-list-group-item @click="beginTimer(30)" href="#">
                                    <div class="d-flex align-items">
                                        <div>30 seconds</div>
                                        <div class="ml-auto"><b-icon-chevron-right /></div>
                                    </div>
                                </b-list-group-item>
                                <b-list-group-item @click="beginTimer(45)" href="#">
                                    <div class="d-flex align-items">
                                        <div>45 seconds</div>
                                        <div class="ml-auto"><b-icon-chevron-right /></div>
                                    </div>
                                </b-list-group-item>
                                <b-list-group-item @click="beginTimer(60)" href="#">
                                    <div class="d-flex align-items">
                                        <div>60 seconds</div>
                                        <div class="ml-auto"><b-icon-chevron-right /></div>
                                    </div>
                                </b-list-group-item>
                                <b-list-group-item @click="beginTimer(90)" href="#">
                                    <div class="d-flex align-items">
                                        <div>90 seconds</div>
                                        <div class="ml-auto"><b-icon-chevron-right /></div>
                                    </div>
                                </b-list-group-item>
                            </b-list-group>

                            <div class="mt-3">
                                <b-input-group size="sm">
                                    <b-input
                                        type="number"
                                        v-model.number="countdownInput.amount"
                                        size="sm"
                                    />

                                    <b-input-group-addon>
                                        <b-form-select
                                            v-model="countdownInput.unit"
                                            size="sm"
                                            :options="countdownInputOptions"
                                        />
                                    </b-input-group-addon>

                                    <b-input-group-addon>
                                        <b-button variant="success" size="sm" @click="beginTimer()"
                                            ><b-icon-stopwatch
                                        /></b-button>
                                    </b-input-group-addon>
                                </b-input-group>
                            </div>
                        </div>
                    </b-modal>
                </b-container>
            </b-col>

            <b-col sm="3">
                <div class="chartsCont">
                    <div
                        v-for="(chart, index) in workoutStore.workoutCharts"
                        :key="index"
                        class="chart"
                    >
                        <Chart
                            :username="$store.state.userProfile.docData.username"
                            :options="chart"
                            :index="index"
                            position="newWorkoutRightRail"
                            :editable="true"
                            :saveable="false"
                            :persistent="true"
                        />
                    </div>
                </div>
            </b-col>
        </b-row>
    </b-container>
</template>

<script lang="ts">
import Vue from "vue";
import { Chart as TChart } from "@/types";
import { RecordedExercise, RecordedSet, Workout } from "@/types/workout"

import { API } from "aws-amplify";
import Sortable, { SortableOptions, SortableEvent } from "sortablejs";

import ExerciseRecorder from "@/components/Exercise/ExerciseRecorder.vue";
import ExerciseSearch from "@/components/Exercise/ExerciseSearch.vue";
import Chart from "@/components/Charts/Chart.vue";

import { v4 as uuidv4 } from "uuid";
import randomColor from "random-color";
import { Exercise, ExerciseReference } from "~/types/exercise";

interface WorkoutNewData {
    isLoading: boolean;
    isUploading: boolean;
    countdownInput: { amount: number, unit: "second"|"minute" };
    sortable: Sortable;
    sortableOptions: SortableOptions;
    countdownInputOptions: { value: string, text: string }[];
    searchExerciseModal: boolean;
    countdownModal: boolean;
    startWorkoutModal: boolean;
    endWorkoutModal: boolean
}

export default Vue.extend({
    components: { ExerciseRecorder, ExerciseSearch, Chart },
    middleware: ["requiresAuth"],
    data(): WorkoutNewData {
        return {
            isLoading: true,
            isUploading: false,
            countdownInput: {
                amount: 0,
                unit: "second"
            },

            // SortableJS
            sortable: null,
            sortableOptions: {
                handle: ".sortableIcon",
                animation: 300,
                onEnd: this.changeOrder
            },

            // Bootstrap
            countdownInputOptions: [
                { value: "second", text: "seconds" },
                { value: "minute", text: "minutes" }
            ],
            searchExerciseModal: false,
            countdownModal: false,
            startWorkoutModal: false,
            endWorkoutModal: false
        };
    },

    // Set computed properties for store variables.
    // computed: {
    //     isFinishing: {
    //         get() {
    //             return this.$accessor.activeWorkout.isFinishing;
    //         }
    //     },

    //     workoutCommenced: {
    //         get() {
    //             return this.workoutStore.workoutCommenced;
    //         }
    //     },

    //     workout: {
    //         get() {
    //             return this.workoutStore.workout;
    //         }
    //     },

    //     previousWorkout: {
    //         get() {
    //             return this.workoutStore.previousWorkout;
    //         }
    //     },

    //     emptyWorkout: {
    //         get() {
    //             return this.workoutStore.emptyWorkout;
    //         }
    //     },

    //     startTime: {
    //         get() {
    //             return this.workoutStore.startTime;
    //         }
    //     },

    //     finishTime: {
    //         get() {
    //             return this.workoutStore.finishTime;
    //         }
    //     },

    //     timeString: {
    //         get() {
    //             return this.workoutStore.timeString;
    //         }
    //     },

    //     countdownTimeString: {
    //         get() {
    //             return this.workoutStore.countdownTimeString;
    //         }
    //     },

    //     countdownActive: {
    //         get() {
    //             return this.workoutStore.countdownActive;
    //         }
    //     }
    // },

    mounted() {
        this.$store.commit("activeWorkout/setDisplayToast", false);
        this.$accessor.activeWorkout.SET_DISPLAY_TOAST(false);

        if (!this.$accessor.activeWorkout.workoutCommenced) {
            this.downloadTemplates();
        } else {
            this.isLoading = false;
            this.$nextTick(() => {
                this.sortable = new Sortable(
                    document.querySelector(".sortableContainer"),
                    this.sortableOptions
                );
            });
        }
    },

    beforeRouteLeave(to, from, next) {
        if (this.$accessor.activeWorkout.workoutCommenced && !this.$accessor.activeWorkout.isFinishing) {
            this.$accessor.activeWorkout.SET_DISPLAY_TOAST(true)
            next();
        } else {
            next();
        }
    },

    methods: {
        async downloadTemplates(): Promise<void> {
            // Build to Workout format based on if its a template or workout.
            if (this.$route.query.w && typeof this.$route.query.w === "string") {
                const templateDocument = await this.$accessor.api.getTemplate({ templateId: this.$route.query.w, init: {} })

                let recordedExercises: RecordedExercise[] = [];
                let uniqueExercises: string[] = [];
                // Convert template document to workout.
                templateDocument.exerciseReferences.forEach(exerciseReference => {
                    
                    if (exerciseReference._id && uniqueExercises.includes(exerciseReference._id)) {
                        uniqueExercises.push(exerciseReference._id);
                    }

                    recordedExercises.push({
                        uid: uuidv4(),
                        notes: "",
                        sets: [
                            {
                                weightAmount: 0,
                                measureAmount: 0,
                                measureBy: "repsWeight"
                            }
                        ],
                        exerciseReference: exerciseReference,
                        options: {
                            weightUnit: "kg",
                            measureBy: "repsWeight"
                        }
                    });
                });

                this.$accessor.activeWorkout.SET_WORKOUT({
                    recordedExercises: recordedExercises,
                    templateReference: {
                        templateId: templateDocument._id,
                        name: templateDocument.name,
                        muscleGroups: templateDocument.muscleGroups,
                        tags: templateDocument.tags,
                        createdBy: templateDocument.createdBy,
                        createdAt: templateDocument.createdAt
                    },
                    name: templateDocument.name,
                    notes: "",
                    duration: 0,
                    options: {
                        charts: []
                    },
                    uniqueExercises: uniqueExercises,
                    public: true
                });

                // Check if user has done this before.
                const init = {
                    queryStringParameters: {
                        templateId: this.$route.query.w,
                        loadAmount: 1
                    }
                }

                let workoutDocument: Workout | null = null;

                try {
                    workoutDocument = (await this.$accessor.api.queryWorkout({ init }))[0]
                } catch {
                    workoutDocument = null;
                } finally {
                    if (workoutDocument) {
                        this.$accessor.activeWorkout.SET_PREVIOUS_WORKOUT(workoutDocument)

                        // Match up previous workout exercises with UID.
                        // First loop through each previous workout exercises (no UID currently set)
                        let i = 0
                        this.$accessor.activeWorkout.previousWorkout?.recordedExercises.forEach((exercise) => {
                            // Now pull the index of every occurence of this exercise ID within previous workout exercises (current iterator will be one of these)
                            const prevWorkoutMatchingExercisesIndices = this.$accessor.activeWorkout.previousWorkout?.recordedExercises
                                .map((x, i) => (x.exerciseReference.exerciseId === exercise.exerciseReference.exerciseId ? i : ""))
                                .filter(String);

                            // Now filter workout exercises to just this exercise.
                            const workoutMatchingExercises = this.$accessor.activeWorkout.workout?.recordedExercises.filter(
                                x => x.exerciseReference._id === exercise.exerciseReference._id
                            );

                            /*
                             * In our array of indices, find what index i is currently at.
                             * This tells us how many of this exercise ID we have already set the UID for,
                             * So we can ensure to grab the next UID and not duplicate.
                             * i.e. if this is 2, then we have already set the 0th and 1st occurence of exercise.id within
                             * this.workout.exercises and so must now set the second to avoid duplication.
                             * VERY confusing stuff and could probably be cleaner but it works.
                             */
                            
                            const arrayOfIndicesIndex = prevWorkoutMatchingExercisesIndices?.indexOf(
                                i
                            );

                            if (workoutMatchingExercises && arrayOfIndicesIndex && workoutMatchingExercises[arrayOfIndicesIndex]) {
                                if (this.$accessor.activeWorkout.previousWorkout) {
                                    this.$accessor.activeWorkout.previousWorkout.recordedExercises[i].uid =workoutMatchingExercises[arrayOfIndicesIndex].uid;
                                }
                            } else if (this.$accessor.activeWorkout.previousWorkout) {
                                this.$accessor.activeWorkout.previousWorkout.recordedExercises[
                                    i
                                ].uid = uuidv4();
                            }

                            i++;
                        });
                    } else {
                        // User hasn't done this template before.
                        this.$accessor.activeWorkout.SET_PREVIOUS_WORKOUT(JSON.parse(JSON.stringify(this.$accessor.activeWorkout.workout)));
                    }

                    this.$accessor.activeWorkout.SET_EMPTY_WORKOUT(false);
                }
            } else if (this.$route.query.b && typeof this.$route.query.b === "string") {
                const workoutDocument = await this.$accessor.api.getWorkout({ workoutId: this.$route.query.b, init: {} })
                this.$accessor.activeWorkout.SET_WORKOUT({
                    recordedExercises: workoutDocument.recordedExercises,
                    templateReference: workoutDocument.templateReference,
                    name: workoutDocument.name,
                    notes: workoutDocument.notes,
                    duration: 0,
                    options: workoutDocument.options || {},
                    uniqueExercises: workoutDocument.uniqueExercises,
                    public: workoutDocument.public
                })

                // Generate a unique ID for each exercise (for the keys).
                // As we may have multiple of the same exercise, can not use ID as key.
                this.$accessor.activeWorkout.workout?.recordedExercises.forEach((recordedExercise, i) => {
                    this.$accessor.activeWorkout.SET_EXERCISE_VALUE({
                        exerciseIndex: i,
                        key: "uid",
                        value: uuidv4()
                    })
                });

                this.$accessor.activeWorkout.SET_PREVIOUS_WORKOUT(workoutDocument)
                this.$accessor.activeWorkout.SET_EMPTY_WORKOUT(false);
            } else {
                this.$accessor.activeWorkout.SET_EMPTY_WORKOUT(true);

                const workout: Workout = {
                    duration: 0,
                    name: "Empty Workout",
                    notes: "",
                    recordedExercises: [],
                    uniqueExercises: [],
                    templateReference: null,
                    public: true,
                    options: {}
                };

                this.$accessor.activeWorkout.SET_WORKOUT(workout);
                this.$accessor.activeWorkout.SET_WORKOUT(JSON.parse(JSON.stringify(workout)));
            }

            this.isLoading = false;
            this.$nextTick(() => {
                this.buildCharts();
                this.startWorkoutModal = true;
            });
        },

        addSet(uid: string, set: RecordedSet): void {
            const index = this.$accessor.activeWorkout.workout?.recordedExercises.findIndex(x => x.uid == uid);

            if (index !== undefined && index > -1) {
                this.$accessor.activeWorkout.ADD_SET({
                    exerciseIndex: index,
                    set: set
                })
            }
        },

        removeSet(uid: string): void {
            const index = this.$accessor.activeWorkout.workout?.recordedExercises.findIndex(x => x.uid == uid);

            if (index !== undefined && index > -1 && this.$accessor.activeWorkout.workout && this.$accessor.activeWorkout.workout.recordedExercises[index].sets.length > 1) {
                this.$accessor.activeWorkout.REMOVE_SET(index);
            }
        },

        addExercise(exercise: ExerciseReference): void {
            this.$accessor.activeWorkout.ADD_EXERCISE({
                uid: uuidv4(),
                notes: "",
                sets: [
                    {
                        weightAmount: 0,
                        measureAmount: 0,
                        measureBy: "repsWeight"
                    }
                ],
                exerciseReference: exercise,
                options: {
                    measureBy: "repsWeight",
                    weightUnit: "kg"
                }
            })

            // Match up with previousWorkout UID (if applicable, else generate new one).

            // Pull the index of every occurence of this exercise within current workout (will include this newly created one).
            const workoutMatchingExercises = this.$accessor.activeWorkout.workout?.recordedExercises.filter(
                x => x.exerciseReference.exerciseId === exercise.exerciseId
            );

            // Now pull all UIDs from previous workout of this exercise.
            const prevWorkoutMatchingExerciseUIDs = this.$accessor.activeWorkout.previousWorkout?.recordedExercises
                .filter(x => x.exerciseReference.exerciseId === exercise.exerciseId)
                .map(x => x.uid);

            if (this.$accessor.activeWorkout.workout && workoutMatchingExercises && prevWorkoutMatchingExerciseUIDs && workoutMatchingExercises.length > prevWorkoutMatchingExerciseUIDs.length) {
                this.$accessor.activeWorkout.SET_EXERCISE_VALUE({
                    exerciseIndex: this.$accessor.activeWorkout.workout.recordedExercises.length - 1,
                    key: "uid",
                    value: uuidv4()
                })
            } else {
                // Check if this UID is in place.
                let uidSet = false;
                prevWorkoutMatchingExerciseUIDs?.forEach(uid => {
                    if (!workoutMatchingExercises?.some(x => x.uid === uid) && !uidSet && this.$accessor.activeWorkout.workout && uid) {
                        this.$accessor.activeWorkout.SET_EXERCISE_VALUE({
                            exerciseIndex: this.$accessor.activeWorkout.workout.recordedExercises.length - 1,
                            key: "uid",
                            value: uid
                        })

                        uidSet = true;
                    }
                });
            }

            this.searchExerciseModal = false;
        },

        removeExercise(uid: string): void {
            const index = this.$accessor.activeWorkout.workout?.recordedExercises.findIndex(x => x.uid === uid);

            if (index !== undefined && index > -1) {
                this.$accessor.activeWorkout.REMOVE_EXERCISE(index);
            }
        },

        changeOrder(e: SortableEvent): void {
            if (e.newIndex !== e.oldIndex) {
                this.$store.commit("activeWorkout/changeExerciseOrder", {
                    n: e.newIndex,
                    o: e.oldIndex
                });
            }
        },

        resetVariables(): void {
            this.isLoading = true;
            this.$store.commit("activeWorkout/resetVariables");
        },

        startWorkout(): void {
            const now = new Date().getTime();
            this.$accessor.activeWorkout.SET_START_TIME(now);
            this.$accessor.activeWorkout.SET_INTERVAL(1000);
            this.$accessor.activeWorkout.SET_WORKOUT_COMMENCED(true);

            this.$nextTick(() => {
                const el = document.getElementById("sortable-container");
                if (el) {
                    this.sortable = new Sortable(el,this.sortableOptions);
                }
            });

            this.$store.commit("activeWorkout/setInitialUrl", this.$route.fullPath);
        },

        cancelWorkout(): void {
            // @ts-ignore
            this.$bvModal
                .msgBoxConfirm(
                    "You are in the middle of a workout. Do you want to leave? All progress will be lost.",
                    {
                        title: "Leave Workout?",
                        buttonSize: "sm",
                        okVariant: "danger",
                        cancelVariant: "outline-dark",
                        okTitle: "OK",
                        cancelTitle: "Go Back",
                        centered: true
                    }
                )
                .then((value: boolean) => {
                    if (value) {
                        this.$accessor.activeWorkout.RESET_VARIABLES();
                        this.$router.push("/workout");
                    }
                });
        },

        finishWorkout(): void {
            const now = new Date().getTime();
            this.$accessor.activeWorkout.SET_IS_FINISHING(true);
            this.$accessor.activeWorkout.SET_FINISH_TIME(now);
            this.endWorkoutModal = true;
        },

        async uploadWorkout(): Promise<void> {
            this.isUploading = true;
            await this.$accessor.activeWorkout.uploadWorkout();
            this.$router.push("/workout/recent");
        },

        cancelFinish(e: any): void {
            if (e.trigger !== "ok") {
                this.$accessor.activeWorkout.SET_IS_FINISHING(false);
                this.$accessor.activeWorkout.SET_FINISH_TIME(0);
                this.$accessor.activeWorkout.SET_TIME_STRING();
            }
        },

        setWorkoutValue(key: "name"|"duration"|"notes"|"public", e: any): void {
            this.$accessor.activeWorkout.SET_WORKOUT_VALUE({
                key: key,
                value: e
            })
        },

        setSetValue(uid: string, setIndex: number, key: "weightAmount"|"measureAmount"|"measureBy", value: any): void {
            const exerciseIndex = this.$accessor.activeWorkout.workout?.recordedExercises.findIndex(x => x.uid == uid);

            if (exerciseIndex !== undefined && exerciseIndex > -1) {
                this.$accessor.activeWorkout.SET_SET_VALUE({
                    exerciseIndex: exerciseIndex,
                    setIndex: setIndex,
                    key: key,
                    value: (key !== "measureBy") ? Number(value.replace(/[^.\d]/g, "")) || 0 : value
                })
            }
        },

        preventModal(e: any): void {
            if (e.trigger == "backdrop" || e.trigger == "esc" || e.trigger == "headerclose") {
                e.preventDefault();
                console.log("prevented");
            }
        },

        relevantPreviousExercise(uid: string): RecordedExercise | null {
            let temp = this.$accessor.activeWorkout.previousWorkout?.recordedExercises.filter(x => x.uid === uid);

            if (temp && temp.length > 0) {
                return temp[0];
            } else {
                return null;
            }
        },

        beginTimer(n?: number): void {
            let seconds = n;
            console.log(seconds);

            if (!seconds) {
                seconds = this.countdownInput.amount;
                console.log(seconds);

                if (this.countdownInput.unit === "minute") {
                    seconds = seconds * 60;
                }
            }

            this.$accessor.activeWorkout.SET_TIMER(seconds);
            this.countdownModal = false;
        },

        stopTimer(): void {
            this.$accessor.activeWorkout.SET_TIMER(0);
        },

        buildCharts(): void {
            if (this.$accessor.activeWorkout.workout) {
                for (let i = 0; i < 2 && i < this.$accessor.activeWorkout.workout.recordedExercises.length; i++) {
                    this.pushChart(this.$accessor.activeWorkout.workout.recordedExercises[i].exerciseReference);
                }
            }
        },

        pushChart(exerciseReference: ExerciseReference): void {
            let chartOptions = {
                chartType: "exercise",
                interval: "day",
                data: {
                    exercise: exerciseReference,
                    dataToPull: "orm"
                },
                startDate: {
                    unit: "week",
                    amount: 5,
                    date: null
                },
                endDate: {
                    unit: "day",
                    amount: 0,
                    date: null
                },
                backgroundColor: randomColor().hexString(),
                borderColor: randomColor().hexString(),
                pointBackgroundColor: randomColor().hexString()
            } as TChart;

            this.$accessor.activeWorkout.PUSH_TO_WORKOUT_CHARTS(chartOptions)
        },

        updateExerciseOptions(uid: string, data: any) {
            const exerciseIndex = this.$accessor.activeWorkout.workout?.recordedExercises.findIndex(x => x.uid == uid);

            if (exerciseIndex !== undefined && exerciseIndex > -1) {
                this.$store.commit("activeWorkout/updateExerciseOptions", {
                    exerciseIndex: exerciseIndex,
                    options: data
                });
            }
        }
    }
});
</script>

<style scoped>
.align-items {
    align-items: center !important;
}

.clickableIcon {
    cursor: pointer;
}

.centerCol,
.navCard,
.chartsCont {
    margin-top: 40px;
}

.chart {
    margin-bottom: 25px;
}
</style>
