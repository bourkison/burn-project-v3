<template>
    <b-container>
        <div v-if="!isLoading">
            <b-card no-body>
                <b-card-body>
                    <div class="d-flex align-items">
                        <h4>{{ workout.name }}</h4>
                        <div class="d-flex ml-auto">
                            <div class="text-muted">{{ timeString }}</div>
                            <div class="ml-1"><b-icon-stopwatch @click="countdownModal = true" class="clickableIcon" /></div>
                            <div class="ml-1" v-if="countdownActive">{{ countdownTimeString }}</div>
                        </div>
                    </div>

                    <b-card-text>
                        <b-form-textarea
                            :value="workout.notes"
                            @input="setWorkoutValue('notes', $event)"
                            rows="3"
                            no-resize
                            placeholder="Add workout notes..."
                            class="p2 mt-2 border-white"
                        ></b-form-textarea>
                    </b-card-text>
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
                />
            </div>
            <b-card no-body class="mb-4">
                <b-card-body>
                    <b-card-text>
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
                                v-b-modal.searchExerciseModal
                                >Add Exercise</b-button
                            >
                            <b-button
                                class="ml-1"
                                variant="success"
                                size="sm"
                                @click="finishWorkout"
                                >Finish</b-button
                            >
                        </div>
                    </b-card-text>
                </b-card-body>
            </b-card>
        </div>
        <div class="text-center" v-else>
            <b-spinner />
        </div>

        <b-modal id="searchExerciseModal" centered title="Exercises" hide-footer button-size="sm">
            <ExerciseSearch @selectExercise="addExercise" />
        </b-modal>

        <b-modal
            id="startWorkoutModal"
            ref="startworkoutmodal"
            centered
            @hide="preventModal"
            @cancel="$router.push('/workout')"
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
                    <em>(Names must be unique to appear seperately in Workout Home).</em>
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
                        <b-input type="number" v-model.number="countdownInput.amount" size="sm" />
                        
                        <b-input-group-addon>
                            <b-form-select v-model="countdownInput.unit" size="sm" :options="countdownInputOptions" />
                        </b-input-group-addon>

                        <b-input-group-addon>
                            <b-button variant="success" size="sm" @click="beginTimer()"><b-icon-stopwatch /></b-button>
                        </b-input-group-addon>
                    </b-input-group>
                </div>
            </div>

        </b-modal>
    </b-container>
</template>

<script>
import { API } from "aws-amplify";
import Sortable from "sortablejs";

import ExerciseRecorder from "@/components/Exercise/ExerciseRecorder.vue";
import ExerciseSearch from "@/components/Exercise/ExerciseSearch.vue";

