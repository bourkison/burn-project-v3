<template>
    <b-container v-if="!isLoading">
        <b-row align-v="center">
            <b-col sm="8">
                <b-container>
                    <b-card class="newTemplateCard" no-body>
                        <b-card-body>
                            <b-card-title>
                                {{ newTemplateData.name ? newTemplateData.name : oldTemplateData.name }}
                            </b-card-title>
                            <b-form-group label="Name" label-for="nameInput">
                                <b-form-input id="nameInput" v-model="newTemplateData.name" type="text" placeholder="Template Name" required />
                            </b-form-group>
                        </b-card-body>
                    </b-card>

                    <b-card no-body class="exerciseSelectCard">
                        <b-card-body>
                            <h5>Exercises</h5>
                            <ExerciseSelector @updateExercises="updateExercises" :initExercises="oldTemplateData.exercises" />
                        </b-card-body>
                    </b-card>

                    <b-card no-body class="descriptionCard">
                        <b-card-body>
                            <h5>Description</h5>
                            <Editor @change="updateDescription" id="descriptionInput" ref="toastuiEditor" :options="editorOptions" :initialValue="oldTemplateData.description" height="300px" initialEditType="wysiwyg" previewStyle="vertical" />
                        </b-card-body>
                    </b-card>
                </b-container>
            </b-col>

            <b-col sm="4">
                <b-container>
                    <b-card class="difficultySelectCard" no-body>
                        <b-card-body>
                            <h5>Difficulty</h5>
                            <DifficultySelector @updateDifficulty="updateDifficulty" :initDifficulty="oldTemplateData.difficulty" />
                        </b-card-body>
                    </b-card>

                    <b-card class="muscleGroupSelectCard" no-body>
                        <b-card-body>
                            <h5>Muscle Groups</h5>
                            <MuscleGroupSelector @updateMuscleGroups="updateMuscleGroups" :initMgs="oldTemplateData.muscleGroups" />
                        </b-card-body>
                    </b-card>

                    <b-card class="tagSelectCard" no-body>
                        <b-card-body>
                            <h5>Add Tags</h5>
                            <TagSelector @updateTags="updateTags" :initTags="oldTemplateData.tags" />
                        </b-card-body>
                    </b-card>
                </b-container>
            </b-col>
        </b-row>
        <b-row class="justify-content-md-center">
            <b-col cols="12" md="auto">
                <b-container class="buttonsCont">
                    <b-button variant="outline-danger" @click="$router.push('/templates/' + newTemplateData.id)">Cancel</b-button>
                    <b-button variant="outline-primary" @click="updateTemplate" :disabled="isUpdating">
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
import { functions, templatesCollection } from '@/firebase'
import { Editor } from '@toast-ui/vue-editor'

import TagSelector from '@/components/Utility/TagSelector.vue'
import MuscleGroupSelector from '@/components/Utility/MuscleGroupSelector.vue'
import DifficultySelector from '@/components/Utility/DifficultySelector.vue'
import ExerciseSelector from '@/components/Utility/ExerciseSelector.vue'


export default {
    name: 'TemplateEdit',
    components: { Editor, TagSelector, MuscleGroupSelector, DifficultySelector, ExerciseSelector },
    data() {
        return {
            isLoading: true,
            templateExists: false,
            isUpdating: false,

            oldTemplateData: {},
            newTemplateData: {},

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
        this.downloadTemplate();
    },

    beforeRouteUpdate: function() {
        this.downloadTemplate();
    },

    methods: {
        downloadTemplate: function() {
            templatesCollection().doc(this.$route.params.templateid).get()
            .then(templateDoc => {
                if (templateDoc.exists) {
                    this.templateExists = true;

                    this.oldTemplateData = templateDoc.data();
                    this.newTemplateData = templateDoc.data();
                    this.newTemplateData.id = templateDoc.id;

                    this.isLoading = false;
                    console.log(this.oldTemplateData.muscleGroups);
                } else {
                    throw new Error("Template does not exist");
                }
            })
            .catch(e => {
                console.error("Error downloading template", e);
            })
        },

        updateTemplate: function() {
            console.log(this.newTemplateData);
            this.isUpdating = true;

            let updateAlgolia;
            if (this.newTemplateData.name !== this.oldTemplateData.name) {
                updateAlgolia = true;
            } else {
                updateAlgolia = false;
            }

            const editTemplate = functions.httpsCallable("editTemplate");
            editTemplate({ templateForm: this.newTemplateData, updateAlgolia: updateAlgolia })
            .then(result => {
                this.isUpdating = false;
                this.$router.push("/templates/" + result.data.id);
            })
            .catch(e => {
                console.error("Error updating template:", e);
                this.isUpdating = false;
            })
        },

        updateDescription: function() {
            this.newTemplateData.description = this.$refs.toastuiEditor.invoke('getMarkdown');
        },

        updateTags: function(tags) {
            this.newTemplateData.tags = tags;
        },

        updateMuscleGroups: function(muscleGroups) {
            this.newTemplateData.muscleGroups = muscleGroups;
        },

        updateDifficulty: function(difficulty) {
            this.newTemplateData.difficulty = difficulty;
        },

        updateExercises: function(exercises) {
            let temp = [];
            exercises.forEach(exercise => {
                temp.push({ id: exercise.id, name: exercise.name });
            })

            this.newTemplateData.exercises = temp;
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