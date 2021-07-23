<template>
    <b-container v-if="!isLoading">
        <b-row align-v="center">
            <b-col sm="8">
                <b-container>
                    <b-card class="newExerciseCard" no-body>
                        <b-card-body>
                            <b-card-title>
                                {{ newExerciseData.name ? newExerciseData.name : oldExerciseData.name }}
                            </b-card-title>
                                <b-form-group label="Name" label-for="nameInput">
                                    <b-form-input id="nameInput" v-model="newExerciseData.name" type="text" placeholder="Exercise Name" required />
                                </b-form-group>
                                <b-form-group label="Image/Video" label-for="imageInput">
                                    <ImageUploader @updateImages="updateImages" @deleteInitImage="deleteInitImage" :initImages="initImages" :inlineDisplay="false" />
                                </b-form-group>
                        </b-card-body>
                    </b-card>

                    <b-card no-body class="descriptionCard">
                        <b-card-body>   
                            <h5>Description</h5>
                            <Editor @change="updateDescription" id="descriptionInput" placeholder="Test" ref="toastuiEditor" :options="editorOptions" height="300px" initialEditType="wysiwyg" :initialValue="oldExerciseData.description" previewStyle="vertical" />
                        </b-card-body>
                    </b-card>
                </b-container>
            </b-col>
            <b-col sm="4">
                <b-container>
                    <b-card class="difficultySelectCard" no-body>
                        <b-card-body>
                            <h5>Difficulty</h5>
                            <DifficultySelector :initDifficulty="oldExerciseData.difficulty" @updateDifficulty="updateDifficulty" />
                        </b-card-body>
                    </b-card>
                    
                    <b-card class="muscleGroupCard" no-body>
                        <b-card-body>
                            <h5>Muscle Groups</h5>
                            <MuscleGroupSelector :initMgs="oldExerciseData.muscleGroups" @updateMuscleGroups="updateMuscleGroups" />
                        </b-card-body>
                    </b-card>

                    <b-card class="tagSelectCard" no-body>
                        <b-card-body>
                            <h5>Add Tags</h5>
                            <TagSelector :initTags="oldExerciseData.tags" @updateTags="updateTags" />
                        </b-card-body>
                    </b-card>
                </b-container>
            </b-col>
        </b-row>
        <b-row class="justify-content-md-center">
            <b-col cols="12" md="auto">
                <b-container class="buttonsCont">
                    <b-button variant="outline-danger" @click="$router.push('/exercises/' + newExerciseData.id)">Cancel</b-button>
                    <b-button variant="outline-primary" @click="updateExercise" :disabled="isUpdating">
                        <span v-if="isUpdating"><b-spinner small/></span>
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
import 'codemirror/lib/codemirror.css'
import '@toast-ui/editor/dist/toastui-editor.css'
import { Editor } from '@toast-ui/vue-editor'

import { API } from 'aws-amplify'

import ImageUploader from '@/components/Utility/ImageUploader.vue'
import MuscleGroupSelector from '@/components/Utility/MuscleGroupSelector.vue'
import DifficultySelector from '@/components/Utility/DifficultySelector.vue'
import TagSelector from '@/components/Utility/TagSelector.vue'

