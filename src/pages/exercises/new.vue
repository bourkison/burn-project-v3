<template>
    <b-container>
        <b-row align-v="center">
            <b-col sm="8">
                <b-container>
                    <b-card class="newExerciseCard" no-body>
                        <b-card-body>
                            <b-card-title>
                                {{ exerciseForm.name ? exerciseForm.name : "New Exercise" }}
                            </b-card-title>
                            <b-form-group label="Name" label-for="nameInput">
                                <b-form-input
                                    id="nameInput"
                                    v-model="exerciseForm.name"
                                    type="text"
                                    placeholder="Exercise Name"
                                    required
                                />
                            </b-form-group>
                            <b-form-group label="Image/Video" label-for="imageInput">
                                <ImageUploader
                                    @updateImages="updateImages"
                                    @updateVideo="updateVideo"
                                    :inlineDisplay="false"
                                />
                            </b-form-group>
                        </b-card-body>
                    </b-card>

                    <b-card no-body class="descriptionCard">
                        <b-card-body>
                            <h5>Description</h5>
                            <client-only>
                                <TextEditor @input="updateDescription" />
                            </client-only>
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
                    <b-button variant="outline-danger" @click="$router.push('/exercises/')"
                        >Cancel</b-button
                    >
                    <b-button
                        variant="outline-primary"
                        @click="createExercise"
                        :disabled="isCreating"
                    >
                        <span v-if="isCreating"><b-spinner small/></span>
                        <span v-else>Create</span>
                    </b-button>
                </b-container>
            </b-col>
        </b-row>

        <b-alert
            class="position-fixed fixed-bottom m-0 rounded-0"
            variant="danger"
            dismissible
            fade
            style="z-index: 2000;"
            v-model="errorCountdown"
        >
            {{ errorMessage }}
        </b-alert>
    </b-container>
</template>

<script>
import { API, graphqlOperation, Storage } from "aws-amplify";
import { createVideoObject, createVodAsset } from "@/graphql/mutations";

import ImageUploader from "@/components/Utility/ImageUploader.vue";
import MuscleGroupSelector from "@/components/Utility/MuscleGroupSelector.vue";
import DifficultySelector from "@/components/Utility/DifficultySelector.vue";
import TagSelector from "@/components/Utility/TagSelector.vue";
import TextEditor from "@/components/TextEditor/TextEditor.vue"

import { v4 as uuidv4 } from "uuid";
import awsvideoconfig from "@/aws-video-exports.js";

export default {
    name: "ExerciseNew",
    components: {
        DifficultySelector,
        ImageUploader,
        MuscleGroupSelector,
        TagSelector,
        TextEditor
    },
    data() {
        return {
            exerciseForm: {
                name: "",
                description: "",
                muscleGroups: [],
                difficulty: 1,
                filePaths: [],
                measureBy: "Reps",
                tags: []
            },

            imagesToUpload: [],
            videoToUpload: null,
            isCreating: false,

            // Editor:
            editorOptions: {
                minHeight: "300px",
                language: "en-US",
                hideModeSwitch: true,
                usageStatistics: false,
                toolbarItems: [
                    "heading",
                    "bold",
                    "italic",
                    "divider",
                    "link",
                    "ul",
                    "ol",
                    "quote",
                    "divider",
                    "indent",
                    "outdent",
                    "hr"
                ]
            },

            // Errror handling:
            errorCountdown: 0,
            errorMessage: "",
            errorInterval: null
        };
    },
    head() {
        return {
            title: "Burn · New Exercise"
        }
    },

    methods: {
        async createExercise() {
            this.isCreating = true;

            if (this.imagesToUpload.length) {
                // First upload all images.
                // Cannot use forEach so instead use .map : https://stackoverflow.com/questions/37576685/using-async-await-with-a-foreach-loop
                // As await does not work in forEach.
                const imageResults = await Promise.all(
                    this.imagesToUpload.map(async (image, i) => {
                        const imageName = this.$store.state.userProfile.docData.username + "/" + uuidv4();
    
                        const imageData = await fetch(image.url);
                        const blob = await imageData.blob();
    
                        const imageResponse = Storage.put(imageName, blob, {
                            contentType: blob.type,
                            progressCallback: function(progress) {
                                console.log("Image:", i, progress.loaded / progress.total);
                            }
                        }).catch(err => {
                            console.error("Error uploading image:", i, err);
                        });
    
                        return imageResponse;
                    })
                );
    
                console.log("Image Results:", imageResults);
                imageResults.forEach(result => {
                    this.exerciseForm.filePaths.push({ key: result.key, type: "image" });
                });
            } else if (this.videoToUpload) {
                const uuid = this.$store.state.userProfile.docData.username + "/" + uuidv4();
                const fileNameSplit = this.videoToUpload.name.split(".")
                const fileExtension = fileNameSplit[fileNameSplit.length - 1];
                const fileName = `${uuid}.${fileExtension}`
                const videoObject = {
                    input: {
                        id: uuid
                    }
                }

                // Call API and upload video.
                await API.graphql(graphqlOperation(createVideoObject, videoObject));

                const videoAsset = {
                    input: {
                        vodAssetVideoId: uuid,
                        title: uuid,
                        description: uuid
                    }
                }

                API.graphql(graphqlOperation(createVodAsset, videoAsset));
                await Storage.put(fileName, this.videoToUpload, {
                    bucket: awsvideoconfig.awsInputVideo,
                    contentType: "video/*",
                    customPrefix: {
                        public: ''
                    },
                    progressCallback(progress) {
                        console.log("Uploaded:", progress.loaded / progress.total);
                    }
                })
                .catch(err => { console.error("ERROR UPLOADED:", err) });

                this.exerciseForm.filePaths.push({ key: uuid, type: "video" });
            }

            const path = "/exercise";
            const myInit = {
                headers: {
                    Authorization: await this.$store.dispatch("fetchJwtToken")
                },
                body: {
                    exerciseForm: JSON.parse(JSON.stringify(this.exerciseForm))
                }
            };

            try {
                const response = await API.post(this.$store.state.apiName, path, myInit);
                this.$router.push("/exercises/" + response._id);
            } catch (err) {
                this.displayError(err);
            } finally {
                this.isCreating = false;
            }
        },

        updateDescription(md) {
            this.exerciseForm.description = md.content;
        },

        updateImages(images) {
            this.imagesToUpload = images;
        },

        updateVideo(video) {
            this.videoToUpload = video;
        },

        updateTags(tags) {
            this.exerciseForm.tags = tags;
        },

        updateMuscleGroups(muscleGroups) {
            this.exerciseForm.muscleGroups = muscleGroups;
        },

        updateDifficulty(difficulty) {
            this.exerciseForm.difficulty = difficulty;
        },

        displayError(err) {
            this.errorCountdown = 30;
            console.error(err);
            this.errorMessage = "Oops, an error has occured... Please try again later.";

            this.errorInterval = window.setInterval(() => {
                if (this.errorCountdown > 0) {
                    this.errorCountdown -= 1;
                } else {
                    window.clearInterval(this.errorInterval);
                    this.errorInterval = null;
                }
            }, 1000);
        }
    }
};
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
