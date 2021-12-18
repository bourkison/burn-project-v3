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

<script>
import { API } from "aws-amplify"

export default {
    name: "WorkoutSearch",
    data() {
        return {
            isLoading: true,
            searchText: "",
            workouts: []
        };
    },

    created: async function() {
        try {
            const path = "/workout";
            const myInit = {
                headers: {
                    Authorization: await this.$store.dispatch("fetchJwtToken")
                },
                queryStringParameters: {
                    loadAmount: 25
                }
            };

            const workoutResults = (await API.get(this.$store.state.apiName, path, myInit)).data;

            let uniqueNames = [];
            workoutResults.forEach(workout => {
                if (!uniqueNames.includes(workout.name)) {
                    this.workouts.push(workout);
                    uniqueNames.push(workout.name);
                }
            })
        }
        catch (err) {
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
        filteredWorkouts: function() {
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
        selectWorkout: function(workout) {
            this.$emit("selectWorkout", workout);
        }
    }
};
</script>
