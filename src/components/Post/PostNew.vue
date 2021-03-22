<template>
    <b-card no-body>
        <b-card-body>
            <b-card-text>
                <ImageUploader @updateImages="updateImages" :inlineDisplay="true" />

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
                        <b-button size="sm" variant="outline" @click="isPosting = !isPosting">
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
        }
    },

    methods: {
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
        }

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