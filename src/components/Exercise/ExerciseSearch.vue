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

<script lang="ts">
import Vue from "vue";
import { ExerciseReference } from "@/types/exercise";
import { API } from "aws-amplify";

export default Vue.extend({
    name: "ExerciseSearch",
    data() {
        return {
            isLoading: true,
            searchText: "",
            createdExercises: [] as ExerciseReference[],
            followedExercises: [] as ExerciseReference[]
        };
    },

    async created() {
        try {
            const init = {
                queryStringParameters: {
                    loadAmount: 25,
                    user: true
                }
            };

            const exerciseResults = await this.$accessor.api.queryExercise({ init });

            exerciseResults.forEach(exercise => {
                if (exercise.isFollow) {
                    this.followedExercises.push(exercise);
                } else {
                    this.createdExercises.push(exercise);
                }
            });
        } catch (err: any) {
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
        filteredCreatedExercises(): ExerciseReference[] {
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

        filteredFollowedExercises(): ExerciseReference[] {
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
        selectExercise(exercise: ExerciseReference) {
            this.$emit("selectExercise", exercise);
        }
    }
});
</script>
