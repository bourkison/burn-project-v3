<template>
    <b-container>
        <div v-if="workoutCommenced">
            <b-card no-body>
                <b-card-body>
                    <div class="d-flex">
                        <h4>{{ burn.name }}</h4>
                        <div class="ml-auto">{{ timeString }}</div>
                    </div>

                    <b-card-text>
                        <b-form-textarea v-model="burn.notes" rows="3" no-resize placeholder="Add notes..." class="p2 mt-2"></b-form-textarea>
                    </b-card-text>
                </b-card-body>
            </b-card>
            <div class="exercisesCont sortableContainer mb-2">
                <ExerciseRecorder v-for="exercise in burn.exercises" :key="exercise.uid" @addSet="addSet" @removeSet="removeSet" @removeExercise="removeExercise" :exercise="exercise" :previousExercise="relevantPreviousBurn(exercise.uid)" />
            </div>
            <b-card no-body class="mb-4">
                <b-card-body>
                    <b-card-text>
                        <div class="text-center">
                            <b-button variant="outline-danger" class="mr-1" size="sm" to="/burn">Cancel</b-button>
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
            @cancel="$router.push('/burn')"
            @ok="startWorkout"
            hide-header-close 
            ok-title="Start" 
            ok-variant="success" 
            cancel-title="Go Back" 
            cancel-variant="outline-dark" 
            button-size="sm"
        >
            <template #modal-header>
                <h4 v-if="!emptyBurn">{{ burn.name }}</h4>
                <h4 v-else>Empty Burn</h4>
            </template>
            <div v-if="!emptyBurn">
                <b-list-group>
                    <b-list-group-item v-for="(exercise, index) in burn.exercises" :key="index">
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
                <p>Would you like to save this burn under a new name?</p>
                <p><em>(Names must be unique to appear seperately in Burn Home).</em></p>
                <b-form-input v-model="burn.name"></b-form-input>
            </div>
        </b-modal>
    </b-container>
</template>

<script>
import { db } from '@/firebase'
import Sortable from 'sortablejs'

import ExerciseRecorder from '@/components/Exercise/ExerciseRecorder.vue'
import ExerciseSearch from '@/components/Exercise/ExerciseSearch.vue'

