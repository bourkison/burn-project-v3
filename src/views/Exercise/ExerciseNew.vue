<template>
    <b-container>
        <b-row align-v="center">
            <b-col sm="8">
                <b-container>
                    <b-card class="newExerciseCard" no-body>
                        <b-card-body>
                            <b-card-title>
                                {{ exerciseForm.name ? exerciseForm.name : 'New Exercise' }}
                            </b-card-title>
                            <b-form @submit.prevent="createExercise">
                                <b-form-group label="Name" label-for="nameInput">
                                    <b-form-input id="nameInput" v-model="exerciseForm.name" type="text" placeholder="Exercise Name" required />
                                </b-form-group>
                                <Editor @change="updateDescription" placeholder="Test" ref="toastuiEditor" :options="editorOptions" height="300px" initialEditType="wysiwyg" previewStyle="vertical" />
                                <b-button type="Submit">Submit</b-button>
                            </b-form>
                        </b-card-body>
                    </b-card>
                </b-container>
            </b-col>
            <b-col sm="4">
                <b-container>
                    <b-card class="muscleGroupCard" no-body>
                        <b-card-body>
                            <h5>Muscle Groups</h5>
                            <MuscleGroupSelector />
                        </b-card-body>
                    </b-card>

                    <b-card class="difficultySelectCard" no-body>
                        <b-card-body>
                            <h5>Select Difficulty</h5>
                            <DifficultySelector />
                        </b-card-body>
                    </b-card>
                </b-container>
            </b-col>
        </b-row>
    </b-container>
</template>

<script>
import 'codemirror/lib/codemirror.css';
import '@toast-ui/editor/dist/toastui-editor.css';
import { Editor } from '@toast-ui/vue-editor';

import MuscleGroupSelector from '@/components/Utility/MuscleGroupSelector.vue';
import DifficultySelector from '@/components/Utility/DifficultySelector.vue'

export default {
    name: 'ExerciseNew',
    components: { DifficultySelector, Editor, MuscleGroupSelector },
    data() {
        return {
            exerciseForm: {
                name: '',
                description: '',
                muscleGroups: [],
                difficulty: 1,
                filePaths: [],
                measureBy: 'Reps',
                tags: []
            },

            isCreating: true,

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
        createExercise: function() {
            console.log("Create");
        },

        updateDescription: function() {
            this.exerciseForm.description = this.$refs.toastuiEditor.invoke('getMarkdown')
        }
    }
}
</script>

<style scoped>
.newExerciseCard,
.muscleGroupCard,
.difficultySelectCard {
    margin-top: 25px;
}
</style>