<template>
    <div>
        <b-form-input v-model="searchText" placeholder="Search workouts..." />

        <div v-if="!isLoading">
            <div v-if="filteredCreatedWorkouts.length > 0" class="mt-3">
                <h6>My Workouts</h6>

                <b-list-group>
                    <b-list-group-item class="d-flex" align-v="center" v-for="workout in filteredCreatedWorkouts" :key="workout.id" @click="selectWorkout(workout)" href="#">
                        <div>{{ workout.name }}</div>
                    </b-list-group-item>
                </b-list-group>
            </div>

            <div v-if="filteredFollowedWorkouts.length > 0" class="mt-3">
                <h6>Followed Workouts</h6>

                <b-list-group>
                    <b-list-group-item class="d-flex" align-v="center" v-for="workout in filteredFollowedWorkouts" :key="workout.id" @click="selectWorkout(workout)" href="#">
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
import { db } from '@/firebase'

export default {
    name: 'WorkoutSearch',
    data() {
        return {
            isLoading: true,
            searchText: '',
            createdWorkouts: [],
            followedWorkouts: []
        }
    },

    created: function() {
        let workoutDownloadPromises = [];

        db.collection("users").doc(this.$store.state.userProfile.data.uid).collection("workouts").get()
        .then(workoutSnapshot => {
            workoutSnapshot.forEach(workoutDoc => {
                let userWorkoutData = workoutDoc.data();
                userWorkoutData.id = workoutDoc.id;

                if (userWorkoutData.isFollow) {
                    workoutDownloadPromises.push(db.collection("workouts").doc(userWorkoutData.id).get().then(workoutDoc => {
                        let workoutData = workoutDoc.data();
                        workoutData.id = workoutDoc.id;

                        this.followedWorkouts.push(workoutData);
                    }))
                } else {
                    workoutDownloadPromises.push(db.collection("workouts").doc(userWorkoutData.id).get().then(workoutDoc => {
                        let workoutData = workoutDoc.data();
                        workoutData.id = workoutDoc.id;

                        this.createdWorkouts.push(workoutData);
                    }))
                }
            })

            return Promise.all(workoutDownloadPromises);
        })
        .then(() => {
            this.isLoading = false;
        })
        .catch(e => {
            console.error("Error downloading workouts:", e);
        })
    },

    computed: {
        filteredCreatedWorkouts: function() {
            if (this.searchText) {
                return this.createdWorkouts.filter(createdWorkout => {
                    return createdWorkout.name.toLowerCase().includes(this.searchText.toLowerCase());
                })
            } else {
                return this.createdWorkouts;
            }
        },

        filteredFollowedWorkouts: function() {
            if (this.searchText) {
                return this.followedWorkouts.filter(followedWorkout => {
                    return followedWorkout.name.toLowerCase().includes(this.searchText.toLowerCase());
                })
            } else {
                return this.followedWorkouts;
            }
        }
    },

    methods: {
        selectWorkout: function(workout) {
            this.$emit("selectWorkout", workout);
        }
    }
}
</script>