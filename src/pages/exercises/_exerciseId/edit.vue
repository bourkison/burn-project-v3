<template>
    <b-container>
        <b-row align-v="center">
            <b-col sm="8">
                <b-container>
                    <b-card class="newExerciseCard" no-body>
                        <b-card-body>
                            <b-card-title>
                                {{
                                    newExerciseData.name
                                        ? newExerciseData.name
                                        : oldExerciseData.name
                                }}
                            </b-card-title>
                            <b-form-group label="Name" label-for="nameInput">
                                <b-form-input
                                    id="nameInput"
                                    v-model="newExerciseData.name"
                                    type="text"
                                    placeholder="Exercise Name"
                                    required
                                />
                            </b-form-group>
                            <b-form-group label="Image/Video" label-for="imageInput">
                                <ImageUploader
                                    @updateImages="updateImages"
                                    @deleteInitImage="deleteInitImage"
                                    :initImages="initImages"
                                    :inlineDisplay="false"
                                />
                            </b-form-group>
                        </b-card-body>
                    </b-card>

                    <b-card no-body class="descriptionCard">
                        <b-card-body>
                            <h5>Description</h5>
                            <client-only>
                                <DescriptionEditor
                                    @input="updateDescription"
                                    :initialValue="oldExerciseData.description"
                                />
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
                            <DifficultySelector
                                :initDifficulty="oldExerciseData.difficulty"
                                @updateDifficulty="updateDifficulty"
                            />
                        </b-card-body>
                    </b-card>

                    <b-card class="muscleGroupCard" no-body>
                        <b-card-body>
                            <h5>Muscle Groups</h5>
                            <MuscleGroupSelector
                                :initMgs="oldExerciseData.muscleGroups"
                                @updateMuscleGroups="updateMuscleGroups"
                            />
                        </b-card-body>
                    </b-card>

                    <b-card class="tagSelectCard" no-body>
                        <b-card-body>
                            <h5>Add Tags</h5>
                            <TagSelector
                                :initTags="oldExerciseData.tags"
                                @updateTags="updateTags"
                            />
                        </b-card-body>
                    </b-card>
                </b-container>
            </b-col>
        </b-row>
        <b-row class="justify-content-md-center">
            <b-col cols="12" md="auto">
                <b-container class="buttonsCont">
                    <b-button
                        variant="outline-danger"
                        @click="$router.go(-1)"
                        >Cancel</b-button
                    >
                    <b-button
                        variant="outline-primary"
                        @click="updateExercise"
                        :disabled="isUpdating"
                    >
                        <span v-if="isUpdating"><b-spinner small/></span>
                        <span v-else>Update</span>
                    </b-button>
                </b-container>
            </b-col>
        </b-row>
    </b-container>
</template>

<script lang="ts">
import Vue from "vue";
import { MetaInfo } from "vue-meta";
import { ICreateExercise, IImageToUpload } from "@/types";

import { Storage } from "aws-amplify";
import { v4 as uuid } from "uuid"

import ImageUploader from "~/components/Image/ImageUploader.vue";
import MuscleGroupSelector from "@/components/Utility/MuscleGroupSelector.vue";
import DifficultySelector from "@/components/Utility/DifficultySelector.vue";
import TagSelector from "@/components/Utility/TagSelector.vue";

import DescriptionEditor from "@/components/TextEditor/DescriptionEditor.vue";

interface ExerciseEditData {
    oldExerciseData: ICreateExercise;
    newExerciseData: ICreateExercise;
    initImages: IImageToUpload[];
    imagesToUpload: IImageToUpload[];
    imagesToDelete: string[];
    isUpdating: boolean;
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
    data(): ExerciseEditData {
        return {
            oldExerciseData: {
                name: "",
                description: "",
                muscleGroups: [],
                difficulty: 1,
                filePaths: [],
                measureBy: "repsWeight",
                tags: []
            },
            newExerciseData: {
                name: "",
                description: "",
                muscleGroups: [],
                difficulty: 1,
                filePaths: [],
                measureBy: "repsWeight",
                tags: []
            },

            initImages: [],
            // Images to upload includes init images (but we skip over when uploading as we already have path)
            imagesToUpload: [],
            imagesToDelete: [],
            isUpdating: false
        };
    },
    head(): MetaInfo {
        return {
            title: this.oldExerciseData ? "Burn · Edit " + this.oldExerciseData.name : "Burn · Edit Exercise",
            meta: [
                {
                    hid: "description",
                    name: "description",
                    content: this.$route.params.exerciseId + " tutorial"
                }
            ]
        }
    },

