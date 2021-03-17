<template>
    <b-container>
        <b-card no-body>
            <b-card-body v-if="!isLoading">
                <b-card-title>Burns</b-card-title>
                <b-form-input placeholder="Search for a burn or workout..." v-model="searchText"></b-form-input>
                <b-card-text>
                    <b-container class="mt-3">
                        <div v-if="filteredBurns.length > 0">
                            <h5>Recent Burns</h5>
                            <b-list-group class="mt-2 mb-2">
                                <b-list-group-item class="d-flex" align-v="center" :to="'/burn/new?b=' + burn.id" v-for="burn in filteredBurns" :key="burn.id">
                                    <div>{{ burn.name }}</div>
                                    <div class="ml-auto text-muted" style="font-size:12px;line-height:2;">{{ burn.createdAtText }}</div>
                                </b-list-group-item>
                            </b-list-group>
                        </div>

                        <div v-if="filteredWorkouts.length > 0" class="mt-3">
                            <h5>Followed Workouts</h5>
                            <b-list-group class="mt-2 mb-2">
                                <b-list-group-item class="d-flex" align-v="center" :to="'/burn/new?w=' + workout.id" v-for="workout in filteredWorkouts" :key="workout.id">
                                    <div>{{ workout.name }}</div>
                                    <div class="ml-auto text-muted" style="font-size:12px;line-height:2;">{{ workout.createdBy.username }}</div>
                                </b-list-group-item>
                            </b-list-group>
                        </div>
                    </b-container>
                </b-card-text>
            </b-card-body>

            <b-card-body v-else>
                <b-spinner small />
            </b-card-body>
        </b-card>
    </b-container>
</template>

<script>
import { db } from '@/firebase'

import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'

export default {
    name: 'BurnView',
    data() {
        return {
            isLoading: true,

            userWorkouts: [],
            userBurns: [],

            searchText: ''
        }
    },

    created: function() {
        dayjs.extend(relativeTime);
        let promises = [];

        // First download user workouts.
        promises.push(db.collection("users").doc(this.$store.state.userProfile.data.uid).collection("workouts").orderBy("createdAt", "desc").get()
        .then(workoutSnapshot => {
            let workoutPromises = [];

            workoutSnapshot.forEach(workout => {
                workoutPromises.push(db.collection("workouts").doc(workout.id).get())
            })

            return Promise.all(workoutPromises)
            .then(workoutDocs => {
                workoutDocs.forEach(workoutDoc => {
                    let data = workoutDoc.data();
                    data.id = workoutDoc.id;

                    this.userWorkouts.push(data);
                })
            })
        }))

        // Then download user burns.
        promises.push(db.collection("users").doc(this.$store.state.userProfile.data.uid).collection("burns").orderBy("createdAt", "desc").get()
        .then(burnSnapshot => {
            let uniqueNames = [];

            burnSnapshot.forEach(burn => {
                let data = burn.data();
                data.id = burn.id;

                if (!uniqueNames.includes(data.name)) {
                    data.createdAtText = dayjs(dayjs.unix(data.createdAt.seconds)).fromNow();
                    this.userBurns.push(data);
                    uniqueNames.push(data.name);
                }
            })
        }))

        Promise.all(promises)
        .then(() => {
            this.isLoading = false;
            console.log("Burns:", this.userBurns);
            console.log("Workouts:", this.userWorkouts);
        })
    },

    computed: {
        filteredBurns: function() {
            if (this.searchText) {
                return this.userBurns.filter(recentBurn => {
                    return recentBurn.name.toLowerCase().includes(this.searchText.toLowerCase());
                })
            } else {
                return this.userBurns
            }
        },

        filteredWorkouts: function() {
            if (this.searchText) {
                return this.userWorkouts.filter(workout => {
                    return workout.name.toLowerCase().includes(this.searchText.toLowerCase());
                })
            } else {
                return this.userWorkouts;
            }
        }
    }
}
</script>