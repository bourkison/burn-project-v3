<template>
    <b-container>
        <div v-if="workouts.length > 0 && !isLoading" class="mb-4">
            <WorkoutFeed class="workoutFeed" :workouts="workouts" />

            <div class="text-center" v-if="moreToLoad">
                <b-button @click="loadMoreWorkouts" variant="outline-dark" size="sm" v-b-visible.200="loadMoreWorkouts">
                    <span v-if="!isLoadingMore">Load More</span>
                    <span v-else><b-spinner small /></span>
                </b-button>
            </div>
        </div>
        <div v-else-if="isLoading">
            <b-spinner />
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

            // Lazy loading:
            isLoadingMore: true,
            moreToLoad: true,
            lastLoadedWorkout: null,
        }
    },

    created: function() {
        db.collection("users").doc(this.$store.state.userProfile.data.uid).collection("workouts").orderBy("createdAt", "desc").limit(5).get()
        .then(workoutSnapshot => {
            if (workoutSnapshot.size > 0) {
                workoutSnapshot.forEach(workout => {
                    this.workouts.push(workout.id);
                })

                if (workoutSnapshot.size < 5) {
                    this.moreToLoad = false;
                }

                setTimeout(() => { this.isLoadingMore = false }, 500);
                this.lastLoadedWorkout = workoutSnapshot.docs[workoutSnapshot.size - 1];
            } else {
                this.moreToLoad = false;
            }

            this.isLoading = false;
        })
        .catch(e => {
            this.isLoading = false;
            console.error("Error getting workouts:", e);
        })
    },

    methods: {
        loadMoreWorkouts: function() {
            if (!this.isLoadingMore) {
                db.collection("users").doc(this.$store.state.userProfile.data.uid).collection("workouts").orderBy("createdAt", "desc").startAfter(this.lastLoadedWorkout).limit(5).get()
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