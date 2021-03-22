<template>
    <b-card no-body>
        <b-card-body>
            <b-card-text>
                <b-form-textarea v-model="post.content" rows="3" no-resize placeholder="New post..."  />
                <ImageUploader :inlineDisplay="true" />
                <div class="d-flex mt-1 p-1" align-v="center">
                    <div>
                        <label for="file-input">
                            <b-icon-card-image font-scale="1.2" class="mr-1 clickableIcon" />
                        </label>
                        <b-icon-bicycle v-b-modal.addExerciseModal font-scale="1.2" class="mr-1 clickableIcon" />
                        <b-icon-droplet font-scale="1.2" class="mr-1 clickableIcon" />
                        <b-icon-award font-scale="1.2" class="mr-1 clickableIcon" />
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

        <b-modal id="addExerciseModal"
            centered
            title="Exercises"
            hide-footer
            button-size="sm"
        >
            <div>
                <ExerciseSearch @selectExercise="addExercise" />
            </div>
        </b-modal>
    </b-card>
</template>

<script>
import ImageUploader from '@/components/Utility/ImageUploader.vue'

import ExerciseSearch from '@/components/Exercise/ExerciseSearch.vue'

export default {
    name: 'PostNew',
    components: { ImageUploader, ExerciseSearch },
    data() {
        return {
            isPosting: false,
            post: {
                content: ""
            }
        }
    },

    methods: {
        addExercise: function(exercise) {
            console.log(exercise);
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