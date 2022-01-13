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
                            active
                        >
                            <div class="d-flex align-items-center">
                                Exercises
                                <b-icon-house class="ml-auto" />
                            </div>
                        </b-list-group-item>
                        <b-list-group-item
                            class="navItem"
                            ref="discoverExerciseLink"
                            to="/exercises/followed"
                            active-class="unset"
                        >
                            <div class="d-flex align-items-center">
                                Followed
                                <b-icon-search class="ml-auto" />
                            </div>
                        </b-list-group-item>
                        <b-list-group-item class="navItem" to="/exercises/new" active-class="unset">
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
                                <MuscleGroupSelector @updateMuscleGroups="updateMuscleGroups" />
                            </div>

                            <div class="mt-3">
                                <h6>Tags</h6>
                                <TagSelector @updateTags="updateTags" :initTags="selectedTags" />
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
                    Exercise Home Ad Here.
                </div>
            </b-col>
        </b-row>
    </b-container>
</template>

<script lang="ts">
import Vue from "vue";
import { IExerciseReference } from "@/types";
import { QueryExerciseInit } from "@/types/api";

import ExerciseFeed from "@/components/Exercise/ExerciseFeed.vue";
import MuscleGroupSelector from "@/components/Utility/MuscleGroupSelector.vue";
import TagSelector from "@/components/Utility/TagSelector.vue";
import UsernameFilter from "@/components/Utility/UsernameFilter.vue";

interface ExerciseDiscoverData {
    isLoading: boolean;
    exercises: IExerciseReference[];
    selectedMgs: string[];
    selectedTags: string[];
    isLoadingMore: boolean;
    moreToLoad: boolean;
    errorCountdown: number;
    errorMessage: string;
    errorInterval: number | undefined;
}

export default Vue.extend({
    middleware: ["requiresAuth"],
    components: {
        ExerciseFeed,
        MuscleGroupSelector,
        TagSelector,
        UsernameFilter
    },
    head() {
        return {
            title: "Burn · Exercises"
        }
    },

    data(): ExerciseDiscoverData {
        return {
            isLoading: true,
            exercises: [], // Exercises from user doc.

            // Filters
            selectedMgs: [],
            selectedTags: [],

            // Lazy loading:
            isLoadingMore: true,
            moreToLoad: true,

            // Error handling:
            errorCountdown: 0,
            errorMessage: "",
            errorInterval: undefined
        };
    },

    mounted() {
        if (this.$route.query.muscleGroups && typeof this.$route.query.muscleGroups === "string") {
            this.selectedMgs = this.$route.query.muscleGroups.split(",");
        }

        if (this.$route.query.tags && typeof this.$route.query.tags === "string") {
            this.selectedTags = this.$route.query.tags.split(",");
        }

        this.downloadExercises();
    },

    methods: {
        async downloadExercises(): Promise<void> {
            try {
                this.isLoading = true;
                await this.queryExercises();
            }
            catch (err: any) {
                if (err.response && err.response.status !== 404) {
                    this.displayError(err);
                }

                this.moreToLoad = false;
            }
            finally {
                this.isLoading = false;
                this.isLoadingMore = false;
            }
        },

        async loadMoreExercises(): Promise<void> {
            if (!this.isLoadingMore && this.moreToLoad) {
                try {
                    this.isLoadingMore = true;
                    await this.queryExercises(this.exercises[this.exercises.length - 1].exerciseId);
                }
                catch (err: any) {
                    if (err.response && err.response.status !== 404) {
                        this.displayError(err);
                    }

                    this.moreToLoad = false;
                }
                finally {
                    this.isLoadingMore = false;
                }
            }
        },

        async queryExercises(startAt?: string): Promise<void> {
            let init: QueryExerciseInit = {
                queryStringParameters:  {
                    loadAmount: 5,
                    user: false
                }
            };

            if (startAt && init.queryStringParameters) {
                init.queryStringParameters.startAt = startAt;
            }

            if (this.selectedMgs.length > 0 && init.queryStringParameters) {
                init.queryStringParameters.muscleGroups = this.selectedMgs.join(",");
            }

            if (this.selectedTags.length > 0 && init.queryStringParameters) {
                init.queryStringParameters.tags = this.selectedTags.join(",");
            }

            const references = await this.$accessor.api.queryExercise({ init });
            references.forEach(reference => {
                reference.loaded = false;
                this.exercises.push(reference);
            })

            if (references.length < 5) {
                this.$nextTick(() => { this.moreToLoad = false });
            }
        },

        updateMuscleGroups(muscleGroups: string[]): void {
            this.selectedMgs = muscleGroups;
            let isFiltered = false;

            let query: { muscleGroups?: string, tags?: string } = {};

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
                    path: "/exercises",
                    query: query
                });
            } else {
                this.$router.replace({
                    path: "/exercises",
                    query: undefined
                });
            }

            this.downloadExercises();
        },

        updateTags(tags: string[]): void {
            this.selectedTags = tags;
            let isFiltered = false;

            let query: { muscleGroups?: string, tags?: string } = {};

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
                    path: "/exercises",
                    query: query
                });
            } else {
                this.$router.replace({
                    path: "/exercises",
                    query: undefined
                });
            }
            this.downloadExercises();
        },

        displayError(err: any): void {
            this.errorCountdown = 30;
            console.error(err);
            this.errorMessage = "Oops, an error has occured... Please try again later.";

            this.errorInterval = window.setInterval(() => {
                if (this.errorCountdown > 0) {
                    this.errorCountdown -= 1;
                } else {
                    window.clearInterval(this.errorInterval);
                    this.errorInterval = undefined;
                }
            }, 1000);
        }
    }
});
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
