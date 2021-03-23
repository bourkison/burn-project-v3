<template>
    <b-container>
        <div v-if="workouts.length > 0 && !isLoading">
            <WorkoutFeed class="workoutFeed" :workouts="workouts" />

            <div class="text-center" v-if="moreToLoad">
                <b-button @click="loadMoreWorkouts" variant="outline-dark" size="sm" v-b-visible.200="loadMoreWorkouts">
                    <span v-if="!isLoadingMore">Load More</span>
                    <span v-else><b-spinner small /></span>
                </b-button>
            </div>
        </div>
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
            workouts: [],

            // Lazy loading:
            isLoadingMore: true,
            moreToLoad: true,
            lastLoadedWorkout: null,
        }
    },

    created: function() {
        db.collection("workouts").orderBy("createdAt", "desc").limit(5).get()
        .then(workoutSnapshot => {
            workoutSnapshot.forEach(workoutDoc => {
                this.workouts.push(workoutDoc.id)
            })


            if (workoutSnapshot.size < 5) {
                this.moreToLoad = false;
            }

            setTimeout(() => { this.isLoadingMore = false }, 500);
            this.lastLoadedWorkout = workoutSnapshot.docs[workoutSnapshot.size - 1];

            this.isLoading = false;
        })
        .catch(e => {
            console.error("Error downloading workouts", e);
        })
    },

    methods: {
        loadMoreWorkouts: function() {
            if (!this.isLoadingMore) {
                db.collection("workouts").orderBy("createdAt", "desc").startAfter(this.lastLoadedWorkout).limit(5).get()
                .then(workoutSnapshot => {
                    workoutSnapshot.forEach(workout => {
                        this.workouts.push(workout.id);
                    })

                    if (workoutSnapshot.size < 5) {
                        this.moreToLoad = false;
                    }

                    setTimeout(() => { this.isLoadingMore = false }, 500);
                    this.lastLoadedWorkout = workoutSnapshot.docs[workoutSnapshot.size - 1];
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
.workoutFeed {
    margin-top: 40px;
}
</style>