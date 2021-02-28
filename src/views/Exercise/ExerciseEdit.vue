<template>
    <b-container v-if="!isLoading">
        <b-row align-v="center">
            <b-col sm="8">
                <b-container>
                    <b-card class="newExerciseCard" no-body>
                        <b-card-body>
                            <b-card-title>
                                {{ newExerciseData.name ? newExerciseData.name : 'Update Exercise' }}
                            </b-card-title>
                                <b-form-group label="Name" label-for="nameInput">
                                    <b-form-input id="nameInput" v-model="newExerciseData.name" type="text" placeholder="Exercise Name" required />
                                </b-form-group>
                                <b-form-group label="Image/Video" label-for="imageInput">
                                    <ImageUploader @updateImages="updateImages" @deleteInitImage="deleteInitImage" :initImages="initImages" />
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

import { storage, db, functions } from '@/firebase'

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

            oldExerciseData: {},
            nexExerciseData: {},

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
        downloadExercise: function() {
            db.collection("exercises").doc(this.$route.params.exerciseid).get()
            .then(exerciseDoc => {
                if (exerciseDoc.exists) {
                    this.exerciseExists = true;

                    this.oldExerciseData = exerciseDoc.data();
                    this.newExerciseData = exerciseDoc.data();
                    this.newExerciseData.id = exerciseDoc.id;

                    // Download images
                    let imageDownloadPromises = [];
                    this.oldExerciseData.filePaths.forEach(file => {
                        imageDownloadPromises.push(storage.ref(file).getDownloadURL());
                    })

                    return Promise.all(imageDownloadPromises)
                } else {
                    throw new Error("Image does not exist");
                }
            })
            .then(urls => {
                let i = 0;
                urls.forEach(url => {
                    this.initImages.push({id: i, url: url, editable: false, path: this.oldExerciseData.filePaths[i]});
                    i ++;
                })

                this.isLoading = false;
            })
            .catch(e => {
                console.error(e);
            })
        },

        updateExercise: function() {
            console.log("Update", this.newExerciseData, this.imagesToUpload, this.imagesToDelete);

            this.isUpdating = true;

            // First delete images. This does not need to be waited for.
            if (this.imagesToDelete.length > 0) {
                this.imagesToDelete.forEach(path => {
                    storage.ref(path).delete()
                    .catch(e => {
                        console.error("Error deleting image", e);
                    })
                })
            }

            // Next, loop through our images and upload if need be.
            let imageUploadPromises = [];
            this.newExerciseData.filePaths = [];
            this.imagesToUpload.forEach(image => {
                if (!image.path) {
                    const imageRef = storage.ref("exercises/" + this.$route.params.exerciseid + "/images/" + Number(new Date()) + "-" + this.generateId(4));
                    this.newExerciseData.filePaths.push(imageRef.fullPath);

                    imageUploadPromises.push(imageRef.putString(image.url, 'data_url'));
                } else {
                    this.newExerciseData.filePaths.push(image.path);
                }
            })

            Promise.all(imageUploadPromises)
            .then(() => {
                // Update Algolia based on if name is different.
                let updateAlgolia;
                if (this.newExerciseData.name !== this.oldExerciseData.name) {
                    updateAlgolia = true;
                } else {
                    updateAlgolia = false;
                }

                console.log("Uploaded images.", this.newExerciseData, updateAlgolia);

                const editExercise = functions.httpsCallable("editExercise");
                return editExercise({ exerciseForm: this.newExerciseData, updateAlgolia: updateAlgolia })
            })
            .then(result => {
                this.isUpdating = false;
                this.$router.push("/exercises/" + result.data.id);
            })
            .catch(e => {
                console.error("Error updating exercise", e);
                this.isUpdating = false;
            })


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