<template>
    <b-container>
        <div v-if="workoutCommenced">
            <b-card no-body>
                <b-card-body>
                    <div class="d-flex">
                        <h4>{{ workout.name }}</h4>
                        <div class="ml-auto">{{ timeString }}</div>
                    </div>

                    <b-card-text>
                        <b-form-textarea :value="workout.notes" @input="setWorkoutValue('notes', $event)" rows="3" no-resize placeholder="Add notes..." class="p2 mt-2"></b-form-textarea>
                    </b-card-text>
                </b-card-body>
            </b-card>
            <div class="exercisesCont sortableContainer mb-2">
                <ExerciseRecorder v-for="exercise in workout.exercises" :key="exercise.uid" @addSet="addSet" @removeSet="removeSet" @removeExercise="removeExercise" @setSetValue="setSetValue" :exercise="exercise" :previousExercise="relevantPreviousExercise(exercise.uid)" />
            </div>
            <b-card no-body class="mb-4">
                <b-card-body>
                    <b-card-text>
                        <div class="text-center">
                            <b-button variant="outline-danger" class="mr-1" size="sm" to="/workout">Cancel</b-button>
                            <b-button variant="outline-dark" class="ml-1 mr-1" size="sm" v-b-modal.searchExerciseModal>Add Exercise</b-button>
                            <b-button class="ml-1" variant="outline-success" size="sm" @click="finishWorkout">Finish</b-button>
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

        <b-modal id="startWorkoutModal" 
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
                    <b-list-group-item v-for="(exercise, index) in workout.exercises" :key="index">
                        {{ exercise.name }}
                    </b-list-group-item>
                </b-list-group>
            </div>
            <div v-else>
                <p><em>Start an empty workout</em></p>
            </div>
        </b-modal>

        <b-modal id="endWorkoutModal"
            centered
            @ok="uploadWorkout"
            @hide ="cancelFinish"
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
                <p><em>(Names must be unique to appear seperately in Workout Home).</em></p>
                <b-form-input :value="workout.name" @input="setWorkoutValue('name', $event)"></b-form-input>
            </div>
        </b-modal>
    </b-container>
</template>

<script>
import { templatesCollection, userWorkoutsCollection } from '@/firebase'
import Sortable from 'sortablejs'

import ExerciseRecorder from '@/components/Exercise/ExerciseRecorder.vue'
import ExerciseSearch from '@/components/Exercise/ExerciseSearch.vue'

