<template>
    <b-card no-body>
        <b-card-body>
            <div class="d-flex" align-v="center">
                <div><h5>{{ burn.name }}</h5></div>
                <div class="ml-auto text-muted font-weight-light" align-v="center"><p class="subs">{{ durationText }} | {{ createdAtText }}</p></div>
            </div>

            <b-card-text class="mt-3">
                <b-row class="text-center font-weight-bold">
                    <b-col cols="1">#</b-col>
                    <b-col cols="5">Exercise Name</b-col>
                    <b-col cols="3">Kg</b-col>
                    <b-col cols="3">Reps</b-col>
                </b-row>

                <b-row class="text-center mt-1" v-for="(exercise, index) in burn.exercises" :key="index">
                    <b-col cols="1">{{ exercise.sets.length }}</b-col>

                    <b-col cols="5">
                        <router-link :to="'/exercises/' + exercise.id">{{ exercise.name }}</router-link>
                    </b-col>

                    <b-col cols="3">
                        {{ exercise.sets[0].kg }}
                    </b-col>

                    <b-col cols="3">
                        {{ exercise.sets[0].measureAmount }}
                    </b-col>
                </b-row>

                <div class="text-center mt-3">
                    <b-button variant="outline-success" size="sm" :to="'/burn/new?b=' + burn.id">
                        Start Workout
                        <b-icon-play />
                    </b-button>
                </div>
            </b-card-text>
        </b-card-body>
    </b-card>
</template>

<script>
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'

export default {
    name: 'BurnComponent',
    props: {
        burn: {
            type: Object,
            required: true
        }
    },
    data() {
        return {
            createdAtText: '',
            durationText: '',
        }
    },

    created: function() {
        dayjs.extend(relativeTime);
        

        this.createdAtText = dayjs(dayjs.unix(this.$props.burn.createdAt.seconds)).fromNow();

        // Duration text:
        let hours = Math.floor((this.$props.burn.duration % (1000 * 60 * 60 * 24)) / (1000 * 60 * 24));
        let minutes = (Math.floor((this.$props.burn.duration % (1000 * 60 * 60)) / (1000 * 60))).toLocaleString('en-US', { minimumIntegerDigits: 2, useGrouping: false });
        let seconds = (Math.floor((this.$props.burn.duration % (1000 * 60)) / 1000)).toLocaleString('en-US', { minimumIntegerDigits: 2, useGrouping: false });

        if (!hours) {
            this.durationText = minutes + ":" + seconds;
        } else {
            this.durationText = hours + ":" + minutes + ":" + seconds;
        }
    }
}
</script>

<style scoped>
.subs {
    font-size: 12px;
    line-height: 32px;
    margin: 0;
}
</style>