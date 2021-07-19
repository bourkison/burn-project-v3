<template>
    <b-container>
        <b-row align-v="center">
            <b-col sm="8">
                <b-container>
                    <b-card class="newTemplateCard" no-body>
                        <b-card-body>
                            <b-card-title>
                                {{ templateForm.name ? templateForm.name : 'New Template' }}
                            </b-card-title>
                            <b-form-group label="Name" label-for="nameInput">
                                <b-form-input id="nameInput" v-model="templateForm.name" type="text" placeholder="Template Name" required />
                            </b-form-group>
                        </b-card-body>
                    </b-card>

                    <b-card no-body class="exerciseSelectCard">
                        <b-card-body>
                            <h5>Exercises</h5>
                            <ExerciseSelector @updateExercises="updateExercises" />
                        </b-card-body>
                    </b-card>

                    <b-card no-body class="descriptionCard">
                        <b-card-body>
                            <h5>Description</h5>
                            <Editor @change="updateDescription" id="descriptionInput" ref="toastuiEditor" :options="editorOptions" height="300px" initialEditType="wysiwyg" previewStyle="vertical" />
                        </b-card-body>
                    </b-card>
                </b-container>
            </b-col>

            <b-col sm="4">
                <b-container>
                    <b-card class="difficultySelectCard" no-body>
                        <b-card-body>
                            <h5>Difficulty</h5>
                            <DifficultySelector @updateDifficulty="updateDifficulty" />
                        </b-card-body>
                    </b-card>

                    <b-card class="muscleGroupSelectCard" no-body>
                        <b-card-body>
                            <h5>Muscle Groups</h5>
                            <MuscleGroupSelector @updateMuscleGroups="updateMuscleGroups" />
                        </b-card-body>
                    </b-card>

                    <b-card class="tagSelectCard" no-body>
                        <b-card-body>
                            <h5>Add Tags</h5>
                            <TagSelector @updateTags="updateTags" />
                        </b-card-body>
                    </b-card>
                </b-container>
            </b-col>
        </b-row>
        <b-row class="justify-content-md-center">
            <b-col cols="12" md="auto">
                <b-container class="buttonsCont">
                    <b-button variant="outline-danger" @click="$router.push('/templates/')">Cancel</b-button>
                    <b-button variant="outline-primary" @click="createTemplate" :disabled="isCreating">
                        <span v-if="isCreating"><b-spinner small /></span>
                        <span v-else>Create</span>
                    </b-button>
                </b-container>
            </b-col>
        </b-row>
    </b-container>
</template>

<script>
import { Editor } from '@toast-ui/vue-editor'
import { functions }  from '@/firebase'

import ExerciseSelector from '@/components/Utility/ExerciseSelector.vue'
import DifficultySelector from '@/components/Utility/DifficultySelector.vue'
import MuscleGroupSelector from '@/components/Utility/MuscleGroupSelector.vue'
import TagSelector from '@/components/Utility/TagSelector.vue'

export default {
    name: 'TemplateNew',
    components: { Editor, DifficultySelector, TagSelector, ExerciseSelector, MuscleGroupSelector },
    data() {
        return {
            isLoading: true,
            isCreating: false,
            templateForm: {
                name: '',
                description: '',
                exercises: [],
                difficulty: 1,
                muscleGroups: [],
                tags: []
            },

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

    methods: {
        createTemplate: function() {
            this.isCreating = true;

            const createTemplate = functions.httpsCallable("createTemplate");
            const user = { username: this.$store.state.userProfile.docData.username, id: this.$store.state.userProfile.data.uid, profilePhoto: this.$store.state.userProfile.docData.profilePhoto };

            createTemplate({ templateForm: this.templateForm, user: user })
            .then(result => {
                this.isCreating = false;
                this.$router.push("/templates/" + result.data.id);
            })
            .catch(e => {
                console.log("Error creating template:", e);
                this.isCreating = false;
            })
        },

        updateDescription: function() {
            this.templateForm.description = this.$refs.toastuiEditor.invoke('getMarkdown');
        },

        updateDifficulty: function(difficulty) {
            this.templateForm.difficulty = difficulty;
        },

        updateTags: function(tags) {
            this.templateForm.tags = tags;
        },

        updateMuscleGroups: function(mgs) {
            this.templateForm.muscleGroups = mgs;
        },

        updateExercises: function(exercises) {
            let temp = [];
            exercises.forEach(exercise => {
                temp.push({ id: exercise.id, name: exercise.name })
            })

            this.templateForm.exercises = temp;
        }
    }
}
</script>

<style scoped>
.newTemplateCard,
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