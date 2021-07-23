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
                                    <ImageUploader @updateImages="updateImages" :inlineDisplay="false" />
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
                            <h5>Difficulty</h5>
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
                    <b-button variant="outline-danger" @click="$router.push('/exercises/')">Cancel</b-button>
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

import { API, Storage } from 'aws-amplify'

import crypto from 'crypto'
import util from 'util'

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
        createExercise: async function() {
            this.isCreating = true;

            // First upload all images.
            // Cannot use forEach so instead use .map : https://stackoverflow.com/questions/37576685/using-async-await-with-a-foreach-loop
            // As await does not work in forEach.
            const imageResults = await Promise.all(this.imagesToUpload.map(async (image, i) => {
                const imageId = await this.generateId(16);
                const imageName = "username/" + this.$store.state.userProfile.docData.username + "/exercises/" + imageId;
                
                const imageData = await fetch(image.url);
                const blob = await imageData.blob();

                console.log("UPLOADING:", imageName, blob);

                const imageResponse = await Storage.put(imageName, blob, {
                    contentType: blob.type,
                    progressCallback: function(progress) {
                        console.log("Image:", i, progress.loaded / progress.total, progress);
                    }
                }).catch(err => {
                    console.error("Error uploading image:", i, err);
                })

                return imageResponse;
            }))

            console.log("Image Results:", imageResults);

            const path = '/exercise'
            const myInit = {
                headers: {
                    "Authorization": this.$store.state.userProfile.data.signInUserSession.idToken.jwtToken
                },
                body: {
                    exerciseForm: JSON.parse(JSON.stringify(this.exerciseForm))
                }
            }

            const response = await API.post(this.$store.state.apiName, path, myInit).catch(err => { 
                this.isCreating = false; 
                alert(err.message || JSON.stringify(err));
                return;
            });


            console.log("CREATION SUCCESS:", response);
            this.$router.push("/exercises/" + response._id);
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

        generateId: async function(n) {
            const randomBytes = util.promisify(crypto.randomBytes)
            const rawBytes = await randomBytes(n);

            const hex = await rawBytes.toString('hex');
            return hex;
        }
    }
}
</script>

<style scoped>
.newExerciseCard,
.muscleGroupCard,
.difficultySelectCard,
.descriptionCard,
.tagSelectCard {
    margin-top: 25px;
}

.buttonsCont {
    margin: 25px 0;
}

.buttonsCont button {
    margin: 0 3px;
}
</style>