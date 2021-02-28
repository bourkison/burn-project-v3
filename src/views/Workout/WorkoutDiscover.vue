<template>
    <b-container>
        <WorkoutFeed class="workoutFeed" v-if="workouts.length > 0 && !isLoading" :workouts="workouts" />
        <div v-else-if="isLoading"><b-spinner /></div>
        <div v-else>Error pulling top workouts</div>
    </b-container>
</template>

<script>
import { db } from '@/firebase'
import WorkoutFeed from '@/components/Workout/WorkoutFeed.vue'

export default {
    name: 'WorkoutDiscover',
    components: { WorkoutFeed },
    data() {
        return {
            isLoading: true,
            workouts: []
        }
    },

    created: function() {
        db.collection("workouts").orderBy("createdAt", "desc").get()
        .then(workoutSnapshot => {
            workoutSnapshot.forEach(workoutDoc => {
                this.workouts.push(workoutDoc.id)
            })

            this.isLoading = false;
        })
    }
}
</script>

<style scoped>
.workoutFeed {
    margin-top: 40px;
}
</style>