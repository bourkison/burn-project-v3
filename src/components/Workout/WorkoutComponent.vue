<template>
    <b-card no-body>
        <b-card-body>
            <div class="d-flex" align-v="center">
                <div>
                    <h5>{{ workout.name }}</h5>
                </div>
                <div class="ml-auto text-muted font-weight-light" align-v="center">
                    <span class="subs">{{ durationText }} | {{ createdAtText }}</span>
                </div>
            </div>

            <div class="mt-3">
                <b-row class="text-center font-weight-bold">
                    <b-col cols="1">#</b-col>
                    <b-col cols="5">Exercise Name</b-col>
                    <b-col cols="3">Best Set</b-col>
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
                            <router-link
                                :to="'/exercises/' + exercise.exerciseReference.exerciseId"
                                >{{ exercise.exerciseReference.name }}</router-link
                            >
                        </b-col>

                        <b-col cols="3">
                            {{ exercise.sets[0].weightAmount.toString() + exercise.sets[0].measureBy }}
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
                            <b-col cols="3">{{ exercise.sets[index].weightAmount.toString() + exercise.sets[index].measureBy }}</b-col>
                            <b-col cols="3">{{ exercise.sets[index].measureAmount }}</b-col>
                        </b-row>
                    </b-collapse>
                </div>

                <div class="text-center mt-3">
                    <b-button
                        class="ml-1"
                        variant="outline-success"
                        size="sm"
                        :to="'/workout/new?b=' + workout._id"
                    >
                        Start Workout
                        <b-icon-play />
                    </b-button>
                </div>
            </div>
        </b-card-body>
    </b-card>
</template>

<script>
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

export default {
    name: "WorkoutComponent",
    props: {
        workout: {
            type: Object,
            required: true
        }
    },
    data() {
        return {
            createdAtText: "",
            durationText: ""
        };
    },

    created() {
        dayjs.extend(relativeTime);

        this.createdAtText = dayjs(dayjs(this.$props.workout.createdAt)).fromNow();

        // Duration text:
        let hours = Math.floor(
            (this.$props.workout.duration % (1000 * 60 * 60 * 24)) / (1000 * 60 * 24)
        );
        let minutes = Math.floor(
            (this.$props.workout.duration % (1000 * 60 * 60)) / (1000 * 60)
        ).toLocaleString("en-US", {
            minimumIntegerDigits: 2,
            useGrouping: false
        });
        let seconds = Math.floor(
            (this.$props.workout.duration % (1000 * 60)) / 1000
        ).toLocaleString("en-US", {
            minimumIntegerDigits: 2,
            useGrouping: false
        });

        if (!hours) {
            this.durationText = minutes + ":" + seconds;
        } else {
            this.durationText = hours + ":" + minutes + ":" + seconds;
        }
    }
};
</script>

<style scoped>
.subs {
    font-size: 12px;
    line-height: 32px;
    margin: 0;
}

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