    async asyncData({ params, app: { $accessor }, req, redirect, error }) {
        let oldExerciseData: ICreateExercise | null = null;
        let newExerciseData: ICreateExercise | null = null;
        let initImages: IImageToUpload[] = [];

        try {
            const response = await $accessor.api.getExercise({ req, exerciseId: params.exerciseId, init: {} })
            newExerciseData = JSON.parse(JSON.stringify(response));
            oldExerciseData = JSON.parse(JSON.stringify(response));

            if (!oldExerciseData || !newExerciseData) {
                throw new Error("No exercise data");
            } 

            if (!oldExerciseData.createdBy || !$accessor.userProfile || !$accessor.userProfile.docData || oldExerciseData.createdBy.username !== $accessor.userProfile.docData.username) {
                console.warn("Unauthorized");
                redirect("/exercises/" + params.exerciseId);
            }

            if (newExerciseData) {
                let urlPromises: Promise<string>[] = [];

                newExerciseData.filePaths.forEach(path => {
                    if (path.fileType === "video") {
                        console.log("EDITING VIDEO");
                    } else if (path.fileType === "image") {
                        urlPromises.push(Storage.get(path.key));
                    }
                });

                const imageUrls = await Promise.all(urlPromises);

                imageUrls.forEach((url, i) => {
                    initImages.push({
                        id: i,
                        url: url,
                        editable: false,
                        path: oldExerciseData ? oldExerciseData.filePaths[i] : null,
                    });
                });
            }
        } catch (err: any) {
            console.error(err);
            error({ message: err.message, statusCode: (err.response && err.response.status) });
        }

        return {
            oldExerciseData,
            newExerciseData,
            initImages
        }

    },

    methods: {
        async updateExercise(): Promise<void> {
            console.log("Update", this.newExerciseData, this.imagesToUpload, this.imagesToDelete);
            console.log("JSON:", JSON.stringify(this.newExerciseData));

            this.isUpdating = true;

            try {
                try {
                    // Next, loop through our images and upload if need be.
                    this.newExerciseData.filePaths = [];

                    const imagePaths = await Promise.all(
                        this.imagesToUpload.map(async (image, i) => {
                            if (!image.path) {
                                if (!this.$accessor.userProfile || !this.$accessor.userProfile.docData) {
                                    throw new Error("Not logged in");
                                }

                                const imageName = this.$accessor.userProfile.docData.username + "/" + uuid();

                                const imageData = await fetch(image.url);
                                const blob = await imageData.blob();

                                const imageResponse = await Storage.put(imageName, blob, {
                                    contentType: blob.type,
                                    progressCallback: function(progress) {
                                        console.log(
                                            "Image:",
                                            i,
                                            progress.loaded / progress.total,
                                            progress
                                        );
                                    }
                                }).catch(err => {
                                    throw new Error(i + " " + err);
                                });

                                return imageResponse;
                            } else {
                                return image.path;
                            }
                        })
                    );

                    imagePaths.forEach(path => {
                        this.newExerciseData.filePaths.push({ key: path.key, fileType: "image" });
                    });
                } catch (err) {
                    console.error("Error uploading image(s):", err);
                } finally {
                    // Now update exercise document.
                    const init = {
                        body: {
                            exerciseForm: this.newExerciseData,
                            imagesToDelete: this.imagesToDelete
                        }
                    };

                    const _id = await this.$accessor.api.editExercise({ init, exerciseId: this.$route.params.exerciseId })
                    this.$router.push("/exercises/" + _id);
                }
            } catch (err) {
                console.error("Error updating exercise:", err);
            } finally {
                this.isUpdating = false;
            }
        },

        updateDescription(md: string): void {
            this.newExerciseData.description = md;
        },

        updateImages(images: IImageToUpload[]): void {
            this.imagesToUpload = images;
        },

        updateTags(tags: string[]): void {
            this.newExerciseData.tags = tags;
        },

        updateMuscleGroups(muscleGroups: string[]): void {
            this.newExerciseData.muscleGroups = muscleGroups;
        },

        updateDifficulty(difficulty: number): void {
            this.newExerciseData.difficulty = difficulty;
        },

        deleteInitImage(path: string): void {
            this.imagesToDelete.push(path);
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
