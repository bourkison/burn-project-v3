<template>
    <div>
        <ImageUploader
            @updateImages="updateImages"
            :inlineDisplay="true"
            :resetVariablesIncrementor="resetVariablesIncrementor"
        />

        <div v-if="post.share.type" class="mt-1 mb-3">
            <div class="text-right">
                <b-icon-x
                    variant="danger"
                    class="clickableIcon"
                    @click="post.share = {}"
                />
            </div>

            <div v-if="post.share.type == 'exercise'">
                <ExerciseShare :exerciseId="post.share.id" />
            </div>
            <div v-else-if="post.share.type == 'template'">
                <TemplateShare :templateId="post.share.id" />
            </div>
            <div v-else-if="post.share.type == 'workout'">
                <WorkoutShare
                    :workoutId="post.share.id"
                    :userId="$store.state.userProfile.data.uid"
                />
            </div>
        </div>

        <b-form-textarea
            v-model="post.content"
            rows="3"
            no-resize
            placeholder="New post..."
        />
        <div class="d-flex mt-1 p-1" align-v="center">
            <div>
                <label for="file-input">
                    <b-icon-card-image
                        font-scale="1.2"
                        class="mr-1 clickableIcon"
                    />
                </label>
                <b-icon-bicycle
                    v-b-modal.addExerciseModal
                    font-scale="1.2"
                    class="mr-1 clickableIcon"
                />
                <b-icon-droplet
                    v-b-modal.addTemplateModal
                    font-scale="1.2"
                    class="mr-1 clickableIcon"
                />
                <b-icon-award
                    v-b-modal.addWorkoutModal
                    font-scale="1.2"
                    class="mr-1 clickableIcon"
                />
            </div>
            <div class="ml-auto">
                <b-button size="sm" variant="outline" @click="createPost">
                    <span v-if="!isPosting">Post</span>
                    <span v-else><b-spinner small/></span>
                </b-button>
            </div>
        </div>

        <b-modal
            id="addExerciseModal"
            centered
            title="Exercises"
            hide-footer
            button-size="sm"
        >
            <ExerciseSearch @selectExercise="addExercise" />
        </b-modal>

        <b-modal
            id="addTemplateModal"
            centered
            title="Templates"
            hide-footer
            button-size="sm"
        >
            <TemplateSearch @selectTemplate="addTemplate" />
        </b-modal>

        <b-modal
            id="addWorkoutModal"
            centered
            title="Workouts"
            hide-footer
            buttons-size="sm"
        >
            <WorkoutSearch @selectWorkout="addWorkout" />
        </b-modal>
    </div>
</template>

<script>
import { API, Storage } from 'aws-amplify'

import crypto from "crypto";
import util from "util";

import ImageUploader from "@/components/Utility/ImageUploader.vue";

import WorkoutSearch from "@/components/Workout/WorkoutSearch.vue";
import WorkoutShare from "@/components/Workout/WorkoutShare.vue";
import ExerciseSearch from "@/components/Exercise/ExerciseSearch.vue";
import ExerciseShare from "@/components/Exercise/ExerciseShare.vue";
import TemplateSearch from "@/components/Template/TemplateSearch.vue";
import TemplateShare from "@/components/Template/TemplateShare.vue";

export default {
    name: "PostNew",
    components: {
        ImageUploader,
        WorkoutSearch,
        WorkoutShare,
        ExerciseSearch,
        ExerciseShare,
        TemplateSearch,
        TemplateShare
    },
    data() {
        return {
            isPosting: false,
            post: {
                content: "",
                filePaths: [],
                share: {}
            },
            imagesToUpload: [],

            // Below iterator is watched by ImageUploader.
            // On change, the ImageUploader resets variables.
            resetVariablesIncrementor: 0
        };
    },

    methods: {
        createPost: async function() {
            if (!this.isPosting) {
                try {
                    console.log(JSON.stringify(JSON.stringify(this.post)));
                    this.isPosting = true;
        
                    // First upload all images using .map (see ExerciseNew.vue for further explanation)
                    const imageResults = await Promise.all(
                        this.imagesToUpload.map(async (image, i) => {
                            const imageId = await this.generateId(16);
                            const imageName = "username/" + this.store.state.userProfile.docData.username + "/exercises/" + imageId;
        
                            const imageData = await fetch(image.url);
                            const blob = await imageData.blob();
        
                            console.log("UPLOADING:", imageName, blob);
        
                            const imageResponse = await Storage.put(imageName, blob, {
                                contentType: blob.type,
                                progressCallback: function(progress) {
                                    console.log("Image:", i, progress.loaded / progress.total);
                                }
                            }).catch(err => {
                                console.error("Error uploading image:", i, err);
                            });
        
                            return imageResponse;
                        })
                    )
        
                    imageResults.forEach(result => {
                        this.post.filePaths.push(result.key);
                    })
        
                    const path = "/post";
                    const myInit = {
                        headers: {
                            Authorization: this.$store.state.userProfile.data.idToken.jwtToken
                        },
                        body: {
                            postForm: JSON.parse(JSON.stringify(this.post))
                        }
                    }
        
                    const response = await API.post(
                        this.$store.state.apiName,
                        path,
                        myInit
                    );
    
                    console.log("POST CREATED:", response);
                    this.$emit("newPost", this.post);
                    this.isPosting = false;
                    this.resetVariablesIncrementor++;
                    this.resetVariables();
                }
                catch(err) {
                    console.error("Error creating post.");
                }
            }
        },

        addWorkout: function(workout) {
            this.post.share = {
                id: workout.id,
                type: "workout"
            };

            this.$bvModal.hide("addWorkoutModal");
        },

        addExercise: function(exercise) {
            this.post.share = {
                id: exercise.id,
                type: "exercise"
            };

            this.$bvModal.hide("addExerciseModal");
        },

        addTemplate: function(template) {
            this.post.share = {
                id: template.id,
                type: "template"
            };

            this.$bvModal.hide("addTemplateModal");
        },

        updateImages: function(images) {
            this.imagesToUpload = images;
        },

        resetVariables: function() {
            (this.isPosting = false),
                (this.post = {
                    content: "",
                    filePaths: [],
                    share: {}
                }),
                (this.imagesToUpload = []);
        },

        generateId: async function(n) {
            const randomBytes = util.promisify(crypto.randomBytes);
            const rawBytes = await randomBytes(n);

            const hex = await rawBytes.toString("hex");
            return hex;
        }
    }
};
</script>

<style scoped>
.clickableIcon {
    vertical-align: middle !important;
}

.clickableIcon:hover {
    cursor: pointer;
}
</style>
