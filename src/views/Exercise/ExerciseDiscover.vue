<template>
    <b-container>
        <div v-if="exercises.length > 0 && !isLoading">
            <ExerciseFeed class="exerciseFeed"  :exercises="exercises" />

            <div class="text-center" v-if="moreToLoad">
                <b-button @click="loadMoreExercises" variant="outline-dark" size="sm" v-b-visible="loadMoreExercises">
                    <span v-if="!isLoadingMore">Load More</span>
                    <span v-else><b-spinner small /></span>
                </b-button>
            </div>
        </div>
        
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

            // Lazy loading:
            isLoadingMore: true,
            moreToLoad: true,
            lastLoadedExercise: null,
        }
    },

    created: function() {
        // Download relevant exercises.
        db.collection("exercises").orderBy("createdAt", "desc").limit(5).get()
        .then(exerciseSnapshot => {
            exerciseSnapshot.forEach(exercise => {
                this.exercises.push(exercise.id);
            })

            if (exerciseSnapshot.size < 5) {
                this.moreToLoad = false;
            }

            setTimeout(() => { this.isLoadingMore = false }, 500);
            this.lastLoadedExercise = exerciseSnapshot.docs[exerciseSnapshot.size - 1];

            this.isLoading = false;
        })
        .catch(e => {
            console.error("Error downloading exercises:", e);
        })
    },

    methods: {
        loadMoreExercises: function() {
            if (!this.isLoadingMore) {
                db.collection("exercises").orderBy("createdAt", "desc").startAfter(this.lastLoadedExercise).limit(5).get()
                .then(exerciseSnapshot => {
                    exerciseSnapshot.forEach(exercise => {
                        this.exercises.push(exercise.id);
                    })

                    if (exerciseSnapshot.size < 5) {
                        this.moreToLoad = false;
                    }

                    setTimeout(() => { this.isLoadingMore }, 500);
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