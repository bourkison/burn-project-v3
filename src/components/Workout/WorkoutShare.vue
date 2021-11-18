<template>
    <b-container>
        <div v-if="!isLoading">
            <b-row class="text-center font-weight-bold">
                <b-col cols="1">#</b-col>
                <b-col cols="5">Exercise Name</b-col>
                <b-col cols="3">Kg</b-col>
                <b-col cols="3">Reps</b-col>
            </b-row>

            <div v-for="(exercise, index) in workout.recordedExercises" :key="index">
                <b-row class="text-center mt-1">
                    <b-col
                        cols="1"
                        class="setAmountHoverable"
                        v-b-toggle="'setsCollapse-' + workout._id + index"
                        >{{ exercise.sets.length }}</b-col
                    >

                    <b-col cols="5">
                        <router-link :to="'/exercises/' + exercise.exerciseReference.exerciseId">{{
                            exercise.exerciseReference.name
                        }}</router-link>
                    </b-col>

                    <b-col cols="3">
                        {{ exercise.sets[0].kg }}
                    </b-col>

                    <b-col cols="3">
                        {{ exercise.sets[0].measureAmount }}
                    </b-col>
                </b-row>

                <b-collapse :id="'setsCollapse-' + workout._id + index">
                    <b-row
                        v-for="(set, index) in exercise.sets"
                        :key="index"
                        class="text-center mt-1 text-muted font-weight-light"
                    >
                        <b-col cols="1"></b-col>
                        <b-col cols="5">{{ index + 1 }}</b-col>
                        <b-col cols="3">{{ exercise.sets[index].kg }}</b-col>
                        <b-col cols="3">{{ exercise.sets[index].measureAmount }}</b-col>
                    </b-row>
                </b-collapse>
            </div>
        </div>
        <div v-else class="text-center">
            <b-spinner small />
        </div>
    </b-container>
</template>

<script>
import { API } from "aws-amplify";

export default {
    name: "WorkoutShare",
    props: {
        workoutId: {
            type: String,
            required: true
        },
        username: {
            type: String,
            required: true
        }
    },
    data() {
        return {
            isLoading: true,
            workout: {}
        };
    },

    created: function() {
        this.downloadWorkout();
    },

    methods: {
        downloadWorkout: async function() {
            try {
                const path = "/workout/" + this.$props.workoutId;
                const myInit = {
                    headers: {
                        Authorization: await this.$store.dispatch("fetchJwtToken")
                    },
                    queryStringParameters: {
                        username: this.$props.username
                    }
                }
    
                const response = (await API.get(this.$store.state.apiName, path, myInit)).data;
                this.workout = response;
            }
            catch (err) {
                if (err.response && err.response.status === 404) {
                    console.error("Workout not found")
                } else {
                    // ERROR HERE
                    console.error(err);
                }
            }
            finally {
                this.isLoading = false;
            }
        }
    },

    watch: {
        workoutId: function() {
            this.downloadWorkout();
        }
    }
};
</script>

<style scoped>
.setAmountHoverable:hover {
    cursor: pointer;
    text-decoration: underline;
}

/* Disable highlight */
.setAmountHoverable {
    -webkit-touch-callout: none; /* iOS Safari */
    -webkit-user-select: none; /* Safari */
    -khtml-user-select: none; /* Konqueror HTML */
    -moz-user-select: none; /* Old versions of Firefox */
    -ms-user-select: none; /* Internet Explorer/Edge */
    user-select: none; /* Non-prefixed version, currently supported by Chrome, Edge, Opera and Firefox */
}
</style>
