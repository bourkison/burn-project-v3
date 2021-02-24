<template>
    <b-container>
        <ExerciseFeed class="exerciseFeed" v-if="exercises.length > 0 && !isLoading" :exercises="exercises" />
        <div v-else-if="isLoading">
            <b-spinner />
        </div>
        <div v-else>
            <em>Looks like you haven't followed or created any exercises.</em>
        </div>
    </b-container>
</template>

<script>
import { db } from '@/firebase'
import ExerciseFeed from '@/components/Exercise/ExerciseFeed.vue'

export default {
    name: 'ExerciseFollowed',
    components: { ExerciseFeed },
    data() {
        return {
            isLoading: true,
            exercises: [], // Exercises from user doc.
            errorMessage: ''
        }
    },

    created: function() {
        // Download relevant exercises.
        db.collection("users").doc(this.$store.state.userProfile.data.uid).collection("exercises").orderBy("createdAt", "desc").get()
        .then(exercisesSnapshot => {
            if (exercisesSnapshot.size > 0) {
                exercisesSnapshot.forEach(exercise => {
                    this.exercises.push(exercise.id);
                })
            }
            this.isLoading = false;
        })
        .catch(e => {
            this.isLoading = false;
            this.errorMessage = "Error downloading exercises" + e;
            console.log(this.errorMessage);
        })
    }
}
</script>

<style>

.navCard,
.exerciseFeed {
    margin-top: 40px;
}
</style>