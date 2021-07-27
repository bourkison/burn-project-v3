<template>
    <b-container>
        <b-card no-body>
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
                                    :to="'/workout/new?b=' + workout.id"
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
                                    :to="'/workout/new?w=' + template.id"
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
</template>

<script>
import { templatesCollection, userTemplatesCollection } from "@/firebase";

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
        promises.push(
            userTemplatesCollection(this.$store.state.userProfile.data.uid)
                .orderBy("createdAt", "desc")
                .get()
                .then(templateSnapshot => {
                    let templatePromises = [];

                    templateSnapshot.forEach(template => {
                        templatePromises.push(
                            templatesCollection()
                                .doc(template.id)
                                .get()
                        );
                    });

                    return Promise.all(templatePromises).then(templateDocs => {
                        templateDocs.forEach(templateDoc => {
                            let data = templateDoc.data();
                            data.id = templateDoc.id;

                            this.userTemplates.push(data);
                        });
                    });
                })
        );

        // Then get user workouts from store.
        if (this.$store.state.userWorkouts === null) {
            await this.$store
                .dispatch("fetchWorkouts", this.$store.state.userProfile.data)
                .catch(e => {
                    console.error(e);
                });
        }

        let uniqueNames = [];
        this.$store.state.userWorkouts.forEach(workout => {
            let b = workout;

            if (!uniqueNames.includes(b.name)) {
                b.createdAtText = dayjs(
                    dayjs.unix(b.createdAt.seconds)
                ).fromNow();
                this.userWorkouts.push(b);
                uniqueNames.push(b.name);
            }
        });

        Promise.all(promises).then(() => {
            this.isLoading = false;
            console.log("Workouts:", this.userWorkouts);
            console.log("Templates:", this.userTemplates);
        });
    },

    computed: {
        filteredWorkouts: function() {
            if (this.searchText) {
                return this.userWorkouts.filter(recentWorkout => {
                    return recentWorkout.name
                        .toLowerCase()
                        .includes(this.searchText.toLowerCase());
                });
            } else {
                return this.userWorkouts;
            }
        },

        filteredTemplates: function() {
            if (this.searchText) {
                return this.userTemplates.filter(template => {
                    return template.name
                        .toLowerCase()
                        .includes(this.searchText.toLowerCase());
                });
            } else {
                return this.userTemplates;
            }
        }
    }
};
</script>
