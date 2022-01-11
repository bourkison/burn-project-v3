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

<script>
import { API, Storage } from "aws-amplify";
import { v4 as uuidv4 } from "uuid"

import ImageUploader from "@/components/Utility/ImageUploader.vue";
import MuscleGroupSelector from "@/components/Utility/MuscleGroupSelector.vue";
import DifficultySelector from "@/components/Utility/DifficultySelector.vue";
import TagSelector from "@/components/Utility/TagSelector.vue";

import DescriptionEditor from "@/components/TextEditor/DescriptionEditor.vue";

export default {
    middleware: ["requiresAuth"],
    components: {
        DifficultySelector,
        ImageUploader,
        MuscleGroupSelector,
        TagSelector,
        DescriptionEditor
    },
    data() {
        return {
            oldExerciseData: null,
            newExerciseData: null,

            initImages: [],
            // Images to upload includes init images (but we skip over when uploading as we already have path)
            imagesToUpload: [],
            imagesToDelete: [],
            isUpdating: false
        };
    },

    async asyncData({ params, store, req, redirect, error }) {
        let oldExerciseData = null;
        let newExerciseData = null;
        let initImages = [];

        try {
            const path = "/exercise/" + params.exerciseId;
            const myInit = {
                headers: {
                    Authorization: await store.dispatch("fetchJwtToken", { req })
                }
            };

            const response = await API.get(store.state.apiName, path, myInit);
            newExerciseData = response.data;
            oldExerciseData = response.data;

            if (oldExerciseData.createdBy.username !== store.state.userProfile.docData.username) {
                console.warn("Unauthorized");
                redirect("/exercises/" + params.exerciseId);
            }

            if (newExerciseData) {
                let urlPromises = [];

                newExerciseData.filePaths.forEach(path => {
                    if (path.type === "video") {
                        console.log("EDITING VIDEO");
                    } else if (path.type === "image") {
                        urlPromises.push(Storage.get(path.key));
                    }
                });

                const imageUrls = await Promise.all(urlPromises);

                imageUrls.forEach((url, i) => {
                    initImages.push({
                        id: i,
                        url: url,
                        editable: false,
                        path: oldExerciseData.filePaths[i],
                    });
                });
            }
        } catch (err) {
            console.error(err);
            error({ message: err.message, statusCode: err.statusCode });
        }

        return {
            oldExerciseData,
            newExerciseData,
            initImages
        }

    },

    methods: {
        async updateExercise() {
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
                                const imageName = this.$store.state.userProfile.docData.username + "/" + uuidv4();

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
                        this.newExerciseData.filePaths.push({ key: path.key, type: "image" });
                    });
                } catch (err) {
                    console.error("Error uploading image(s):", err);
                } finally {
                    // Now update exercise document.
                    const path = "/exercise/" + this.$route.params.exerciseid;
                    const myInit = {
                        headers: {
                            Authorization: await this.$store.dispatch("fetchJwtToken")
                        },
                        body: {
                            exerciseForm: this.newExerciseData,
                            imagesToDelete: this.imagesToDelete
                        }
                    };

                    const response = await API.put(this.$store.state.apiName, path, myInit);

                    this.$router.push("/exercises/" + response.data._id);
                }
            } catch (err) {
                console.error("Error updating exercise:", err);
            } finally {
                this.isUpadting = false;
            }
        },

        updateDescription(md) {
            this.newExerciseData.description = md;
        },

        updateImages(images) {
            this.imagesToUpload = images;
        },

        updateTags(tags) {
            this.newExerciseData.tags = tags;
        },

        updateMuscleGroups(muscleGroups) {
            this.newExerciseData.muscleGroups = muscleGroups;
        },

        updateDifficulty(difficulty) {
            this.newExerciseData.difficulty = difficulty;
        },

        deleteInitImage(path) {
            this.imagesToDelete.push(path);
        },

        dataURLtoBlob(dataurl) {
            var arr = dataurl.split(","),
                mime = arr[0].match(/:(.*?);/)[1],
                bstr = atob(arr[1]),
                n = bstr.length,
                u8arr = new Uint8Array(n);
            while (n--) {
                u8arr[n] = bstr.charCodeAt(n);
            }
            return new Blob([u8arr], { type: mime });
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
