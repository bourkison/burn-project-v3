<template>
    <b-card no-body>
        <div v-if="!isLoading">
            <b-card-body>
                <b-card-title><router-link :to="'/workouts/' + workoutId" class="componentLink">{{ workoutData.name }}</router-link></b-card-title>
                <b-card-sub-title>{{ workoutData.createdBy.username }}</b-card-sub-title>
                <b-card-text>
                    <div :id="workoutData.id + 'accordion'" class="accordion exerciseExpandableCont" role="tablist">
                        <ExerciseExpandable v-for="(exercise, index) in workoutData.exercises" :exercise="exercise" :accordionIndex="index" :workoutId="workoutData.id" :key="exercise.id" :lazy="true" />
                    </div>
                </b-card-text>
                <Viewer :initialValue="workoutData.description"/>

                <div class="text-center">
                    <b-button variant="outline-success" size="sm" class="text-center" :to="'/burn/new?w=' + workoutData.id">
                        Start Workout
                        <b-icon-play />
                    </b-button>
                </div>
            </b-card-body>
            <CommentSection :docId="workoutData.id" collection="workouts" :followableComponent="true" />
        </div>
        <div v-else>
            <b-card-body>
                <b-skeleton v-for="(index) in (Math.floor(Math.random() * 4) + 3)" :key="index" animation="wave" :width="(Math.floor(Math.random() * 50) + 50).toString() + '%'"></b-skeleton>
            </b-card-body>
        </div>
    </b-card>
</template>

<script>
import '@toast-ui/editor/dist/toastui-editor-viewer.css';

import { Viewer } from '@toast-ui/vue-editor'
import { templatesCollection } from '@/firebase'

import CommentSection from '@/components/Comment/CommentSection.vue'
import ExerciseExpandable from '@/components/Exercise/ExerciseExpandable.vue'

export default {
    name: 'WorkoutComponent',
    components: { Viewer, CommentSection, ExerciseExpandable },
    props: {
        workoutId: {
            required: true,
            type: String
        }
    },

    data() {
        return {
            isLoading: true,
            workoutData: {},
        }
    },

    created: function() {
        templatesCollection().doc(this.$props.workoutId).get()
        .then(workoutDoc => {
            this.workoutData = workoutDoc.data();
            this.workoutData.id = workoutDoc.id;

            // Pull like, comment and follow count.
            this.isLoading = false;
        })
        .catch(e => {
            console.error("Error downloading workout data", e);
        })
    }
}
</script>

<style scoped>
.exerciseExpandableCont {
    padding: 20px;
}

.componentLink:hover {
    cursor: pointer;
}
</style>