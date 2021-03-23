<template>
    <b-container>
        <div v-if="exercises.length > 0 && !isLoading" class="mb-4">
            <ExerciseFeed class="exerciseFeed" :exercises="exercises" />

            <div class="text-center" v-if="moreToLoad">
                <b-button @click="loadMoreExercises" variant="outline-dark" size="sm" v-b-visible="loadMoreExercises">
                    <span v-if="!isLoadingMore">Load More</span>
                    <span v-else><b-spinner small /></span>
                </b-button>
            </div>
        </div>
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

            // Lazy loading:
            isLoadingMore: true,
            moreToLoad: true,
            lastLoadedExercise: null,
        }
    },

    created: function() {
        // Download relevant exercises.
        db.collection("users").doc(this.$store.state.userProfile.data.uid).collection("exercises").orderBy("createdAt", "desc").limit(5).get()
        .then(exerciseSnapshot => {
            if (exerciseSnapshot.size > 0) {
                exerciseSnapshot.forEach(exercise => {
                    this.exercises.push(exercise.id);
                })

                if (exerciseSnapshot.size < 5) {
                    this.moreToLoad = false;
                }

                setTimeout(() => { this.isLoadingMore = false }, 500);
                this.lastLoadedExercise = exerciseSnapshot.docs[exerciseSnapshot.size - 1];
            } else {
                this.moreToLoad = false;
            }
            this.isLoading = false;
        })
        .catch(e => {
            this.isLoading = false;
            console.error("Error pulling workouts", e);
        })
    },

    methods: {
        loadMoreExercises: function() {
            if (!this.isLoadingMore) {
                db.collection("users").doc(this.$store.state.userProfile.data.uid).collection("exercises").orderBy("createdAt", "desc").startAfter(this.lastLoadedExercise).limit(5).get()
                .then(exerciseSnapshot => {
                    exerciseSnapshot.forEach(exercise => {
                        this.exercises.push(exercise.id);
                    })

                    if (exerciseSnapshot.size < 5) {
                        this.moreToLoad = false;
                    }

                    setTimeout(() => { this.isLoadingMore = false }, 500);
                    this.lastLoadedExercise = exerciseSnapshot.docs[exerciseSnapshot.size - 1];
                })
                .catch(e => {
                    console.error("Error downloading more workouts:", e);
                })
            }
        }
    }
}
</script>

<style scoped>
.exerciseFeed {
    margin-top: 40px;
}
</style>