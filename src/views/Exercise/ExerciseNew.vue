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
                                <b-form-group label="Name" label-for="nameInput">
                                    <b-form-input id="nameInput" v-model="exerciseForm.name" type="text" placeholder="Exercise Name" required />
                                </b-form-group>
                                <b-form-group label="Image/Video" label-for="imageInput">
                                    <ImageUploader @updateImages="updateImages" />
                                </b-form-group>
                        </b-card-body>
                    </b-card>

                    <b-card no-body class="descriptionCard">
                        <b-card-body>   
                            <h5>Description</h5>
                            <Editor @change="updateDescription" id="descriptionInput" placeholder="Test" ref="toastuiEditor" :options="editorOptions" height="300px" initialEditType="wysiwyg" previewStyle="vertical" />
                        </b-card-body>
                    </b-card>
                </b-container>
            </b-col>
            <b-col sm="4">
                <b-container>
                    <b-card class="difficultySelectCard" no-body>
                        <b-card-body>
                            <h5>Select Difficulty</h5>
                            <DifficultySelector @updateDifficulty="updateDifficulty" />
                        </b-card-body>
                    </b-card>
                    
                    <b-card class="muscleGroupCard" no-body>
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
                    <b-button variant="outline-danger">Cancel</b-button>
                    <b-button variant="outline-primary" @click="createExercise" :disabled="isCreating">
                        <span v-if="isCreating"><b-spinner small/></span>
                        <span v-else>Create</span>
                    </b-button>
                </b-container>
            </b-col>
        </b-row>
    </b-container>
</template>

<script>
import 'codemirror/lib/codemirror.css'
import '@toast-ui/editor/dist/toastui-editor.css'
import { Editor } from '@toast-ui/vue-editor'

import { storage, functions } from '@/firebase'

import ImageUploader from '@/components/Utility/ImageUploader.vue'
import MuscleGroupSelector from '@/components/Utility/MuscleGroupSelector.vue'
import DifficultySelector from '@/components/Utility/DifficultySelector.vue'
import TagSelector from '@/components/Utility/TagSelector.vue'

export default {
    name: 'ExerciseNew',
    components: { DifficultySelector, Editor, ImageUploader, MuscleGroupSelector, TagSelector },
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

            imagesToUpload: [],
            isCreating: false,

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
            console.log("Create", this.exerciseForm, this.imagesToUpload);
            this.isCreating = true;

            // Generate an ID.
            this.exerciseForm.id = '';
            this.exerciseForm.id += this.exerciseForm.name.replace(/[^A-Za-z0-9]/g, "").substring(0, 8).toLowerCase();
            if (this.exerciseForm.id.length > 0) {
                this.exerciseForm.id += '-';
            }
            this.exerciseForm.id += this.generateId(16 - this.exerciseForm.id.length);

            // First upload the image files.
            let imageUploadPromises = [];
            this.imagesToUpload.forEach(img => {
                let imageRef = storage.ref("exercises/" + this.exerciseForm.id + "/images/" + Number(new Date()) + "-" + this.generateId(4));
                imageUploadPromises.push(imageRef.putString(img, 'data_url'));
                this.exerciseForm.filePaths.push(imageRef.fullPath);
            })

            // Once images are all uploaded successfully, create the document.
            Promise.all(imageUploadPromises)
            .then(() => {
                const createExercise = functions.httpsCallable("createExercise");
                const user = { username: this.$store.state.userProfile.docData.username, profilePhoto: this.$store.state.userProfile.docData.profilePhoto };

                createExercise({ exerciseForm: this.exerciseForm, user: user })
                .then(result => {
                    this.isCreating = false;
                    console.log(result);
                    this.$router.push("/exercises/" + result.data.id);
                })
                .catch(e => {
                    console.log("Error creating exercise:", e);
                    this.isCreating = false;
                })
            })
            .catch(e => {
                console.log("Error uploading images", e);
                this.isCreating = false;
            })
        },

        updateDescription: function() {
            this.exerciseForm.description = this.$refs.toastuiEditor.invoke('getMarkdown')
        },

        updateImages: function(images) {
            this.imagesToUpload = images;
        },

        updateTags: function(tags) {
            this.exerciseForm.tags = tags;
        },

        updateMuscleGroups: function(muscleGroups) {
            this.exerciseForm.muscleGroups = muscleGroups;
        },

        updateDifficulty: function(difficulty) {
            this.exerciseForm.difficulty = difficulty;
        },

        generateId: function(n) {
            let randomChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
            let id = '';
            // 7 random characters
            for (let i = 0; i < n; i++) {
                id += randomChars.charAt(Math.floor(Math.random() * randomChars.length));
            }
            return id;
        },
    }
}
</script>

<style scoped>
.newExerciseCard,
.muscleGroupCard,
.difficultySelectCard,
.buttonsCont,
.descriptionCard,
.tagSelectCard {
    margin-top: 25px;
}

.buttonsCont button {
    margin: 0 3px;
}
</style>