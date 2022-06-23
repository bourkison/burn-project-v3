<template>
    <div>
        <b-form-input v-model="searchText" placeholder="Search workouts..." />

        <div v-if="!isLoading">
            <div v-if="filteredWorkouts.length > 0" class="mt-3">
                <b-list-group>
                    <b-list-group-item
                        class="d-flex"
                        align-v="center"
                        v-for="workout in filteredWorkouts"
                        :key="workout._id"
                        @click="selectWorkout(workout)"
                        href="#"
                    >
                        <div>{{ workout.name }}</div>
                    </b-list-group-item>
                </b-list-group>
            </div>
        </div>

        <div v-else class="text-center mt-3">
            <b-spinner small />
        </div>
    </div>
</template>

<script lang="ts">
import Vue from "vue";
import { Workout } from "@/types/workout";
import { API } from "aws-amplify"

export default Vue.extend({
    name: "WorkoutSearch",
    data() {
        return {
            isLoading: true,
            searchText: "",
            workouts: [] as Workout[]
        };
    },

    async created() {
        try {
            const init = {
                queryStringParameters: {
                    loadAmount: 25
                }
            };

            const workoutResults = await this.$accessor.api.queryWorkout({ init })

            let uniqueNames: string[] = [];
            workoutResults.forEach(workout => {
                if (!uniqueNames.includes(workout.name)) {
                    this.workouts.push(workout);
                    uniqueNames.push(workout.name);
                }
            })
        }
        catch (err: any) {
            if (err.response && err.response.status === 404) {
                console.error("No workouts");
            } else {
                // ERROR HERE
                console.error(err)
            }
        }
        finally {
            this.isLoading = false;
        }
    },

    computed: {
        filteredWorkouts(): Workout[] {
            if (this.searchText) {
                return this.workouts.filter(workout => {
                    return workout.name.toLowerCase().includes(this.searchText.toLowerCase());
                });
            } else {
                return this.workouts;
            }
        }
    },

    methods: {
        selectWorkout(workout: Workout) {
            this.$emit("selectWorkout", workout);
        }
    }
});
</script>
