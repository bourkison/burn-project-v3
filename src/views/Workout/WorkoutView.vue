<template>
    <b-container v-if="!isLoading && workoutExists">
        <b-row align-v="center">
            <b-col sm="8">
                <b-container class="workoutCard mainCard">
                    <b-card no-body>
                        <b-card-body>
                            <b-card-title>
                                {{ workoutData.name }}
                                <b-dropdown right class="float-right" variant="outline">
                                    <span v-if="workoutData.createdBy.id === this.$store.state.userProfile.data.uid">
                                        <b-dropdown-item :to="'/workouts/' + workoutData.id + '/edit'">Edit</b-dropdown-item>
                                        <b-dropdown-item variant="danger">Delete</b-dropdown-item>
                                    </span>
                                    <span v-else>
                                        <b-dropdown-item variant="danger">Report</b-dropdown-item>
                                    </span>
                                </b-dropdown>
                            </b-card-title>
                            <b-card-sub-title>
                                {{ workoutData.createdBy.username }}
                            </b-card-sub-title>

                            <b-card-text>
                                <div :id="workoutData.id + 'accordion'" class="accordion exerciseExpandableCont" role="tablist">
                                    <ExerciseExpandable v-for="(exercise, index) in workoutData.exercises" :exercise="exercise" :accordionIndex="index" :workoutId="workoutData.id" :key="exercise.id" :lazy="false" />
                                </div>

                                <div class="text-center">
                                    <b-button variant="outline-success" size="sm" class="text-center" :to="'/burn/new?w=' + workoutData.id">
                                        Start Workout    
                                        <b-icon-play />
                                    </b-button>
                                </div>
                                <div class="mt-4">
                                    <Viewer :initialValue="workoutData.description" />
                                </div>
                            </b-card-text>
                        </b-card-body>
                        <CommentSection :docId="workoutData.id" collection="workouts" :followableComponent="true" />
                    </b-card>
                </b-container>
            </b-col>

            <b-col sm="4">
                <b-card no-body class="workoutCard">
                    <b-card-body>
                        <b-card-title>
                            Difficulty
                        </b-card-title>
                        <b-card-text>
                            <div class="text-center stars">
                                <b-icon-star-fill v-for="star in workoutData.difficulty" :key="star" font-scale="2" variant="warning"></b-icon-star-fill>
                            </div>
                        </b-card-text>
                    </b-card-body>
                </b-card>

                <b-card no-body class="workoutCard">
                    <b-card-body>
                        <b-card-title>
                            Muscle Groups
                        </b-card-title>
                        <MuscleGroup :selectedGroups="workoutData.muscleGroups" />
                    </b-card-body>
                </b-card>

                <b-card no-body class="workoutCard">
                    <b-card-body>
                        <b-card-title>
                            Tags
                        </b-card-title>
                        <b-card-text>
                            <div style="text-center">
                                <b-badge class="tags" v-for="(tag, index) in workoutData.tags" :key="index" :variant="variants[index]">{{ tag }}</b-badge>
                            </div>
                        </b-card-text>
                    </b-card-body>
                </b-card>
            </b-col>
        </b-row>
    </b-container>
</template>

<script>
import { db } from '@/firebase'
import { Viewer } from '@toast-ui/vue-editor'

import CommentSection from '@/components/Comment/CommentSection.vue'
import MuscleGroup from '@/components/Utility/MuscleGroup.vue'
import ExerciseExpandable from '@/components/Exercise/ExerciseExpandable.vue'

export default {
    name: 'WorkoutView',
    components: { CommentSection, Viewer, MuscleGroup, ExerciseExpandable },
    data() {
        return {
            isLoading: true,
            workoutExists: false,
            workoutData: {},

            // Bootstrap:
            variants: ["success", "danger", "warning", "info", "dark"]
        }
    },

    created: function() {
        this.downloadWorkout();
    },

    beforeRouteUpdate: function(to, from, next) {
        this.downloadWorkout();
        next();
    },

    methods: {
        downloadWorkout: function() {
            db.collection("workouts").doc(this.$route.params.workoutid).get()
            .then(workoutDoc => {
                if (workoutDoc.exists) {
                    this.workoutData = workoutDoc.data();
                    this.workoutData.id = workoutDoc.id;

                    this.workoutExists = true;

                    this.isLoading = false;
                } else {
                    this.workoutExists = false;
                    throw new Error("Workout does not exist");
                }
            })
            .catch(e => {
                console.error("Error downloading workout", e);
                this.isLoading = false;
            })
        },
    }
}
</script>

<style scoped>
.workoutCard {
    margin-top: 20px;
}

.tags {
    margin: 2px;
}

.mainCard {
    margin-bottom: 20px;
}

.exerciseExpandableCont {
    padding: 20px;
}
</style>