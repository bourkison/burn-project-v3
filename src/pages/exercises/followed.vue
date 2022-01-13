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
                            to="/exercises/followed"
                            active
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
                                <MuscleGroupSelector
                                    @updateMuscleGroups="updateMuscleGroups"
                                    :initMgs="selectedMgs"
                                />
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
                <b-container>
                    <div v-if="exercises.length > 0 || isLoading" class="mb-4">
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
                    <div v-else>
                        <em>Looks like you haven't followed or created any exercises.</em>
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
                </b-container>
            </b-col>

            <b-col sm="3">
                <!-- 
                    Ads here. 
                -->
                <div class="adTest bg-warning text-center">
                    Exercise Followed Ad Here.
                </div>
            </b-col>
        </b-row>
    </b-container>
</template>

<script lang="ts">
import Vue from "vue";
import { IExerciseReference } from "@/types";

import { API } from "aws-amplify";
import ExerciseFeed from "@/components/Exercise/ExerciseFeed.vue";

import MuscleGroupSelector from "@/components/Utility/MuscleGroupSelector.vue";
import TagSelector from "@/components/Utility/TagSelector.vue";
import UsernameFilter from "@/components/Utility/UsernameFilter.vue";

interface ExerciseFollowData {
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

interface ExerciseInit {
    headers: {
        Authorization: string
    },
    queryStringParameters: {
        loadAmount?: number;
        user?: boolean;
        muscleGroups?: string;
        tags?: string;
    }
}

export default Vue.extend({
    middleware: ["requiresAuth"],
    components: {
        ExerciseFeed,
        MuscleGroupSelector,
        TagSelector,
        UsernameFilter
    },
    data(): ExerciseFollowData {
        return {
            isLoading: true,
            exercises: [], // Exercises from user doc.

            // Filters
            selectedMgs: [],
            selectedTags: [],

            // Lazy loading:
            isLoadingMore: true,
            moreToLoad: true,

            // Errror handling:
            errorCountdown: 0,
            errorMessage: "",
            errorInterval: undefined
        };
    },
    head() {
        return {
            title: "Burn · Followed Exercises"
        }
    },

    created() {
        if (this.$route.query.muscleGroups && typeof this.$route.query.muscleGroups === "string") {
            this.selectedMgs = this.$route.query.muscleGroups.split(",");
        }

        if (this.$route.query.tags && typeof this.$route.query.tags === "string") {
            this.selectedTags = this.$route.query.tags.split(",");
        }

        this.downloadExercises();
    },

    methods: {
        async loadMoreExercises(): Promise<void> {
            if (!this.isLoadingMore && this.moreToLoad) {
                try {
                    this.isLoadingMore = true;
                    const path = "/exercise";
                    let myInit = {
                        headers: {
                            Authorization: await this.$store.dispatch("fetchJwtToken")
                        },
                        queryStringParameters: {
                            loadAmount: 5,
                            user: true,
                            startAt: this.exercises[this.exercises.length - 1].exerciseId
                        }
                    };
    
                    const response = await API.get(this.$store.state.apiName, path, myInit);
    
                    response.data.forEach((exercise: IExerciseReference) => {
                        let temp = exercise;
                        temp.loaded = false;
                        this.exercises.push(temp);
                    })
    
                    if (response.data.length < 5) {
                        this.moreToLoad = false;
                    }
                }
                catch (err) {
                    // console.error(err.response.status);
                    this.moreToLoad = false;
                }
            }
        },

        async downloadExercises(): Promise<void> {
            try {
                this.isLoading = true;
                this.exercises = [];

                const path = "/exercise";
                let myInit = {
                    headers: {
                        Authorization: await this.$store.dispatch("fetchJwtToken")
                    },
                    queryStringParameters: {
                        loadAmount: 5,
                        user: true
                    }
                } as ExerciseInit;

                if (this.selectedMgs.length > 0) {
                    myInit.queryStringParameters.muscleGroups = this.selectedMgs.join(",");
                }

                if (this.selectedTags.length > 0) {
                    myInit.queryStringParameters.tags = this.selectedTags.join(",");
                }

                const response = await API.get(this.$store.state.apiName, path, myInit).catch(
                    err => {
                        console.log("ERROR:", err.response);
                        if (err.response.status === 404) {
                            this.exercises = [];
                        } else {
                            throw err;
                        }
                    }
                );

                if (!response) {
                    throw new Error("No response");
                }

                if (!response.success) {
                    throw new Error("Unsuccessful: " + response.errorMessage);
                }

                response.data.forEach((exercise: IExerciseReference) => {
                    let temp = exercise;
                    temp.loaded = false;
                    this.exercises.push(temp)
                });

                if (response.data.length < 5) {
                    this.moreToLoad = false;
                }

                this.isLoadingMore = false;
            } catch (err: any) {
                if (err.response && err.response.status !== 404) {
                    this.displayError(err);
                }
            } finally {
                this.isLoading = false;
            }
        },

        updateMuscleGroups(muscleGroups: string[]): void {
            console.log("UPDATING MUSCLE GROUPS");
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
                this.$router.replace({ path: "/exercises/followed", query: query });
            } else {
                this.$router.replace({ path: "/exercises/followed", query: undefined });
            }

            this.downloadExercises();
        },

        updateTags(tags: string[]): void {
            console.log("UPDATING TAGS");

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
                this.$router.replace({ path: "/exercises/followed", query: query });
            } else {
                this.$router.replace({ path: "/exercises/followed", query: undefined });
            }
            this.downloadExercises();
        },

        displayError(err: any) {
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
    line-height: 250px;
}
</style>
