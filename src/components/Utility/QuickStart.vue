<template>
    <div>
        <b-card no-body class="no-bot-border bbr-0">
            <b-card-body class="pb-1">
                <b-card-title><h6>Quick Start</h6></b-card-title>
            </b-card-body>
        </b-card>
        <div>
            <b-list-group>
                <b-list-group-item to="/workout/new" class="s-font btr-0" v-if="!$store.state.activeWorkout.workoutCommenced">
                    <div
                        class="d-flex align-items"
                    >
                        <div>New Workout</div>
                        <div class="ml-auto"><b-icon-plus /></div>
                    </div>
                </b-list-group-item>
                <b-list-group-item :to="$store.state.activeWorkout.initialUrl" class="s-font btr-0" v-else>
                    <div class="d-flex align-items">
                        <div>Resume Workout</div>
                        <div class="ml-auto"><b-icon-play /></div>
                    </div>
                </b-list-group-item>
                <b-list-group-item
                    v-for="workout in $store.state.userProfile.docData.workouts"
                    :key="workout._id"
                    :to="'/workout/new?b=' + workout._id"
                    class="s-font d-flex align-items"
                    :disabled="$store.state.activeWorkout.workoutCommenced"
                >
                    <div>{{ workout.name }}</div>
                    <div class="ml-auto text-muted xs-font">
                        {{ createdAtText(workout.createdAt) }}
                    </div>
                </b-list-group-item>
            </b-list-group>
        </div>
    </div>
</template>

<script>
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

export default {
    name: "QuickStart",
    created: async function() {
        dayjs.extend(relativeTime);
    },

    methods: {
        createdAtText: function(date) {
            return dayjs(date).fromNow();
        }
    }
};
</script>

<style scoped>
.s-font {
    font-size: 14px;
}

.xs-font {
    font-size: 10px;
}

.btr-0 {
    border-top-left-radius: 0 !important;
    border-top-right-radius: 0 !important;
}

.bbr-0 {
    border-bottom-left-radius: 0 !important;
    border-bottom-right-radius: 0 !important;
}

.no-bot-border {
    border-bottom: none !important;
}

.align-items {
    align-items: center;
}
</style>
