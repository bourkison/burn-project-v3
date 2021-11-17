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
                            <div class="d-flex align-items-center">
                                Workout
                                <b-icon-house class="ml-auto" />
                            </div>
                        </b-list-group-item>
                        <b-list-group-item
                            class="navItem"
                            to="/workout/recent"
                            active-class="unset"
                            exact-active-class="active"
                        >
                            <div class="d-flex align-items-center">
                                Recent
                                <b-icon-search class="ml-auto" />
                            </div>
                        </b-list-group-item>
                        <b-list-group-item
                            class="navItem"
                            to="/workout/new"
                            active-class="active"
                            exact-active-class="active"
                            v-if="!$store.state.activeWorkout.workoutCommenced || $router.currentRoute.name === 'New Workout'"
                        >
                            <div
                                class="d-flex align-items-center"
                                
                            >
                                New Workout
                                <b-icon-plus class="ml-auto" />
                            </div>
                        </b-list-group-item>
                        <b-list-group-item
                            v-else
                            class="navItem"
                            :to="$store.state.activeWorkout.initialUrl"
                            active-class="active"
                            exact-active-class="active"
                        >
                            <div class="d-flex align-items-center">
                                Resume Workout
                                <b-icon-play class="ml-auto" />
                            </div>
                        </b-list-group-item>
                    </b-list-group>
                </b-card>
            </b-col>

            <b-col sm="6">
                <b-container class="centerCol">
                    <div v-if="workouts.length > 0 && !isLoading">
                        <WorkoutComponent
                            class="workout"
                            v-for="workout in workouts"
                            :workout="workout"
                            :key="workout.id"
                        />
                    </div>
                    <div v-else-if="!isLoading">
                        <p><em>Looks like you havent had any workouts yet.</em></p>
                    </div>
                    <div v-else>
                        <b-spinner />
                    </div>
                </b-container>
            </b-col>

            <b-col sm="3">

            </b-col>
        </b-row>
    </b-container>

</template>

<script>
import WorkoutComponent from "@/components/Workout/WorkoutComponent";

import { API, graphqlOperation } from "aws-amplify";
import { getVideoObject } from "@/graphql/queries";

export default {
    name: "WorkoutRecent",
    components: { WorkoutComponent },
    data() {
        return {
            isLoading: true,
            workouts: []
        };
    },

    created: async function() {
        const path = "/workout";
        const myInit = {
            headers: {
                Authorization: await this.$store.dispatch("fetchJwtToken")
            },
            queryStringParameters: {
                loadAmount: 10
            }
        };

        const workouts = (await API.get(this.$store.state.apiName, path, myInit)).data;

        console.log("WORKOUTS:", workouts);

        this.workouts = workouts;
        this.isLoading = false;
    },

    mounted: async function() {
        const videoObject = {
            id: "5c1f54f6-7e50-4704-9471-15f6e1c29422"
        }

        const response = await API.graphql(graphqlOperation(getVideoObject, videoObject));
        console.log("RESPONSE:", response)
    }
};
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