export default {
    name: 'ExerciseNew',
    components: { DifficultySelector, Editor, ImageUploader, MuscleGroupSelector, TagSelector },
    data() {
        return {
            isLoading: true,
            exerciseExists: false,

            oldExerciseData: null,
            newExerciseData: null,

            initImages: [],
            imagesToUpload: [],
            imagesToDelete: [],
            isUpdating: false,

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
        this.downloadExercise();
    },

    beforeRouteUpdate: function(to, from, next) {
        next();
        this.downloadExercise();
    },

    methods: {
        downloadExercise: async function() {
            try {
                this.isLoading = true;
                this.exerciseExists = false;
                this.oldExerciseData = null;
                this.newExerciseData = null;
                
                const path = '/exercise/' + this.$route.params.exerciseid;
                const myInit = {
                    headers: {
                        Authorization: this.$store.state.userProfile.data.signInUserSession.idToken.jwtToken
                    }
                }
    
                const response = await API.get(this.$store.state.apiName, path, myInit);
                this.newExerciseData = response.data;
                this.oldExerciseData = response.data;
    
                if (this.newExerciseData) {
                    this.newExerciseData.filePaths.forEach((url, i) => {
                        this.initImages.push({ id: i, url: url, editable: false, path: this.oldExerciseData.filePaths[i] });
                    })
    
                    this.exerciseExists = true;
                    this.isLoading = false;
                }
            }
            catch (err) {
                console.error(err);
            }
        },

        updateExercise: async function() {
            console.log("Update", this.newExerciseData, this.imagesToUpload, this.imagesToDelete);

            this.isUpdating = true;

            // First delete images. This does not need to be waited for.
            if (this.imagesToDelete.length > 0) {
                this.imagesToDelete.forEach(path => {
                    // TODO: DELETE IMAGES.
                    console.log("Should delete image here", path);
                })
            }

            // Next, loop through our images and upload if need be.
            let path = '/imageupload';
            let imageUploadUrlPromises = [];
            let imageUploadPromises = [];
            this.newExerciseData.filePaths = [];
            this.imagesToUpload.forEach(image => {
                if (!image.path) {
                    const blob = this.dataURLtoBlob(image.url)

                    imageUploadUrlPromises.push(API.get(this.$store.state.apiName, path, {
                        headers: {
                            Authorization: this.$store.state.userProfile.data.signInUserSession.idToken.jwtToken
                        },
                        queryStringParameters: {
                            type: "exercises"
                        }
                    }).then(url => {
                        imageUploadPromises.push(fetch(url, {
                            method: "PUT",
                            headers: {
                                "Content-Type": "application/octet-stream",
                            },
                            body: blob
                        }));
                        
                        return new Promise(resolve => {
                            resolve(url.split("?")[0]);
                        })
                    }));
                } else {
                    // To keep everything in order, create an empty promise.
                    imageUploadUrlPromises.push(new Promise(resolve => {
                        resolve(image.path);
                    }))
                }
            })

            const imageUrls = await Promise.all(imageUploadUrlPromises);

            imageUrls.forEach(url => {
                this.newExerciseData.filePaths.push(url);
            })

            // Now update exercise document.
            path = '/exercise/' + this.$route.params.exerciseid;
            const myInit = {
                headers: {
                    Authorization: this.$store.state.userProfile.data.signInUserSession.idToken.jwtToken
                },
                body: {
                    exerciseForm: this.newExerciseData
                }
            }

            const response = await API.put(this.$store.state.apiName, path, myInit)

            this.isUpadting = false;
            this.$router.push("/exercises/" + response.data._id)
        },

        updateDescription: function() {
            this.newExerciseData.description = this.$refs.toastuiEditor.invoke('getMarkdown')
        },

        updateImages: function(images) {
            this.imagesToUpload = images;
        },

        updateTags: function(tags) {
            this.newExerciseData.tags = tags;
        },

        updateMuscleGroups: function(muscleGroups) {
            this.newExerciseData.muscleGroups = muscleGroups;
        },

        updateDifficulty: function(difficulty) {
            this.newExerciseData.difficulty = difficulty;
        },

        deleteInitImage: function(path) {
            this.imagesToDelete.push(path);
        },

        generateId(n) {
            let randomChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
            let id = '';
            // 7 random characters
            for (let i = 0; i < n; i++) {
                id += randomChars.charAt(Math.floor(Math.random() * randomChars.length));
            }
            return id;
        },

        dataURLtoBlob: function(dataurl) {
            var arr = dataurl.split(','), mime = arr[0].match(/:(.*?);/)[1],
                bstr = atob(arr[1]), n = bstr.length, u8arr = new Uint8Array(n);
            while(n--){
                u8arr[n] = bstr.charCodeAt(n);
            }
            return new Blob([u8arr], {type:mime});
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