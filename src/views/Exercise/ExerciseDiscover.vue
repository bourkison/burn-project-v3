<template>
    <b-container>
        <ExerciseFeed class="exerciseFeed" v-if="exercises.length > 0 && !isLoading" :exercises="exercises" />
        
        <div v-else-if="isLoading"><b-spinner /></div>
        <div v-else>Error pulling top exercises</div>
    </b-container>
</template>

<script>
import { db } from '@/firebase'
import ExerciseFeed from '@/components/Exercise/ExerciseFeed'

export default {
    name: 'ExerciseDiscover',
    components: { ExerciseFeed },
    data() {
        return {
            isLoading: true,
            exercises: [], // Exercises from user doc.
        }
    },

    created: function() {
        // Download relevant exercises.
        db.collection("exercises").get()
        .then(exercisesSnapshot => {
            exercisesSnapshot.forEach(exercise => {
                this.exercises.push(exercise.id);
            })

            this.isLoading = false;
        })
    }
}
</script>