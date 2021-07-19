<template>
    <div>
        <b-form-input v-model="searchText" placeholder="Search workouts..." />

        <div v-if="!isLoading">
            <div v-if="filteredWorkouts.length > 0" class="mt-3">
                <b-list-group>
                    <b-list-group-item class="d-flex" align-v="center" v-for="workout in filteredWorkouts" :key="workout.id" @click="selectWorkout(workout)" href="#">
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
import { userWorkoutsCollection } from '@/firebase'

export default {
    name: 'WorkoutSearch',
    data() {
        return {
            isLoading: true,
            searchText: '',
            workouts: []
        }
    },

    created: function() {
        userWorkoutsCollection(this.$store.state.userProfile.data.uid).get()
        .then(workoutSnapshot => {
            // Only push most recent of each workout.
            let uniqueNames = [];
            workoutSnapshot.forEach(workout => {
                let data = workout.data();
                if (!uniqueNames.includes(data.name)) {
                    data.id = workout.id;
                    this.workouts.push(data);
                    uniqueNames.push(data.name)
                }
            })

            this.isLoading = false;
        })
        .catch(e => {
            console.error("Error downloading workouts:", e);
        })
    },

    computed: {
        filteredWorkouts: function() {
            if (this.searchText) {
                return this.workouts.filter(workout => {
                    return workout.name.toLowerCase().includes(this.searchText.toLowerCase());
                })
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

}
</script>