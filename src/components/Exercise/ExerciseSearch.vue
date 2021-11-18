<template>
    <div>
        <b-form-input v-model="searchText" placeholder="Search exercises..." />

        <div v-if="!isLoading">
            <div v-if="filteredCreatedExercises.length > 0" class="mt-3">
                <h6>My Exercises</h6>

                <b-list-group class="exerciseLists">
                    <b-list-group-item
                        class="d-flex"
                        align-v="center"
                        v-for="exercise in filteredCreatedExercises"
                        :key="exercise.id"
                        @click="selectExercise(exercise)"
                        href="#"
                    >
                        <div>{{ exercise.name }}</div>
                    </b-list-group-item>
                </b-list-group>
            </div>

            <div v-if="filteredFollowedExercises.length > 0" class="mt-3">
                <h6>Followed Exercises</h6>

                <b-list-group class="exerciseLists">
                    <b-list-group-item
                        class="d-flex"
                        align-v="center"
                        v-for="exercise in filteredFollowedExercises"
                        :key="exercise.id"
                        @click="selectExercise(exercise)"
                        href="#"
                    >
                        <div>{{ exercise.name }}</div>
                    </b-list-group-item>
                </b-list-group>
            </div>

            <div v-if="createdExercises.length == 0 && followedExercises.length == 0" class="mt-3">
                <em>Looks like you haven't created or followed any exercises!</em>
            </div>

            <div
                v-else-if="
                    filteredCreatedExercises.length == 0 && filteredFollowedExercises.length == 0
                "
                class="mt-3"
            >
                <em>No exercises matching that search.</em>
            </div>
        </div>
        <div v-else class="text-center mt-3">
            <b-spinner small />
        </div>
    </div>
</template>

<script>
import { API } from "aws-amplify";

export default {
    name: "ExerciseSearch",
    data() {
        return {
            isLoading: true,
            searchText: "",
            createdExercises: [],
            followedExercises: []
        };
    },

    created: async function() {
        try {
            const path = "/exercise";
            const myInit = {
                headers: {
                    Authorization: await this.$store.dispatch("fetchJwtToken")
                },
                queryStringParameters: {
                    loadAmount: 25,
                    user: true
                }
            };

            const exerciseResults = (await API.get(this.$store.state.apiName, path, myInit)).data;

            exerciseResults.forEach(exercise => {
                if (exercise.isFollow) {
                    this.followedExercises.push(exercise);
                } else {
                    this.createdExercises.push(exercise);
                }
            });
        } catch (err) {
            if (err.response && err.response.status === 404) {
                console.error("No exercises");
            } else {
                // ERROR HERE.
            }
        } finally {
            this.isLoading = false;
        }
    },

    computed: {
        filteredCreatedExercises: function() {
            if (this.searchText) {
                return this.createdExercises.filter(createdExercise => {
                    return createdExercise.name
                        .toLowerCase()
                        .includes(this.searchText.toLowerCase());
                });
            } else {
                return this.createdExercises;
            }
        },

        filteredFollowedExercises: function() {
            if (this.searchText) {
                return this.followedExercises.filter(followedExercise => {
                    return followedExercise.name
                        .toLowerCase()
                        .includes(this.searchText.toLowerCase());
                });
            } else {
                return this.followedExercises;
            }
        }
    },

    methods: {
        selectExercise: function(exercise) {
            this.$emit("selectExercise", exercise);
        }
    }
};
</script>
