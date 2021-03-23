<template>
    <b-card no-body>
        <b-card-body>
            <b-card-text>
                <ImageUploader @updateImages="updateImages" :inlineDisplay="true" :resetVariablesIncrementor="resetVariablesIncrementor" />

                <div v-if="post.share.type" class="mt-1 mb-3">
                    <div class="text-right">
                        <b-icon-x variant="danger" class="clickableIcon" @click="post.share = {}" />
                    </div>

                    <div v-if="post.share.type == 'exercise'">
                        <ExerciseShare :exerciseId="post.share.id" />
                    </div>
                    <div v-else-if="post.share.type == 'workout'">
                        <WorkoutShare :workoutId="post.share.id" />
                    </div>
                    <div v-else-if="post.share.type == 'burn'">
                        <BurnShare :burnId="post.share.id" :userId="$store.state.userProfile.data.uid" />
                    </div>
                </div>

                <b-form-textarea v-model="post.content" rows="3" no-resize placeholder="New post..."  />
                <div class="d-flex mt-1 p-1" align-v="center">
                    <div>
                        <label for="file-input">
                            <b-icon-card-image font-scale="1.2" class="mr-1 clickableIcon" />
                        </label>
                        <b-icon-bicycle v-b-modal.addExerciseModal font-scale="1.2" class="mr-1 clickableIcon" />
                        <b-icon-droplet v-b-modal.addWorkoutModal font-scale="1.2" class="mr-1 clickableIcon" />
                        <b-icon-award v-b-modal.addBurnModal font-scale="1.2" class="mr-1 clickableIcon" />
                    </div>
                    <div class="ml-auto">
                        <b-button size="sm" variant="outline" @click="createPost">
                            <span v-if="!isPosting">Post</span>
                            <span v-else><b-spinner small /></span>
                        </b-button>
                    </div>
                </div>
            </b-card-text>
        </b-card-body>

        <b-modal id="addExerciseModal" centered title="Exercises" hide-footer button-size="sm">
            <ExerciseSearch @selectExercise="addExercise" />
        </b-modal>

        <b-modal id="addWorkoutModal" centered title="Workouts" hide-footer button-size="sm">
            <WorkoutSearch @selectWorkout="addWorkout" />
        </b-modal>

        <b-modal id="addBurnModal" centered title="Burns" hide-footer buttons-size="sm">
            <BurnSearch @selectBurn="addBurn" />
        </b-modal>
    </b-card>
</template>

<script>
import { storage, functions } from '@/firebase'

import ImageUploader from '@/components/Utility/ImageUploader.vue'

import BurnSearch from '@/components/Burn/BurnSearch.vue'
import BurnShare from '@/components/Burn/BurnShare.vue'
import ExerciseSearch from '@/components/Exercise/ExerciseSearch.vue'
import ExerciseShare from '@/components/Exercise/ExerciseShare.vue'
import WorkoutSearch from '@/components/Workout/WorkoutSearch.vue'
import WorkoutShare from '@/components/Workout/WorkoutShare.vue'

export default {
    name: 'PostNew',
    components: { ImageUploader, BurnSearch, BurnShare, ExerciseSearch, ExerciseShare, WorkoutSearch, WorkoutShare },
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
            resetVariablesIncrementor: 0,
        }
    },

    methods: {
        createPost: function() {
            this.isPosting = true;
            let imageUploadPromises = [];

            this.post.id = this.generateId(16);

            // Upload images.
            if (this.imagesToUpload.length > 0) {
                this.imagesToUpload.forEach(image => {
                    let imageRef = storage.ref("posts/" + this.post.id + "/images/" + Number(new Date()) + "-" + this.generateId(4));
                    imageUploadPromises.push(imageRef.putString(image.url, 'data_url'));
                    this.post.filePaths.push(imageRef.fullPath);
                })
            }

            Promise.all(imageUploadPromises)
            .then(() => {
                // Once images uploaded, call New Post function.
                const createPost = functions.httpsCallable("createPost");
                const user = { username: this.$store.state.userProfile.docData.username, profilePhoto: this.$store.state.userProfile.docData.profilePhoto };

                return createPost({ postForm: this.post, user: user });
            })
            .then(() => {
                this.$emit("newPost", this.post);
                this.isPosting = false;
                this.resetVariablesIncrementor ++;
                console.log("WTF", this.resetVariablesIncrementor);

                this.resetVariables();
            })
            .catch(e => {
                console.error("Error creating post:", e);
            })
        },

        addBurn: function(burn) {
            this.post.share = {
                id: burn.id,
                type: "burn"
            }

            this.$bvModal.hide("addBurnModal");
        },

        addExercise: function(exercise) {
            this.post.share = {
                id: exercise.id,
                type: "exercise"
            }

            this.$bvModal.hide("addExerciseModal");
        },

        addWorkout: function(workout) {
            this.post.share = {
                id: workout.id,
                type: "workout"
            }

            this.$bvModal.hide("addWorkoutModal");
        },

        updateImages: function(images) {
            this.imagesToUpload = images;
        },

        resetVariables: function() {
            this.isPosting = false,
            this.post = {
                content: "",
                filePaths: [],
                share: {}
            },
            this.imagesToUpload = []
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

    }
}
</script>

<style scoped>
.clickableIcon {
    vertical-align: middle !important;
}

.clickableIcon:hover {
    cursor: pointer;
}
</style>