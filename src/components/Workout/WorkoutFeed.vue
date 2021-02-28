<template>
    <div>
        <WorkoutComponent class="workout" v-for="workout in workouts" :workoutId="workout" :key="workout" />
    </div>
</template>

<script>
import WorkoutComponent from '@/components/Workout/WorkoutComponent.vue'

export default {
    name: 'WorkoutFeed',
    components: { WorkoutComponent },
    props: {
        workouts: {
            required: true,
            type: Array
        }
    }
}
</script>

<style scoped>
    .workout {
        margin-bottom: 25px;
    }
</style>