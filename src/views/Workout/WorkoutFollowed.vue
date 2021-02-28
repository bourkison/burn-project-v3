<template>
    <b-container>
        <WorkoutFeed class="workoutFeed" v-if="workouts.length > 0 && !isLoading" :workouts="workouts" />
        <div v-else-if="isLoading">

        </div>
        <div v-else>
            <em>Looks like you haven't followed or created any workouts.</em>
        </div>
    </b-container>
</template>

<script>
import WorkoutFeed from '@/components/Workout/WorkoutFeed.vue'
import { db } from '@/firebase'

export default {
    name: 'WorkoutFollowed',
    components: { WorkoutFeed },
    data() {
        return {
            isLoading: true,
            workouts: [],
        }
    },

    created: function() {
        db.collection("users").doc(this.$store.state.userProfile.data.uid).collection("workouts").get()
        .then(workoutsSnapshot => {
            if (workoutsSnapshot.size > 0) {
                workoutsSnapshot.forEach(workout => {
                    this.workouts.push(workout.id);
                })
            }

            this.isLoading = false;
        })
        .catch(e => {
            this.isLoading = false;
            console.error("Error getting workouts:", e);
        })
    }
}
</script>

<style scoped>
.workoutFeed {
    margin-top: 40px;
}
</style>