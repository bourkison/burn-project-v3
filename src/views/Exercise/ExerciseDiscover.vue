<template>
    <b-container>
        <b-row>
            <b-col sm="3">
                <b-card class="navCard" no-body>
                    <b-list-group>
                        <b-list-group-item
                            class="navItem"
                            ref="homeExerciseLink"
                            to="/exercises"
                            active-class="unset"
                        >
                            <div class="d-flex align-items-center">
                                Exercises
                                <b-icon-house class="ml-auto" />
                            </div>
                        </b-list-group-item>
                        <b-list-group-item
                            class="navItem"
                            ref="discoverExerciseLink"
                            to="/exercises/discover"
                            active
                        >
                            <div class="d-flex align-items-center">
                                Discover
                                <b-icon-search class="ml-auto" />
                            </div>
                        </b-list-group-item>
                        <b-list-group-item
                            class="navItem"
                            to="/exercises/new"
                            active-class="unset"
                        >
                            <div class="d-flex align-items-center">
                                New
                                <b-icon-plus class="ml-auto" />
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
                                <MuscleGroupSelector
                                    @updateMuscleGroups="updateMuscleGroups"
                                />
                            </div>

                            <div class="mt-3">
                                <h6>Tags</h6>
                                <TagSelector
                                    @updateTags="updateTags"
                                    :initTags="selectedTags"
                                />
                            </div>
                        </div>
                    </b-card-body>
                </b-card>
            </b-col>

            <b-col sm="6">
                <div v-if="exercises.length > 0 || isLoading">
                    <ExerciseFeed
                        class="exerciseFeed"
                        :exercises="exercises"
                        :isLoading="isLoading"
                    />

                    <div class="text-center" v-if="moreToLoad">
                        <b-button
                            @click="loadMoreExercises"
                            variant="outline-dark"
                            size="sm"
                            v-b-visible.200="loadMoreExercises"
                        >
                            <span v-if="!isLoadingMore">Load More</span>
                            <span v-else><b-spinner small/></span>
                        </b-button>
                    </div>
                </div>
                <div v-else class="text-center noexercisesfound">
                    No exercises found
                </div>
                <b-alert
                    class="position-fixed fixed-bottom m-0 rounded-0"
                    variant="danger"
                    dismissible
                    fade
                    style="z-index: 2000;"
                    v-model="errorCountdown"
                >
                    {{ errorMessage }}
                </b-alert>
            </b-col>

            <b-col sm="3">
                <!-- 
                    AD HERE.
                 -->
                <div class="adTest bg-warning text-center">
                    Exercise Discover Ad Here.
                </div>
            </b-col>
        </b-row>
    </b-container>
</template>

<script>
import { db } from "@/firebase";
import { API } from "aws-amplify";
import ExerciseFeed from "@/components/Exercise/ExerciseFeed";

import MuscleGroupSelector from "@/components/Utility/MuscleGroupSelector.vue";
import TagSelector from "@/components/Utility/TagSelector.vue";
import UsernameFilter from "@/components/Utility/UsernameFilter.vue";

export default {
    name: "ExerciseDiscover",
    components: {
        ExerciseFeed,
        MuscleGroupSelector,
        TagSelector,
        UsernameFilter
    },
    data() {
        return {
            isLoading: true,
            exercises: [], // Exercises from user doc.

            // Filters
            selectedMgs: [],
            selectedTags: [],

            // Lazy loading:
            isLoadingMore: true,
            moreToLoad: true,
            lastLoadedExercise: null,

            // Error handling:
            errorCountdown: 0,
            errorMessage: "",
            errorInterval: null
        };
    },

    created: function() {
        if (this.$route.query.muscleGroups) {
            this.selectedMgs = this.$route.query.muscleGroups.split(",");
        }

        if (this.$route.query.tags) {
            this.selectedTags = this.$route.query.tags.split(",");
        }

        this.downloadExercises();
    },

    methods: {
        downloadExercises: async function() {
            try {
                this.isLoading = true;
                this.exercises = [];

                const path = "/exercise";
                let myInit = {
                    headers: {
                        Authorization: this.$store.state.userProfile.data
                            .idToken.jwtToken
                    },
                    queryStringParameters: {
                        loadAmount: 5,
                        user: false
                    }
                };

                if (this.selectedMgs.length > 0) {
                    myInit.queryStringParameters.muscleGroups = this.selectedMgs.join(
                        ","
                    );
                }

                if (this.selectedTags.length > 0) {
                    myInit.queryStringParameters.tags = this.selectedTags.join(
                        ","
                    );
                }

                const response = await API.get(
                    this.$store.state.apiName,
                    path,
                    myInit
                ).catch(err => {
                    throw err;
                });

                this.exercises = response.data;

                if (this.exercises.length > 0) {
                    this.isLoading = false;
                }
            } catch (err) {
                if (err.response && err.response.status !== 404) {
                    this.displayError(err);
                }
            } finally {
                this.moreToLoad = false;
                this.isLoading = false;
            }
        },

        loadMoreExercises: function() {
            if (!this.isLoadingMore && !this.moreToLoad) {
                db.collection("exercises")
                    .orderBy("createdAt", "desc")
                    .startAfter(this.lastLoadedExercise)
                    .limit(5)
                    .get()
                    .then(exerciseSnapshot => {
                        exerciseSnapshot.forEach(exercise => {
                            this.exercises.push(exercise.id);
                        });

                        if (exerciseSnapshot.size < 5) {
                            this.moreToLoad = false;
                        }

                        setTimeout(() => {
                            this.isLoadingMore = false;
                        }, 500);
                        this.lastLoadedExercise =
                            exerciseSnapshot.docs[exerciseSnapshot.size - 1];
                    })
                    .catch(e => {
                        console.error("Error downloading more exercises:", e);
                    });
            }
        },

        updateMuscleGroups: function(muscleGroups) {
            this.selectedMgs = muscleGroups;
            let isFiltered = false;

            let query = {};

            if (this.selectedMgs.length > 0) {
                isFiltered = true;
                query.muscleGroups = this.selectedMgs.join(",");
            }

            if (this.selectedTags.length > 0) {
                isFiltered = true;
                query.tags = this.selectedTags.join(",");
            }

            if (isFiltered) {
                this.$router.replace({
                    path: "/exercises/discover",
                    query: query
                });
            }

            this.downloadExercises();
        },

        updateTags: function(tags) {
            this.selectedTags = tags;
            let isFiltered = false;

            let query = {};

            if (this.selectedMgs.length > 0) {
                isFiltered = true;
                query.muscleGroups = this.selectedMgs.join(",");
            }

            if (this.selectedTags.length > 0) {
                isFiltered = true;
                query.tags = this.selectedTags.join(",");
            }

            if (isFiltered) {
                this.$router.replace({
                    path: "/exercises/discover",
                    query: query
                });
            }
            this.downloadExercises();
        },

        displayError: function(err) {
            this.errorCountdown = 30;
            console.error(err);
            this.errorMessage =
                "Oops, an error has occured... Please try again later.";

            this.errorInterval = window.setInterval(() => {
                if (this.errorCountdown > 0) {
                    this.errorCountdown -= 1;
                } else {
                    window.clearInterval(this.errorInterval);
                    this.errorInterval = null;
                }
            }, 1000);
        }
    }
};
</script>

<style scoped>
.navCard,
.exerciseFeed,
.noexercisesfound {
    margin-top: 40px;
}

.adTest {
    position: sticky;
    top: 100px;
    height: 250px;
    width: 300px;
    padding: 0;
    margin-top: 40px;
    line-height: 250px;
}
</style>
