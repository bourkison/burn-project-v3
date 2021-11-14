<template>
    <b-container>
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
</template>

<script>
import WorkoutComponent from "@/components/Workout/WorkoutComponent";

import { API } from "aws-amplify";

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
    }
};
</script>

<style scoped>
.workout {
    margin-bottom: 25px;
}
</style>