export default {
    name: 'BurnNew',
    components: { ExerciseRecorder, ExerciseSearch },
    data() {
        return {
            isLoading: true,
            isFinishing: false,
            workoutCommenced: false,

            burn: {},
            previousBurn: {},
            emptyBurn: true,

            startTime: 0,
            finishTime: 0,
            interval: null,
            timeString: '00:00',

            // SortableJS
            sortable: null,
            sortableOptions: {
                handle: '.sortableIcon',
                animation: 300,
                onEnd: this.changeOrder
            },
        }
    },

    beforeRouteUpdate: function(to, from, next) {
        this.resetVariables();
        next();
        this.downloadWorkouts();
    },

    created: function() {
        this.downloadWorkouts();
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
        downloadWorkouts: function() {
            let promises = [];

            // Build to Burn format based on if its a workout or burn.
            if (this.$route.query.w) {
                promises.push(db.collection("workouts").doc(this.$route.query.w).get()
                .then(workoutDoc => {
                    let data = workoutDoc.data();
                    data.id = workoutDoc.id;

                    this.burn = {
                        exercises: data.exercises,
                        workout: {
                            id: data.id,
                            name: data.name
                        },
                        name: data.name,
                        notes: "",
                    }

                    // Generate a unique ID for each exercise (for the keys).
                    // As we may have multiple of the same exercise, can not use ID as key.
                    this.burn.exercises.forEach(exercise => {
                        exercise.uid = this.generateId(16);
                    })

                    // Check if user has done this workout before (so we can populate previousBurn).
                    return db.collection("users").doc(this.$store.state.userProfile.data.uid).collection("burns").where("workout.id", "==", this.$route.query.w).orderBy("createdAt", "desc").limit(1).get()
                })
                .then(burnSnapshot => {
                    if (burnSnapshot.size > 0) {
                        burnSnapshot.forEach(burnDoc => {
                            const data = burnDoc.data();
                            console.log("BURN DATA:", data);

                            this.previousBurn = {
                                exercises: data.exercises,
                                workout: {
                                    id: data.workout.id,
                                    name: data.workout.name
                                },
                                name: data.name,
                                duration: data.duration,
                                notes: data.notes
                            }

                            // Match up previous burn exercises with UID.
                            // First loop through each previous burn exercise (no UID currently set).
                            let i = 0;
                            this.previousBurn.exercises.forEach(exercise => {
                                // Now pull the index of every occurence of this exercise ID within previous burn exercises (current iterator will be one of these)
                                const prevBurnMatchingExercisesIndices = this.previousBurn.exercises.map((x, i) => x.id === exercise.id ? i : '').filter(String)

                                // Now filter burn exercises to just this exercise.
                                const burnMatchingExercises = this.burn.exercises.filter(x => x.id === exercise.id);

                                /*
                                * In our array of indices, find what index i is currently at. 
                                * This tells us how many of this exercise ID we have already set the UID for,
                                * So we can ensure to grab the next UID and not duplicate.
                                * i.e. if this is 2, then we have already set the 0th and 1st occurence of exercise.id within
                                * this.burn.exercises and so must now set the second to avoid duplication.
                                * VERY confusing stuff and could probably be cleaner but it works.
                                */  
                                const arrayOfIndicesIndex = prevBurnMatchingExercisesIndices.indexOf(i);

                                if (burnMatchingExercises[arrayOfIndicesIndex]) {
                                    this.previousBurn.exercises[i].uid = burnMatchingExercises[arrayOfIndicesIndex].uid;
                                } else {
                                    this.previousBurn.exercises[i].uid = this.generateId(16)
                                }
                              
                                i ++;
                            })
                            
                        })
                    } else {
                        // User hasn't done this burn before.
                        this.previousBurn = JSON.parse(JSON.stringify(this.burn));
                    }

                    this.emptyBurn = false;
                }))
            } else if (this.$route.query.b) {
                promises.push(db.collection("users").doc(this.$store.state.userProfile.data.uid).collection("burns").doc(this.$route.query.b).get()
                .then(burnDoc => {
                    const data = burnDoc.data();
                    const data2 = burnDoc.data();

                    this.burn = {
                        exercises: data.exercises,
                        workout: {
                            id: data.workout.id,
                            name: data.workout.name
                        },
                        name: data.name,
                        notes: data.notes
                    },

                    this.previousBurn = {
                        exercises: data2.exercises,
                        workout: {
                            id: data2.workout.id,
                            name: data2.workout.name
                        },
                        name: data2.name,
                        duration: data2.duration,
                        notes: data2.notes
                    }

                    // Generate a unique ID for each exercise (for the keys).
                    // As we may have multiple of the same exercise, can not use ID as key.
                    this.burn.exercises.forEach(exercise => {
                        exercise.uid = this.generateId(16);
                    })

                    this.previousBurn.exercises.forEach(exercise => {
                        exercise.uid = this.generateId(16);
                    })

                    this.emptyBurn = false;
                }))
            } else {
                this.emptyBurn = true;
                this.burn = {
                    exercises: [],
                    name: "Empty Workout",
                    notes: ""
                }

                this.previousBurn = {
                    exercises: [],
                    name: "Empty Workout",
                    notes: ""
                }
            }

            Promise.all(promises)
            .then(() => {
                console.log("BURN:", this.burn, "PREV:", this.previousBurn);
                this.isLoading = false;
                this.$bvModal.show("startWorkoutModal");
            })
        },

        addSet: function(uid, set) {
            const index = this.burn.exercises.findIndex(x => x.uid == uid);
            this.burn.exercises[index].sets.push(set);
        },

        removeSet: function(uid) {
            const index = this.burn.exercises.findIndex(x => x.uid == uid);
            
            if (this.burn.exercises[index].sets.length > 1) {
                this.burn.exercises[index].sets.pop();
            }
        },

        addExercise: function(exercise) {
            this.burn.exercises.push({
                id: exercise.id,
                name: exercise.name,
                notes: "",
                sets: [{
                    kg: 0,
                    measureAmount: 0,
                    measureBy: exercise.measureBy
                }],
                uid: this.generateId(16)
            })

            this.$bvModal.hide("searchExerciseModal");
        },

        removeExercise: function(uid) {
            const index = this.burn.exercises.findIndex(x => x.uid === uid);
            this.burn.exercises.splice(index, 1);
        },

        changeOrder: function(e) {
            if (e.newIndex !== e.oldIndex) {
                this.burn.exercises.splice(e.newIndex, 0, this.burn.exercises.splice(e.oldIndex, 1)[0]);
            }
        },

        resetVariables: function() {
            this.isLoading = true;
            this.burn = {};
            this.previousBurn = {};
            this.timeString = '';
        },

        startWorkout: function() {
            this.startTime = new Date().getTime();

            this.interval = setInterval(() => {
                this.timerCount();
            }, 1000)

            this.workoutCommenced = true;
            
            this.$nextTick(() => { this.sortable = new Sortable(document.querySelector(".sortableContainer"), this.sortableOptions )})
        },

        finishWorkout: function() {
            this.isFinishing = true;
            this.finishTime = new Date().getTime();
            this.$bvModal.show("endWorkoutModal")
        },

        uploadWorkout: function() {
            // Set the burn up correctly.
            let payload = JSON.parse(JSON.stringify(this.burn));

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
            })

            payload.createdAt = new Date();
            payload.duration = this.finishTime - this.startTime;

            // Upload the burn.
            db.collection("users").doc(this.$store.state.userProfile.data.uid).collection("burns").add(payload)
            .then(() => {
                this.$router.push("/burn/recent");
            })
            .catch(e => {
                console.error(e);
            })
        },

        cancelFinish: function() {
            this.isFinishing = false;
            this.finishTime = 0;
            this.timerCount();
        },

        timerCount: function() {
            const now = new Date().getTime();
            let duration = now - this.startTime;

            let hours = Math.floor((duration % (1000 * 60 * 60 * 24)) / (1000 * 60 * 24));
            let minutes = (Math.floor((duration % (1000 * 60 * 60)) / (1000 * 60))).toLocaleString('en-US', { minimumIntegerDigits: 2, useGrouping: false });
            let seconds = (Math.floor((duration % (1000 * 60)) / 1000)).toLocaleString('en-US', { minimumIntegerDigits: 2, useGrouping: false });

            if (!this.isFinishing) {
                if (!hours) {
                    this.timeString = minutes + ":" + seconds;
                } else {
                    this.timeString = hours + ":" + minutes + ":" + seconds;
                }
            }
        },

        preventModal: function(e) {
            if (e.trigger == "backdrop" || e.trigger == "esc" || e.trigger == "headerclose") {
                e.preventDefault();
                console.log("prevented");
            }
        },

        relevantPreviousBurn: function(uid) {
            let temp = this.previousBurn.exercises.filter(x => x.uid === uid)

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