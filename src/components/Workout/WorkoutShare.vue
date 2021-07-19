<template>
    <b-container>
        <div :id="workout.id + 'accordion'" class="accordion" role="tablist">
            <ExerciseExpandable v-for="(exercise, index) in workout.exercises" :exercise="exercise" :accordionIndex="index" :workoutId="workout.id" :key="exercise.id" :lazy="false" />
        </div>
    </b-container>
</template>

<script>
import { workoutsCollection } from '@/firebase'

import ExerciseExpandable from '@/components/Exercise/ExerciseExpandable.vue'

export default {
    name: 'WorkoutShare',
    components: { ExerciseExpandable },
    props: {
        workoutId: {
            type: String,
            required: true
        }
    },
    data() {
        return {
            isLoading: true,
            workout: {}
        }
    },

    created: function() {
        this.downloadWorkout();
    },

    methods: {
        downloadWorkout: function() {
            this.isLoading = true;

            workoutsCollection().doc(this.$props.workoutId).get()
            .then(workoutDoc => {
                this.workout = workoutDoc.data();
                this.workout.id = workoutDoc.id;

                this.isLoading = false;
            })
        }
    },

    watch: {
        workoutId: function() {
            this.downloadWorkout();
        }
    }
}
</script>