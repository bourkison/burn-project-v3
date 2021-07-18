<template>
<b-container>
        <b-row>
            <b-col sm="3">
                <b-card class="navCard" no-body>
                    <b-list-group>
                        <b-list-group-item class="navItem" to="/workouts" active-class="unset" exact-active-class="active">
                            <div class="d-flex align-items-center">
                                Workouts
                                <b-icon-house class="ml-auto" />
                            </div>
                        </b-list-group-item>
                        <b-list-group-item class="navItem" to="/workouts/discover" active-class="unset" exact-active-class="active">
                            <div class="d-flex align-items-center">
                                Discover
                                <b-icon-search class="ml-auto"/>
                            </div>
                        </b-list-group-item>
                        <b-list-group-item class="navItem" to="/workouts/new" active-class="unset" exact-active-class="active">
                            <div class="d-flex align-items-center">
                                New
                                <b-icon-plus class="ml-auto"/>
                            </div>
                        </b-list-group-item>
                    </b-list-group>
                </b-card>

                <b-card class="navCard" no-body>
                    <b-card-body>
                        <b-card-title>Filter By</b-card-title>

                        <div>
                            <div>
                                <h6>Username</h6>
                                <UsernameFilter />
                            </div>
                            <div class="mt-3">
                                <h6>Muscle Groups</h6>
                                <MuscleGroupSelector @updateMuscleGroups="updateMuscleGroups" />
                            </div>

                            <div class="mt-3">
                                <h6>Tags</h6>
                                <TagSelector />
                            </div>
                        </div>
                    </b-card-body>
                </b-card>
            </b-col>
            <b-col sm="6">
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
                    <div v-else-if="isLoading" class="text-center mt-5"><b-spinner /></div>
                    <div v-else>Error pulling top workouts</div>
                </b-container>
            </b-col>
            <b-col sm="3">
                <!-- 
                    Ads here.
                 -->
            </b-col>
        </b-row>
    </b-container>
</template>

<script>
import { db } from '@/firebase'

import MuscleGroupSelector from '@/components/Utility/MuscleGroupSelector.vue'
import TagSelector from '@/components/Utility/TagSelector.vue'
import UsernameFilter from '@/components/Utility/UsernameFilter.vue'

import WorkoutFeed from '@/components/Workout/WorkoutFeed.vue'

export default {
    name: 'WorkoutDiscover',
    components: { MuscleGroupSelector, TagSelector, UsernameFilter, WorkoutFeed },
    data() {
        return {
            isLoading: true,
            workouts: [],

            // Firebase:
            fbQuery: null,

            // Filters:
            selectedMgs: [],

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
        getWorkouts: function() {
            this.isLoading = true;
            this.workouts = [];
            this.moreToLoad = true;
            this.lastLoadedWorkout = null;
            this.isLoadingMore = true;

            this.fbQuery = db.collection("workouts");

            if (this.selectedMgs.length > 0) {
                this.fbQuery = this.fbQuery.where("muscleGroups", "array-contains-any", this.selectedMgs);
            }

            this.fbQuery.orderBy("createdAt", "desc").limit(5).get()
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
        },

        updateMuscleGroups: function(muscleGroups) {
            this.selectedMgs = muscleGroups;
            this.getWorkouts();
        }
    }
}
</script>

<style scoped>
.navCard,
.workoutFeed {
    margin-top: 40px;
}
</style>

<style>
    .filterTabsNab {
        padding: 0.5rem !important;
    }
</style>