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

<script lang="ts">
import Vue, { PropType } from "vue"
import { Workout } from "@/types/workout";

export default Vue.extend({
    name: "WorkoutShare",
    props: {
        workoutId: {
            type: String as PropType<string>,
            required: true
        },
        username: {
            type: String as PropType<string>,
            required: true
        }
    },
    data() {
        return {
            isLoading: true,
            workout: null as Workout | null
        };
    },

    created() {
        this.downloadWorkout();
    },

    methods: {
        async downloadWorkout() {
            try {
                const init = {
                    queryStringParameters: {
                        username: this.$props.username
                    }
                }
    
                this.workout = await this.$accessor.api.getWorkout({ workoutId: this.workoutId, init });
            }
            catch (err: any) {
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
        workoutId() {
            this.downloadWorkout();
        }
    }
});
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