export default {
    name: "WorkoutNew",
    components: { ExerciseRecorder, ExerciseSearch },
    data() {
        return {
            isLoading: true,
            countdownModal: false,
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

            // Store
            workoutStore: this.$store.state.activeWorkout,

            // Bootstrap
            countdownInputOptions: [
                { value: "second", text: "seconds" },
                { value: "minute", text: "minutes" }
            ]
        };
    },

    // Set computed properties for store variables.
    computed: {
        isFinishing: {
            get() {
                return this.workoutStore.isFinishing;
            }
        },

        workoutCommenced: {
            get() {
                return this.workoutStore.workoutCommenced;
            }
        },

        workout: {
            get() {
                return this.workoutStore.workout;
            }
        },

        previousWorkout: {
            get() {
                return this.workoutStore.previousWorkout;
            }
        },

        emptyWorkout: {
            get() {
                return this.workoutStore.emptyWorkout;
            }
        },

        startTime: {
            get() {
                return this.workoutStore.startTime;
            }
        },

        finishTime: {
            get() {
                return this.workoutStore.finishTime;
            }
        },

        timeString: {
            get() {
                return this.workoutStore.timeString;
            }
        },

        countdownTimeString: {
            get() {
                return this.workoutStore.countdownTimeString;
            }
        },

        countdownActive: {
            get() {
                return this.workoutStore.countdownActive;
            }
        }
    },

    beforeRouteUpdate: function(to, from, next) {
        // this.resetVariables();
        // this.downloadTemplates();
        next();
    },

    created: function() {
        this.$store.commit("activeWorkout/setDisplayToast", false);

        if (!this.workoutStore.workoutCommenced) {
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

    beforeRouteLeave: function(to, from, next) {
        if (this.workoutCommenced && !this.isFinishing) {
            this.$store.commit("activeWorkout/setDisplayToast", true);
            next();
        } else {
            next();
        }
    },

    methods: {
        downloadTemplates: async function() {
            // Build to Workout format based on if its a template or workout.
            if (this.$route.query.w) {
                let path = "/template/" + this.$route.query.w;
                let myInit = {
                    headers: {
                        Authorization: await this.$store.dispatch("fetchJwtToken")
                    }
                };

                const templateDocument = (
                    await API.get(this.$store.state.apiName, path, myInit).catch(err => {
                        throw err;
                    })
                ).data;

                let recordedExercises = [];

                templateDocument.exerciseReferences.forEach(exerciseReference => {
                    recordedExercises.push({
                        uid: this.generateId(16),
                        notes: "",
                        sets: [
                            {
                                kg: 0,
                                measureAmount: 0,
                                measureBy: "kg"
                            }
                        ],
                        exerciseReference: {
                            exerciseId: exerciseReference.exerciseId,
                            name: exerciseReference.name,
                            muscleGroups: exerciseReference.muscleGroups,
                            tags: exerciseReference.tags
                        }
                    });
                });

                this.$store.commit("activeWorkout/setWorkout", {
                    recordedExercises: recordedExercises,
                    templateReference: {
                        templateId: templateDocument._id,
                        name: templateDocument.name,
                        muscleGroups: templateDocument.muscleGroups,
                        tags: templateDocument.tags
                    },
                    name: templateDocument.name,
                    notes: "",
                    duration: 0
                });

                // Check if user has done this before.
                path = "/workout";
                myInit.queryStringParameters = {
                    templateId: this.$route.query.w,
                    loadAmount: 1
                };

                let workoutDocument;

                try {
                    workoutDocument = (await API.get(this.$store.state.apiName, path, myInit))
                        .data[0];
                } catch {
                    workoutDocument = null;
                } finally {
                    if (workoutDocument) {
                        this.$store.commit("activeWorkout/setPreviousWorkout", workoutDocument);

                        // Match up previous workout exercises with UID.
                        // First loop through each previous workout exercises (no UID currently set)
                        let i = 0;
                        this.workoutStore.previousWorkout.recordedExercises.forEach(exercise => {
                            // Now pull the index of every occurence of this exercise ID within previous workout exercises (current iterator will be one of these)
                            const prevWorkoutMatchingExercisesIndices = this.workoutStore.previousWorkout.recordedExercises
                                .map((x, i) => (x.id === exercise.id ? i : ""))
                                .filter(String);

                            // Now filter workout exercises to just this exercise.
                            const workoutMatchingExercises = this.workoutStore.workout.recordedExercises.filter(
                                x => x.id === exercise.id
                            );

                            /*
                             * In our array of indices, find what index i is currently at.
                             * This tells us how many of this exercise ID we have already set the UID for,
                             * So we can ensure to grab the next UID and not duplicate.
                             * i.e. if this is 2, then we have already set the 0th and 1st occurence of exercise.id within
                             * this.workout.exercises and so must now set the second to avoid duplication.
                             * VERY confusing stuff and could probably be cleaner but it works.
                             */

                            const arrayOfIndicesIndex = prevWorkoutMatchingExercisesIndices.indexOf(
                                i
                            );

                            if (workoutMatchingExercises[arrayOfIndicesIndex]) {
                                this.workoutStore.previousWorkout.recordedExercises[i].uid =
                                    workoutMatchingExercises[arrayOfIndicesIndex].uid;
                            } else {
                                this.workoutStore.previousWorkout.recordedExercises[
                                    i
                                ].uid = this.generateId(16);
                            }

                            i++;
                        });
                    } else {
                        // User hasn't done this template before.
                        this.$store.commit(
                            "activeWorkout/setPreviousWorkout",
                            JSON.parse(JSON.stringify(this.workoutStore.workout))
                        );
                    }

                    this.$store.commit("activeWorkout/setEmptyWorkout", false);
                }
            } else if (this.$route.query.b) {
                let path = "/workout/" + this.$route.query.b;
                let myInit = {
                    headers: {
                        Authorization: await this.$store.dispatch("fetchJwtToken")
                    }
                };

                const workoutDocument = (
                    await API.get(this.$store.state.apiName, path, myInit).catch(err => {
                        throw err;
                    })
                ).data;

                console.log("WORKOUT DOCUMENT:", workoutDocument);

                this.$store.commit("activeWorkout/setWorkout", {
                    recordedExercises: workoutDocument.recordedExercises,
                    templateReference: workoutDocument.templateReference,
                    name: workoutDocument.name,
                    notes: workoutDocument.notes,
                    duration: 0
                });

                // Generate a unique ID for each exercise (for the keys).
                // As we may have multiple of the same exercise, can not use ID as key.
                this.workoutStore.workout.recordedExercises.forEach((recordedExercise, i) => {
                    this.$store.commit("activeWorkout/setExerciseValue", {
                        exerciseIndex: i,
                        key: "uid",
                        value: this.generateId(16)
                    });
                });

                this.$store.commit(
                    "activeWorkout/setPreviousWorkout",
                    JSON.parse(JSON.stringify(this.workout))
                );

                this.$store.commit("activeWorkout/setEmptyWorkout", false);
            } else {
                console.log("EMPTY WORKOUT");
                this.$store.commit("activeWorkout/setEmptyWorkout", true);

                const workout = {
                    duration: 0,
                    name: "Empty Workout",
                    notes: "",
                    recordedExercises: []
                };

                this.$store.commit("activeWorkout/setWorkout", JSON.parse(JSON.stringify(workout)));
                this.$store.commit(
                    "activeWorkout/setPreviousWorkout",
                    JSON.parse(JSON.stringify(workout))
                );
            }

            this.isLoading = false;
            this.$nextTick(() => {
                this.$refs["startworkoutmodal"].show();
            });
        },

        addSet: function(uid, set) {
            const index = this.workout.recordedExercises.findIndex(x => x.uid == uid);
            this.$store.commit("activeWorkout/addSet", {
                exerciseIndex: index,
                set: set
            });
        },

        removeSet: function(uid) {
            const index = this.workout.recordedExercises.findIndex(x => x.uid == uid);

            if (this.workout.recordedExercises[index].sets.length > 1) {
                this.$store.commit("activeWorkout/removeSet", index);
            }
        },

        addExercise: function(exercise) {
            this.$store.commit("activeWorkout/addExercise", {
                uid: this.generateId(16),
                notes: "",
                sets: [
                    {
                        kg: 0,
                        measureAmount: 0,
                        measureBy: "kg"
                    }
                ],
                exerciseReference: exercise
            });

            // Match up with previousWorkout UID (if applicable, else generate new one).

            // Pull the index of every occurence of this exercise within current workout (will include this newly created one).
            const workoutMatchingExercises = this.workoutStore.workout.recordedExercises.filter(
                x => x.exerciseReference.exerciseId === exercise.exerciseId
            );

            // Now pull all UIDs from previous workout of this exercise.
            const prevWorkoutMatchingExerciseUIDs = this.workoutStore.previousWorkout.recordedExercises
                .filter(x => x.exerciseReference.exerciseId === exercise.exerciseId)
                .map(x => x.uid);

            if (workoutMatchingExercises.length > prevWorkoutMatchingExerciseUIDs.length) {
                this.$store.commit("activeWorkout/setExerciseValue", {
                    exerciseIndex: this.workoutStore.workout.recordedExercises.length - 1,
                    key: "uid",
                    value: this.generateId(16)
                });
            } else {
                // Check if this UID is in place.
                let uidSet = false;
                prevWorkoutMatchingExerciseUIDs.forEach(uid => {
                    console.log(
                        "CHECKING ID:",
                        uid,
                        !workoutMatchingExercises.some(x => x.uid === uid),
                        uidSet
                    );
                    if (!workoutMatchingExercises.some(x => x.uid === uid) && !uidSet) {
                        console.log("Changing");
                        this.$store.commit("activeWorkout/setExerciseValue", {
                            exerciseIndex: this.workoutStore.workout.recordedExercises.length - 1,
                            key: "uid",
                            value: uid
                        });
                        uidSet = true;
                    }
                });
            }

            console.log(
                "WORKOUT MATCH:",
                workoutMatchingExercises,
                "PREV UIDs:",
                prevWorkoutMatchingExerciseUIDs
            );

            this.$bvModal.hide("searchExerciseModal");
        },

        removeExercise: function(uid) {
            const index = this.workout.recordedExercises.findIndex(x => x.uid === uid);
            this.$store.commit("activeWorkout/removeExercise", index);
        },

        changeOrder: function(e) {
            if (e.newIndex !== e.oldIndex) {
                this.$store.commit("activeWorkout/changeExerciseOrder", {
                    n: e.newIndex,
                    o: e.oldIndex
                });
            }
        },

        resetVariables: function() {
            this.isLoading = true;
            this.$store.commit("activeWorkout/resetVariables");
        },

        startWorkout: function() {
            const now = new Date().getTime();
            this.$store.commit("activeWorkout/setStartTime", now);

            // this.interval = setInterval(() => {
            //     this.timerCount();
            // }, 1000)

            this.$store.commit("activeWorkout/setInterval", 1000);
            this.$store.commit("activeWorkout/setWorkoutCommenced", true);

            this.$nextTick(() => {
                this.sortable = new Sortable(
                    document.querySelector(".sortableContainer"),
                    this.sortableOptions
                );
            });
        },

        cancelWorkout: function() {
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
                .then(value => {
                    if (value) {
                        this.$store.commit("activeWorkout/resetVariables");
                        this.$router.push("/workout");
                    }
                })
        },

        finishWorkout: function() {
            const now = new Date().getTime();

            this.$store.commit("activeWorkout/setIsFinishing", true);
            this.$store.commit("activeWorkout/setFinishTime", now);

            this.$bvModal.show("endWorkoutModal");
        },

        uploadWorkout: function() {
            this.$store.dispatch("activeWorkout/uploadWorkout").then(() => {
                this.$router.push("/workout/recent");
            });
        },

        cancelFinish: function(e) {
            if (e.trigger !== "ok") {
                this.$store.commit("activeWorkout/setIsFinishing", false);
                this.$store.commit("activeWorkout/setFinishTime", 0);
                this.$store.commit("activeWorkout/setTimeString");
            }
        },

        setWorkoutValue: function(key, e) {
            this.$store.commit("activeWorkout/setWorkoutValue", {
                key: key,
                value: e
            });
        },

        setSetValue: function(uid, setIndex, key, value) {
            const exerciseIndex = this.workout.recordedExercises.findIndex(x => x.uid == uid);
            console.log("WORK NEW", uid, setIndex, key, value);
            this.$store.commit("activeWorkout/setSetValue", {
                exerciseIndex: exerciseIndex,
                setIndex: setIndex,
                key: key,
                value: value
            });
        },

        preventModal: function(e) {
            if (e.trigger == "backdrop" || e.trigger == "esc" || e.trigger == "headerclose") {
                e.preventDefault();
                console.log("prevented");
            }
        },

        relevantPreviousExercise: function(uid) {
            let temp = this.previousWorkout.recordedExercises.filter(x => x.uid === uid);

            if (temp.length > 0) {
                return temp[0];
            } else {
                return null;
            }
        },

        generateId: function(n) {
            let randomChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
            let id = "";
            // 7 random characters
            for (let i = 0; i < n; i++) {
                id += randomChars.charAt(Math.floor(Math.random() * randomChars.length));
            }
            return id;
        },

        beginTimer: function(n) {
            let seconds = n;
            console.log(seconds);

            if (!seconds) {
                seconds = this.countdownInput.amount;
                console.log(seconds);

                if (this.countdownInput.unit === "minute") {
                    seconds = seconds * 60;
                }
            }

            this.$store.commit("activeWorkout/setTimer", seconds);
            this.countdownModal = false;
        }
    }
};
</script>

<style scoped>
    .align-items {
        align-items: center !important;
    }

    .clickableIcon {
        cursor: pointer;
    }
</style>