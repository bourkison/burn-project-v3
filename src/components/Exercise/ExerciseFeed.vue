<template>
    <div>
        <ExerciseComponent class="exercise" v-for="exercise in exercises" :exerciseId="exercise" :key="exercise" />
    </div>
</template>

<script>
import ExerciseComponent from '@/components/Exercise/ExerciseComponent.vue'

export default {
    name: 'ExerciseFeed',
    components: { ExerciseComponent },
    props: {
        exercises: {
            required: true,
            type: Array
        }
    }
}
</script>

<style scoped>
    .exercise {
        margin-bottom: 40px;
    }
</style>