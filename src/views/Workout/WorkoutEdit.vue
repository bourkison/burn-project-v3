<template>
    <b-container v-if="!isLoading">
        <b-row align-v="center">
            <b-col sm="8">
                <b-container>
                    <b-card class="newWorkoutCard" no-body>
                        <b-card-body>
                            <b-card-title>
                                {{ newWorkoutData.name ? newWorkoutData.name : oldWorkoutData.name }}
                            </b-card-title>
                            <b-form-group label="Name" label-for="nameInput">
                                <b-form-input id="nameInput" v-model="newWorkoutData.name" type="text" placeholder="Workout Name" required />
                            </b-form-group>
                        </b-card-body>
                    </b-card>

                    <b-card no-body class="exerciseSelectCard">
                        <b-card-body>
                            <h5>Exercises</h5>
                            <ExerciseSelector @updateExercises="updateExercises" :initExercises="oldWorkoutData.exercises" />
                        </b-card-body>
                    </b-card>

                    <b-card no-body class="descriptionCard">
                        <b-card-body>
                            <h5>Description</h5>
                            <Editor @change="updateDescription" id="descriptionInput" ref="toastuiEditor" :options="editorOptions" :initialValue="oldWorkoutData.description" height="300px" initialEditType="wysiwyg" previewStyle="vertical" />
                        </b-card-body>
                    </b-card>
                </b-container>
            </b-col>

            <b-col sm="4">
                <b-container>
                    <b-card class="difficultySelectCard" no-body>
                        <b-card-body>
                            <h5>Difficulty</h5>
                            <DifficultySelector @updateDifficulty="updateDifficulty" :initDifficulty="oldWorkoutData.difficulty" />
                        </b-card-body>
                    </b-card>

                    <b-card class="muscleGroupSelectCard" no-body>
                        <b-card-body>
                            <h5>Muscle Groups</h5>
                            <MuscleGroupSelector @updateMuscleGroups="updateMuscleGroups" :initMgs="oldWorkoutData.muscleGroups" />
                        </b-card-body>
                    </b-card>

                    <b-card class="tagSelectCard" no-body>
                        <b-card-body>
                            <h5>Add Tags</h5>
                            <TagSelector @updateTags="updateTags" :initTags="oldWorkoutData.tags" />
                        </b-card-body>
                    </b-card>
                </b-container>
            </b-col>
        </b-row>
        <b-row class="justify-content-md-center">
            <b-col cols="12" md="auto">
                <b-container class="buttonsCont">
                    <b-button variant="outline-danger" @click="$router.push('/workouts/' + newWorkoutData.id)">Cancel</b-button>
                    <b-button variant="outline-primary" @click="updateWorkout" :disabled="isUpdating">
                        <span v-if="isUpdating"><b-spinner small /></span>
                        <span v-else>Update</span>
                    </b-button>
                </b-container>
            </b-col>
        </b-row>
    </b-container>
    <b-container v-else>
        <b-spinner />
    </b-container>
</template>

<script>
import { db, functions } from '@/firebase'
import { Editor } from '@toast-ui/vue-editor'

import TagSelector from '@/components/Utility/TagSelector.vue'
import MuscleGroupSelector from '@/components/Utility/MuscleGroupSelector.vue'
import DifficultySelector from '@/components/Utility/DifficultySelector.vue'
import ExerciseSelector from '@/components/Utility/ExerciseSelector.vue'


export default {
    name: 'WorkoutEdit',
    components: { Editor, TagSelector, MuscleGroupSelector, DifficultySelector, ExerciseSelector },
    data() {
        return {
            isLoading: true,
            workoutExists: false,
            isUpdating: false,

            oldWorkoutData: {},
            newWorkoutData: {},

            // Editor:
            editorOptions: {
                minHeight: '300px',
                language: 'en-US',
                hideModeSwitch: true,
                usageStatistics: false,
                toolbarItems: [
                    'heading',
                    'bold',
                    'italic',
                    'divider',
                    'link',
                    'ul',
                    'ol',
                    'quote',
                    'divider',
                    'indent',
                    'outdent',
                    'hr'
                ]
            }
        }
    },

    created: function() {
        this.downloadWorkout();
    },

    beforeRouteUpdate: function() {
        this.downloadWorkout();
    },

    methods: {
        downloadWorkout: function() {
            db.collection("workouts").doc(this.$route.params.workoutid).get()
            .then(workoutDoc => {
                if (workoutDoc.exists) {
                    this.workoutExists = true;

                    this.oldWorkoutData = workoutDoc.data();
                    this.newWorkoutData = workoutDoc.data();
                    this.newWorkoutData.id = workoutDoc.id;

                    this.isLoading = false;
                    console.log(this.oldWorkoutData.muscleGroups);
                } else {
                    throw new Error("Workout does not exist");
                }
            })
            .catch(e => {
                console.error("Error downloading workout", e);
            })
        },

        updateWorkout: function() {
            console.log(this.newWorkoutData);
            this.isUpdating = true;

            let updateAlgolia;
            if (this.newWorkoutData.name !== this.oldWorkoutData.name) {
                updateAlgolia = true;
            } else {
                updateAlgolia = false;
            }

            const editWorkout = functions.httpsCallable("editWorkout");
            editWorkout({ workoutForm: this.newWorkoutData, updateAlgolia: updateAlgolia })
            .then(result => {
                this.isUpdating = false;
                this.$router.push("/workouts/" + result.data.id);
            })
            .catch(e => {
                console.error("Error updating workout:", e);
                this.isUpdating = false;
            })
        },

        updateDescription: function() {
            this.newWorkoutData.description = this.$refs.toastuiEditor.invoke('getMarkdown');
        },

        updateTags: function(tags) {
            this.newWorkoutData.tags = tags;
        },

        updateMuscleGroups: function(muscleGroups) {
            this.newWorkoutData.muscleGroups = muscleGroups;
        },

        updateDifficulty: function(difficulty) {
            this.newWorkoutData.difficulty = difficulty;
        },

        updateExercises: function(exercises) {
            let temp = [];
            exercises.forEach(exercise => {
                temp.push({ id: exercise.id, name: exercise.name });
            })

            this.newWorkoutData.exercises = temp;
        }
    }
}
</script>

<style scoped>
.newWorkoutCard,
.descriptionCard,
.difficultySelectCard,
.tagSelectCard,
.exerciseSelectCard,
.muscleGroupSelectCard {
    margin-top: 25px;
}

.buttonsCont {
    margin: 25px 0;
}

.buttonsCont button {
    margin: 0 3px;
}
</style>