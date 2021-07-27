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
        if (this.$store.state.userWorkouts === null) {
            await this.$store
                .dispatch("fetchWorkouts", this.$store.state.userProfile.data)
                .catch(e => {
                    console.error(e);
                });
        }

        this.workouts = this.$store.state.userWorkouts;
        this.isLoading = false;
    }
};
</script>

<style scoped>
.workout {
    margin-bottom: 25px;
}
</style>
