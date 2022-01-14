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
                                <DescriptionEditor @input="updateDescription" />
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

<script lang="ts">
import Vue from "vue";
import { ICreateExercise, IImageToUpload } from "@/types";

import { API, graphqlOperation, Storage } from "aws-amplify";
import { createVideoObject, createVodAsset } from "@/graphql/mutations";

import ImageUploader from "~/components/Image/ImageUploader.vue";
import MuscleGroupSelector from "@/components/Utility/MuscleGroupSelector.vue";
import DifficultySelector from "@/components/Utility/DifficultySelector.vue";
import TagSelector from "@/components/Utility/TagSelector.vue";
import DescriptionEditor from "@/components/TextEditor/DescriptionEditor.vue";

import { v4 as uuid } from "uuid";
import awsvideoconfig from "@/aws-video-exports.js";

interface ExerciseNewData {
    exerciseForm: ICreateExercise;
    imagesToUpload: IImageToUpload[];
    videoToUpload: File | null;
    isCreating: boolean;
    errorCountdown: number;
    errorMessage: string;
    errorInterval: number | undefined;
}

export default Vue.extend({
    middleware: ["requiresAuth"],
    components: {
        DifficultySelector,
        ImageUploader,
        MuscleGroupSelector,
        TagSelector,
        DescriptionEditor
    },
    data(): ExerciseNewData {
        return {
            exerciseForm: {
                name: "",
                description: "",
                muscleGroups: [],
                difficulty: 1,
                filePaths: [],
                measureBy: "repsWeight",
                tags: []
            },

            imagesToUpload: [],
            videoToUpload: null,
            isCreating: false,

            // Errror handling:
            errorCountdown: 0,
            errorMessage: "",
            errorInterval: undefined
        };
    },
    head() {
        return {
            title: "Burn · New Exercise"
        }
    },

    methods: {
        async createExercise(): Promise<void> {
            this.isCreating = true;

            if (this.imagesToUpload.length) {
                // First upload all images.
                // Cannot use forEach so instead use .map : https://stackoverflow.com/questions/37576685/using-async-await-with-a-foreach-loop
                // As await does not work in forEach.
                const imageResults = await Promise.all(
                    this.imagesToUpload.map(async (image, i) => {
                        if (!this.$accessor.userProfile || !this.$accessor.userProfile.docData) {
                            throw new Error("Not logged in");
                        }

                        const imageName = this.$accessor.userProfile.docData.username + "/" + uuid();
    
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
                    // @ts-ignore
                    this.exerciseForm.filePaths.push({ key: result.key, fileType: "image" });
                });
            } else if (this.videoToUpload) {
                if (!this.$accessor.userProfile || !this.$accessor.userProfile.docData) {
                    throw new Error("Not logged in");
                }

                const videoUuid = this.$accessor.userProfile.docData.username + "/" + uuid();
                const fileNameSplit = this.videoToUpload.name.split(".")
                const fileExtension = fileNameSplit[fileNameSplit.length - 1];
                const fileName = `${videoUuid}.${fileExtension}`
                const videoObject = {
                    input: {
                        id: videoUuid
                    }
                }

                // Call API and upload video.
                await API.graphql(graphqlOperation(createVideoObject, videoObject));

                const videoAsset = {
                    input: {
                        vodAssetVideoId: videoUuid,
                        title: videoUuid,
                        description: videoUuid
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

                this.exerciseForm.filePaths.push({ key: videoUuid, fileType: "video" });
            }


            try {
                const init = {
                    body: {
                        exerciseForm: JSON.parse(JSON.stringify(this.exerciseForm))
                    }
                };
                const _id = await this.$accessor.api.createExercise({ init });
                this.$router.push("/exercises/" + _id);
            } catch (err) {
                if (err instanceof Error) {
                    this.displayError(err);
                } else if (typeof err === "string") {
                    this.displayError(new Error(err))
                } else {
                    console.error(err);
                }
            } finally {
                this.isCreating = false;
            }
        },

        updateDescription(md: string): void {
            this.exerciseForm.description = md;
        },

        updateImages(images: IImageToUpload[]): void {
            this.imagesToUpload = images;
        },

        updateVideo(video: File): void {
            this.videoToUpload = video;
        },

        updateTags(tags: string[]): void {
            this.exerciseForm.tags = tags;
        },

        updateMuscleGroups(muscleGroups: string[]): void {
            this.exerciseForm.muscleGroups = muscleGroups;
        },

        updateDifficulty(difficulty: number): void {
            this.exerciseForm.difficulty = difficulty;
        },

        displayError(err: Error): void {
            this.errorCountdown = 30;
            console.error(err);
            this.errorMessage = "Oops, an error has occured... Please try again later.";

            this.errorInterval = window.setInterval(() => {
                if (this.errorCountdown > 0) {
                    this.errorCountdown -= 1;
                } else {
                    window.clearInterval(this.errorInterval);
                    this.errorInterval = undefined;
                }
            }, 1000);
        }
    }
});
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
