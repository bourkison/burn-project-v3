<template>
    <b-container>
        <b-row>
            <b-col sm="3">
                <b-card class="navCard" no-body>
                    <b-list-group>
                        <b-list-group-item
                            class="navItem"
                            to="/workout"
                            active-class="unset"
                            exact-active-class="active"
                        >
                            <div class="d-flex align-items-center">
                                Workout
                                <b-icon-house class="ml-auto" />
                            </div>
                        </b-list-group-item>
                        <b-list-group-item
                            class="navItem"
                            to="/workout/recent"
                            active-class="unset"
                            exact-active-class="active"
                        >
                            <div class="d-flex align-items-center">
                                Recent
                                <b-icon-search class="ml-auto" />
                            </div>
                        </b-list-group-item>
                        <b-list-group-item
                            class="navItem"
                            to="/workout/new"
                            active-class="active"
                            exact-active-class="active"
                            v-if="!$store.state.activeWorkout.workoutCommenced || $router.currentRoute.name === 'New Workout'"
                        >
                            <div
                                class="d-flex align-items-center"
                                
                            >
                                New Workout
                                <b-icon-plus class="ml-auto" />
                            </div>
                        </b-list-group-item>
                        <b-list-group-item
                            v-else
                            class="navItem"
                            :to="$store.state.activeWorkout.initialUrl"
                            active-class="active"
                            exact-active-class="active"
                        >
                            <div class="d-flex align-items-center">
                                Resume Workout
                                <b-icon-play class="ml-auto" />
                            </div>
                        </b-list-group-item>
                    </b-list-group>
                </b-card>
            </b-col>

            <b-col sm="6">
                <b-container>
                    <b-card no-body class="centerCol">
                        <b-card-body v-if="!isLoading">
                            <b-card-title>Workouts</b-card-title>
                            <b-form-input
                                placeholder="Search for a workout or template..."
                                v-model="searchText"
                            ></b-form-input>
                            <b-card-text>
                                <b-container class="mt-3">
                                    <div v-if="filteredWorkouts.length > 0">
                                        <h5>Recent Workouts</h5>
                                        <b-list-group class="mt-2 mb-2">
                                            <b-list-group-item
                                                class="d-flex"
                                                align-v="center"
                                                :to="'/workout/new?b=' + workout._id"
                                                v-for="workout in filteredWorkouts"
                                                :key="workout.id"
                                            >
                                                <div>{{ workout.name }}</div>
                                                <div
                                                    class="ml-auto text-muted"
                                                    style="font-size:12px;line-height:2;"
                                                >
                                                    {{ workout.createdAtText }}
                                                </div>
                                            </b-list-group-item>
                                        </b-list-group>
                                    </div>

                                    <div v-if="filteredTemplates.length > 0" class="mt-3">
                                        <h5>Followed Templates</h5>
                                        <b-list-group class="mt-2 mb-2">
                                            <b-list-group-item
                                                class="d-flex"
                                                align-v="center"
                                                :to="'/workout/new?w=' + template._id"
                                                v-for="template in filteredTemplates"
                                                :key="template.id"
                                            >
                                                <div>{{ template.name }}</div>
                                                <div
                                                    class="ml-auto text-muted"
                                                    style="font-size:12px;line-height:2;"
                                                >
                                                    {{ template.createdBy.username }}
                                                </div>
                                            </b-list-group-item>
                                        </b-list-group>
                                    </div>
                                </b-container>
                            </b-card-text>
                        </b-card-body>

                        <b-card-body v-else class="text-center">
                            <b-spinner small />
                        </b-card-body>
                    </b-card>
                </b-container>
            </b-col>

            <b-col sm="3">

            </b-col>
        </b-row>
    </b-container>
</template>

<script>
import { API } from "aws-amplify";

import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

export default {
    name: "WorkoutView",
    data() {
        return {
            isLoading: true,

            userTemplates: [],
            userWorkouts: [],

            searchText: ""
        };
    },

    created: async function() {
        dayjs.extend(relativeTime);
        let promises = [];

        // First download user templates.
        let path = "/template";
        let myInit = {
            headers: {
                Authorization: await this.$store.dispatch("fetchJwtToken")
            },
            queryStringParameters: {
                loadAmount: 15,
                user: true
            }
        };

        promises.push(
            API.get(this.$store.state.apiName, path, myInit)
                .then(templates => {
                    this.userTemplates = templates.data;
                    console.log("TEMPLATES:", templates);
                })
                .catch(err => {
                    this.templates = [];
                    console.error(err);
                })
        );

        // Next download user workouts.
        path = "/workout";
        myInit = {
            headers: {
                Authorization: await this.$store.dispatch("fetchJwtToken")
            },
            queryStringParameters: {
                loadAmount: 15
            }
        };

        promises.push(
            API.get(this.$store.state.apiName, path, myInit)
                .then(workouts => {
                    let uniqueNames = [];

                    workouts.data.forEach(workout => {
                        if (!uniqueNames.includes(workout.name)) {
                            workout.createdAtText = dayjs(workout.createdAt).fromNow();
                            this.userWorkouts.push(workout);
                            uniqueNames.push(workout.name);
                        }
                    });
                })
                .catch(err => {
                    this.workouts = [];
                    console.error(err);
                })
        );

        await Promise.all(promises);
        this.isLoading = false;
    },

    computed: {
        filteredWorkouts: function() {
            if (this.searchText) {
                return this.userWorkouts.filter(recentWorkout => {
                    return recentWorkout.name.toLowerCase().includes(this.searchText.toLowerCase());
                });
            } else {
                return this.userWorkouts;
            }
        },

        filteredTemplates: function() {
            if (this.searchText) {
                return this.userTemplates.filter(template => {
                    return template.name.toLowerCase().includes(this.searchText.toLowerCase());
                });
            } else {
                return this.userTemplates;
            }
        }
    }
};
</script>

<style scoped>
.centerCol,
.navCard {
    margin-top: 40px;
}
</style>
