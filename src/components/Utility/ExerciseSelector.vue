<template>
    <div v-if="!isLoading">
        <b-container>
            <div v-if="createdExercises.length > 0">
                <h6>My Exercises</h6>
                <b-list-group class="exerciseLists">
                    <b-list-group-item class="d-flex" align-v="center" v-for="exercise in createdExercises" :key="exercise.id" @click="addExercise(exercise)" href="#" :id="'exercise-' + exercise.id">
                        <span>{{ exercise.name }}</span>
                        <b-icon-plus font-scale="1.2" class="ml-auto"/>
                    </b-list-group-item>
                </b-list-group>
            </div>
            <div v-if="followedExercises.length > 0">
                <h6>Followed Exercises</h6>
                <b-list-group class="exerciseLists">
                    <b-list-group-item class="d-flex" align-v="center" v-for="exercise in followedExercises" :key="exercise.id" @click="addExercise(exercise)" href="#" :id="'exercise-' + exercise.id">
                        <span>{{ exercise.name }}</span>
                        <b-icon-plus font-scale="1.2" class="ml-auto" />    
                    </b-list-group-item>
                </b-list-group>
            </div>
            <div v-if="selectedExercises.length > 0">
                <h6>Selected Exercises</h6>
                <b-list-group class="exerciseLists" id="selectedContainer">
                    <b-list-group-item class="d-flex" align-v="center" v-for="exercise in selectedExercises" :key="exercise.id" @click="removeExercise(exercise)" href="#">
                        <span>{{ exercise.name }}</span>
                        <span class="ml-auto" />
                            <b-icon-x font-scale="1.2" class="ml-auto"/>
                            <b-icon-grip-horizontal font-scale="1.2" class="sortableHandle" />
                    </b-list-group-item>
                </b-list-group>
            </div>
        </b-container>
    </div>
    <div v-else>

    </div>
</template>

<script>
import { db } from '@/firebase'
import Sortable from 'sortablejs'

export default {
    name: 'ExerciseSelector',
    data() {
        return {
            isLoading: true,


            createdExercises: [],
            followedExercises: [],
            selectedExercises: [],

            sortable: null,
            sortableOptions: {
                handle: '.sortableHandle',
                animation: 300,
                onEnd: this.changeOrder
            },
        }
    },

    created: function() {
        let exerciseDownloadPromises = [];
    
        db.collection("users").doc(this.$store.state.userProfile.data.uid).collection("exercises").get()
        .then(exerciseSnapshot => {
            exerciseSnapshot.forEach(exerciseDoc => {
                let userExerciseData = exerciseDoc.data();
                userExerciseData.id = exerciseDoc.id;
                
                if (userExerciseData.isFollow) {
                    exerciseDownloadPromises.push(db.collection("exercises").doc(userExerciseData.id).get().then(exerciseDoc => {
                        let exerciseData = exerciseDoc.data();
                        exerciseData.id = exerciseDoc.id;

                        this.followedExercises.push(exerciseData);
                    }))
                } else {
                    exerciseDownloadPromises.push(db.collection("exercises").doc(userExerciseData.id).get().then(exerciseDoc => {
                        let exerciseData = exerciseDoc.data();
                        exerciseData.id = exerciseDoc.id;

                        this.createdExercises.push(exerciseData);
                    }))
                }
            })

            return Promise.all(exerciseDownloadPromises);
        })
        .then(() => {
            this.isLoading = false;
        })
    },

    methods: {
        addExercise: function(exercise) {
            if (this.selectedExercises.findIndex(x => x.id === exercise.id) < 0) {
                document.querySelector("#exercise-" + exercise.id).classList.add("active");
                this.selectedExercises.push(exercise);
            } else {
                this.removeExercise(exercise);
            }
        },

        removeExercise: function(exercise) {
            let index = this.selectedExercises.findIndex(x => x.id === exercise.id);
            this.selectedExercises.splice(index, 1);

            document.querySelector("#exercise-" + exercise.id).classList.remove("active");
        },

        changeOrder: function(e) {
            console.log(e);
            if (e.newIndex !== e.oldIndex) {
                this.selectedExercises.splice(e.newIndex, 0, this.selectedExercises.splice(e.oldIndex, 1)[0]);
            }
        }
    },

    watch: {
        selectedExercises: function(n) {
            if (n.length > 0 && !this.sortable) {
                this.$nextTick(() => { this.sortable = new Sortable(document.querySelector("#selectedContainer"), this.sortableOptions) });
            } else if (n.length == 0 && this.sortable) {
                this.sortable = null;
            }

            this.$emit("updateExercises", this.selectedExercises);
        }
    }
}
</script>

<style scoped>
.exerciseLists {
    padding: 0 20px;
    margin: 15px 0;
}

.sortableHandle:hover {
    cursor: pointer;
}
</style>