<template>
    <b-container>
        <b-row>
            <b-col sm="3">
                <b-card class="navCard" no-body>
                    <b-list-group>
                        <b-list-group-item
                            class="navItem"
                            to="/workout"
                            active-class="unset"
                            exact-active-class="active"
                        >
                            <span class="d-flex align-items-center">
                                Workout
                                <b-icon-house class="ml-auto" />
                            </span>
                        </b-list-group-item>
                        <b-list-group-item
                            class="navItem"
                            to="/workout/recent"
                            active-class="unset"
                            exact-active-class="active"
                        >
                            <span class="d-flex align-items-center">
                                Recent
                                <b-icon-search class="ml-auto" />
                            </span>
                        </b-list-group-item>
                        <b-list-group-item
                            class="navItem"
                            to="/workout/new"
                            active-class="active"
                            exact-active-class="active"
                            v-if="!$store.state.activeWorkout.workoutCommenced || $router.currentRoute.name === 'New Workout'"
                        >
                            <span
                                class="d-flex align-items-center"
                                
                            >
                                New Workout
                                <b-icon-plus class="ml-auto" />
                            </span>
                        </b-list-group-item>
                        <b-list-group-item
                            v-else
                            class="navItem"
                            :to="$store.state.activeWorkout.initialUrl"
                            active-class="active"
                            exact-active-class="active"
                        >
                            <span class="d-flex align-items-center">
                                Resume Workout
                                <b-icon-play class="ml-auto" />
                            </span>
                        </b-list-group-item>
                    </b-list-group>
                </b-card>
            </b-col>

            <b-col sm="6">
                <b-container class="centerCol">
                    <div v-if="workouts.length > 0">
                        <WorkoutComponent
                            class="workout"
                            v-for="workout in workouts"
                            :workout="workout"
                            :key="workout.id"
                        />
                    </div>
                    <div v-else>
                        <p><em>Looks like you havent had any workouts yet.</em></p>
                    </div>
                </b-container>
            </b-col>

            <b-col sm="3">

            </b-col>
        </b-row>
    </b-container>

</template>

<script lang="ts">
import Vue from "vue";
import { Workout } from "@/types/workout";
import WorkoutComponent from "@/components/Workout/WorkoutComponent.vue";
import { API } from "aws-amplify";

export default Vue.extend({
    components: { WorkoutComponent },
    middleware: ["requiresAuth"],
    data() {
        return {
            workouts: []
        };
    },

    async asyncData({ req }) {
        let workouts: Workout[] = [];
        
        const init = {
            queryStringParameters: {
                loadAmount: 10
            }
        };

        workouts = await this.$accessor.api.queryWorkout({ init, req });

        return { workouts }
    }
});
</script>

<style scoped>
.workout {
    margin-bottom: 25px;
}

.centerCol,
.navCard {
    margin-top: 40px;
}
</style>
