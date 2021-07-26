<template>
    <b-container>
        <b-row>
            <b-col sm="3">
                <b-card class="navCard" no-body>
                        <b-list-group>
                            <b-list-group-item class="navItem" ref="homeExerciseLink" to="/exercises" active-class="unset" exact-active-class="active">
                                <div class="d-flex align-items-center">
                                    Exercises
                                    <b-icon-house class="ml-auto" />
                                </div>
                            </b-list-group-item>
                            <b-list-group-item class="navItem" ref="discoverExerciseLink" to="/exercises/discover" active-class="unset" exact-active-class="active">
                                <div class="d-flex align-items-center">
                                    Discover
                                    <b-icon-search class="ml-auto"/>
                                </div>
                            </b-list-group-item>
                            <b-list-group-item class="navItem" to="/exercises/new" active-class="unset" exact-active-class="active">
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
                <div v-if="exercises.length > 0 && !isLoading">
                    <ExerciseFeed class="exerciseFeed"  :exercises="exercises" />

                    <div class="text-center" v-if="moreToLoad">
                        <b-button @click="loadMoreExercises" variant="outline-dark" size="sm" v-b-visible.200="loadMoreExercises">
                            <span v-if="!isLoadingMore">Load More</span>
                            <span v-else><b-spinner small /></span>
                        </b-button>
                    </div>
                </div>

                <div v-else-if="isLoading"><b-spinner /></div>
                <div v-else>Error pulling top exercises</div>
            </b-col>

            <b-col sm="3">
                <!-- 
                    AD HERE.
                 -->
            </b-col>
        </b-row>
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

                    setTimeout(() => { this.isLoadingMore = false }, 500);
                    this.lastLoadedExercise = exerciseSnapshot.docs[exerciseSnapshot.size - 1];
                })
                .catch(e => {
                    console.error("Error downloading more exercises:", e);
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