export default {
    name: 'WorkoutNew',
    components: { ExerciseRecorder, ExerciseSearch },
    data() {
        return {
            isLoading: true,

            // SortableJS
            sortable: null,
            sortableOptions: {
                handle: '.sortableIcon',
                animation: 300,
                onEnd: this.changeOrder
            },

            // Store
            workoutStore: this.$store.state.activeWorkout
        }
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
        }
    },

    beforeRouteUpdate: function(to, from, next) {
        this.resetVariables();
        next();
        this.downloadTemplates();
    },

    created: function() {
        this.downloadTemplates();
    },

    beforeRouteLeave: function(to, from, next) {
        if (this.workoutCommenced && !this.isFinishing) {
            this.$bvModal.msgBoxConfirm('You are in the middle of a workout. Do you want to leave? All progress will be lost.', {
                title: 'Leave Workout?',
                buttonSize: 'sm',
                okVariant: 'danger',
                cancelVariant: 'outline-dark',
                okTitle: 'OK',
                cancelTitle: 'Go Back',
                centered: true
            })
            .then(value => {
                if (value) {
                    next();
                }
            })
            .catch(e => {
                console.error(e);
            })
        } else {
            next();
        }
    },

    methods: {
        downloadTemplates: function() {
            let promises = [];

            // Build to Workout format based on if its a template or workout.
            if (this.$route.query.w) {
                promises.push(templatesCollection().doc(this.$route.query.w).get()
                .then(templateDoc => {
                    let data = templateDoc.data();
                    data.id = templateDoc.id;

                    console.log(this.$store.state);

                    this.$store.commit('activeWorkout/setWorkout', {
                        exercises: data.exercises,
                        template: {
                            id: data.id,
                            name: data.name
                        },
                        name: data.name,
                        notes: "",
                    });

                    console.log("WORKOUT STORE", this.workoutStore.workout);

                    // Generate a unique ID for each exercise (for the keys).
                    // As we may have multiple of the same exercise, can not use ID as key.
                    this.workoutStore.workout.exercises.forEach((exercise, i) => {
                        this.$store.commit('activeWorkout/setExerciseValue', { exerciseIndex: i, key: "uid", value: this.generateId(16) });
                        this.$store.commit('activeWorkout/setExerciseValue', { exerciseIndex: i, key: "notes", value: "" });

                        if (!exercise.sets) {
                            this.$store.commit('activeWorkout/setExerciseValue', { exerciseIndex: i, key: "sets", value: [{
                                kg: 0, 
                                measureAmount: 0, 
                                measureBy: "Reps"
                            }]});
                        }
                    })

                    // Check if user has done this template before (so we can populate previousWorkout).
                    return userWorkoutsCollection(this.$store.state.userProfile.data.uid).where("template.id", "==", this.$route.query.w).orderBy("createdAt", "desc").limit(1).get()
                })
                .then(workoutSnapshot => {
                    if (workoutSnapshot.size > 0) {
                        workoutSnapshot.forEach(workoutDoc => {
                            const data = workoutDoc.data();
                            console.log("WORKOUT DATA:", data);

                            this.$store.commit('activeWorkout/setPreviousWorkout', {
                                exercises: data.exercises,
                                template: {
                                    id: data.template.id,
                                    name: data.template.name
                                },
                                name: data.name,
                                duration: data.duration,
                                notes: data.notes
                            });

                            // Match up previous workout exercises with UID.
                            // First loop through each previous workout exercise (no UID currently set).
                            let i = 0;
                            this.workoutStore.previousWorkout.exercises.forEach(exercise => {
                                // Now pull the index of every occurence of this exercise ID within previous workout exercises (current iterator will be one of these)
                                const prevWorkoutMatchingExercisesIndices = this.workoutStore.previousWorkout.exercises.map((x, i) => x.id === exercise.id ? i : '').filter(String)

                                // Now filter workout exercises to just this exercise.
                                const workoutMatchingExercises = this.workoutStore.workout.exercises.filter(x => x.id === exercise.id);

                                /*
                                * In our array of indices, find what index i is currently at. 
                                * This tells us how many of this exercise ID we have already set the UID for,
                                * So we can ensure to grab the next UID and not duplicate.
                                * i.e. if this is 2, then we have already set the 0th and 1st occurence of exercise.id within
                                * this.workout.exercises and so must now set the second to avoid duplication.
                                * VERY confusing stuff and could probably be cleaner but it works.
                                */  
                                const arrayOfIndicesIndex = prevWorkoutMatchingExercisesIndices.indexOf(i);

                                if (workoutMatchingExercises[arrayOfIndicesIndex]) {
                                    this.workoutStore.previousWorkout.exercises[i].uid = workoutMatchingExercises[arrayOfIndicesIndex].uid;
                                } else {
                                    this.workoutStore.previousWorkout.exercises[i].uid = this.generateId(16)
                                }
                              
                                i ++;
                            })
                            
                        })
                    } else {
                        // User hasn't done this workout before.
                        this.$store.commit('activeWorkout/setPreviousWorkout', JSON.parse(JSON.stringify(this.workoutStore.workout)));

                        this.workoutStore.previousWorkout.exercises.forEach((exercise, i) => {
                            this.$store.commit('activeWorkout/setExerciseValue', { exerciseIndex: i, key: "sets", value: []});
                        })

                        console.log("User hasn't done this template.");
                    }

                    this.$store.commit('activeWrokout/setEmptyWorkout', false);
                }))
            } else if (this.$route.query.b) {
                promises.push(userWorkoutsCollection(this.$store.state.userProfile.data.uid).doc(this.$route.query.b).get()
                .then(workoutDoc => {
                    const data = workoutDoc.data();

                    this.$store.commit('activeWorkout/setWorkout', {
                        exercises: data.exercises,
                        template: {
                            id: data.template.id,
                            name: data.template.name
                        },
                        name: data.name,
                        notes: data.notes
                    });

                    // Generate a unique ID for each exercise (for the keys).
                    // As we may have multiple of the same exercise, can not use ID as key.
                    this.workoutStore.workout.exercises.forEach((exercise, i) => {
                        this.$store.commit('activeWorkout/setExerciseValue', { exerciseIndex: i, key: "uid", value: this.generateId(16) });
                    })

                    this.$store.commit('activeWorkout/previousWorkout', JSON.parse(JSON.stringify(this.workout)))
                    this.$store.commit('activeWrokout/setEmptyWorkout', false);
                }))
            } else {
                this.$store.commit('activeWorkout/setEmptyWorkout', true);

                this.$store.commit('activeWorkout/setWorkout', {
                    exercises: [],
                    name: "Empty Workout",
                    template: {
                        id: "",
                        name: ""
                    },
                    notes: ""
                });

                this.$store.commit('activeWorkout/setPreviousWorkout', {
                    exercises: [],
                    name: "Empty Workout",
                    template: {
                        id: "",
                        name: ""
                    },
                    notes: ""
                });
            }

            Promise.all(promises)
            .then(() => {
                console.log("WORKOUT:", this.workout, "PREV:", this.previousWorkout);
                this.isLoading = false;
                this.$bvModal.show("startWorkoutModal");
            })
        },

        addSet: function(uid, set) {
            const index = this.workout.exercises.findIndex(x => x.uid == uid);
            this.$store.commit('activeWorkout/addSet', { exerciseIndex: index, set: set});
        },

        removeSet: function(uid) {
            const index = this.workout.exercises.findIndex(x => x.uid == uid);
            
            if (this.workout.exercises[index].sets.length > 1) {
                this.$store.commit('activeWorkout/removeSet', index);
            }
        },

        addExercise: function(exercise) {
            this.$store.commit('activeWorkout/addExercise', {
                id: exercise.id,
                name: exercise.name,
                notes: "",
                sets: [{
                    kg: 0,
                    measureAmount: 0,
                    measureBy: exercise.measureBy
                }]
            });

            // Match up with previousWorkout UID (if applicable, else generate new one).

            // Pull the index of every occurence of this exercise within current workout (will include this newly created one).
            const workoutMatchingExercises = this.workoutStore.workout.exercises.filter(x => x.id === exercise.id);

            // Now pull all UIDs from previous workout of this exercise.
            const prevWorkoutMatchingExerciseUIDs = this.workoutStore.previousWorkout.exercises.filter(x => x.id === exercise.id).map(x => x.uid);

            if (workoutMatchingExercises.length > prevWorkoutMatchingExerciseUIDs.length) {
                this.$store.commit('activeWorkout/setExerciseValue', { exerciseIndex: this.workoutStore.workout.exercises.length - 1, key: "uid", value: this.generateId(16) });
            } else {
                // Check if this UID is in place.
                let uidSet = false;
                prevWorkoutMatchingExerciseUIDs.forEach(uid => {
                    console.log("CHECKING ID:", uid, !workoutMatchingExercises.some(x => x.uid === uid), uidSet);
                    if (!workoutMatchingExercises.some(x => x.uid === uid) && !uidSet) {
                        console.log("Changing");
                        this.$store.commit('activeWorkout/setExerciseValue', { exerciseIndex: this.workoutStore.workout.exercises.length - 1, key: "uid", value: uid});
                        uidSet = true;
                    }
                })
            }

            console.log("WORKOUT MATCH:", workoutMatchingExercises, "PREV UIDs:", prevWorkoutMatchingExerciseUIDs);

            this.$bvModal.hide("searchExerciseModal");
        },

        removeExercise: function(uid) {
            const index = this.workout.exercises.findIndex(x => x.uid === uid);
            this.$store.commit('activeWorkout/removeExercise', index);
        },

        changeOrder: function(e) {
            if (e.newIndex !== e.oldIndex) {
                this.$store.commit('activeWorkout/changeExerciseOrder', { n: e.newIndex, o: e.oldIndex });
            }
        },

        resetVariables: function() {
            this.isLoading = true;
            this.$store.commit('activeWorkout/resetVariables');
        },

        startWorkout: function() {
            const now = new Date().getTime();
            this.$store.commit('activeWorkout/setStartTime', now);

            // this.interval = setInterval(() => {
            //     this.timerCount();
            // }, 1000)

            this.$store.commit('activeWorkout/setInterval', 1000);
            this.$store.commit('activeWorkout/setWorkoutCommenced', true);
            
            this.$nextTick(() => { this.sortable = new Sortable(document.querySelector(".sortableContainer"), this.sortableOptions )})
        },

        finishWorkout: function() {
            const now = new Date().getTime();

            this.$store.commit('activeWorkout/setIsFinishing', true);
            this.$store.commit('activeWorkout/setFinishTime', now);

            this.$bvModal.show("endWorkoutModal")
        },

        uploadWorkout: function() {
            this.$store.dispatch('activeWorkout/uploadWorkout', this.$store.state.userProfile.data.uid)
            .then(() => {
                this.$router.push("/workout/recent");
            });
        },

        cancelFinish: function(e) {
            if (e.trigger !== "ok") {
                this.$store.commit('activeWorkout/setIsFinishing', false);
                this.$store.commit('activeWorkout/setFinishTime', 0);
                this.$store.commit('activeWorkout/setTimeString');
            }
        },

        setWorkoutValue: function(key, e) {
            this.$store.commit('activeWorkout/setWorkoutValue', {key: key, value: e});
        },

        setSetValue: function(uid, setIndex, key, value) {
            const exerciseIndex = this.workout.exercises.findIndex(x => x.uid == uid);
            console.log("WORK NEW", uid, setIndex, key, value);
            this.$store.commit('activeWorkout/setSetValue', { exerciseIndex: exerciseIndex, setIndex: setIndex, key: key, value: value });
        },

        preventModal: function(e) {
            if (e.trigger == "backdrop" || e.trigger == "esc" || e.trigger == "headerclose") {
                e.preventDefault();
                console.log("prevented");
            }
        },

        relevantPreviousExercise: function(uid) {
            let temp = this.previousWorkout.exercises.filter(x => x.uid === uid)

            if (temp.length > 0) {
                return temp[0];
            } else {
                return null;
            }
        },

        generateId(n) {
            let randomChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
            let id = '';
            // 7 random characters
            for (let i = 0; i < n; i++) {
                id += randomChars.charAt(Math.floor(Math.random() * randomChars.length));
            }
            return id;
        }
    }
}
</script>