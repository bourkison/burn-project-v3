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
                <b-container>
                    <div v-if="exercises.length > 0 && !isLoading" class="mb-4">
                        <ExerciseFeed class="exerciseFeed" :exercises="exercises" />

                        <div class="text-center" v-if="moreToLoad">
                            <b-button @click="loadMoreExercises" variant="outline-dark" size="sm" v-b-visible.200="loadMoreExercises">
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
            </b-col>

            <b-col sm="3">
                <!-- 
                    Ads here. 
                -->
                <div class="adTest bg-warning text-center">
                    Exercise Home Ad Here.
                </div>
            </b-col>
        </b-row>
        
    </b-container>
</template>

<script>
import { db } from '@/firebase'
import { API } from 'aws-amplify'
import ExerciseFeed from '@/components/Exercise/ExerciseFeed.vue'

import MuscleGroupSelector from '@/components/Utility/MuscleGroupSelector.vue'
import TagSelector from '@/components/Utility/TagSelector.vue'
import UsernameFilter from '@/components/Utility/UsernameFilter.vue'

export default {
    name: 'ExerciseFollowed',
    components: { ExerciseFeed, MuscleGroupSelector, TagSelector, UsernameFilter },
    data() {
        return {
            isLoading: true,
            exercises: [], // Exercises from user doc.

            // Filters
            selectedMgs: [],

            // Lazy loading:
            isLoadingMore: true,
            moreToLoad: true,
            lastLoadedExercise: null,
        }
    },

    created: async function() {
        this.downloadExercises();
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
                    console.error("Error downloading more exercises:", e);
                })
            }
        },

        downloadExercises: async function() {
            this.isLoading = true;
            this.exercises = [];

            console.log("DOWNLOADING MORE");

            const path = '/exercise';
            let myInit = {
                headers: {
                    Authorization: this.$store.state.userProfile.data.idToken.jwtToken
                },
                queryStringParameters: {
                    loadAmount: 5,
                    user: true
                }
            }

            if (this.selectedMgs.length > 0) {
                myInit.queryStringParameters.muscleGroups = this.selectedMgs.join(",");
            }

            const response = await API.get(this.$store.state.apiName, path, myInit);

            this.exercises = response.data;

            if (this.exercises.length > 0) {
                this.isLoading = false;
            }

            console.log("API RESPONSE", response);
        },

        updateMuscleGroups: function(muscleGroups) {
            this.selectedMgs = muscleGroups;
            this.downloadExercises();
        }
    }
}
</script>

<style scoped>
.navCard,
.exerciseFeed {
    margin-top: 40px;
}

.adTest {
    position: sticky;
    top: 100px;
    height: 250px;
    width: 300px;
    padding: 0;
    margin-top: 40px;
    line-height: 250px
}
</style>