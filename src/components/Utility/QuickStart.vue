<template>
    <div>
        <b-card no-body class="no-bot-border bbr-0">
            <b-card-body class="pb-1">
                <b-card-title title-tag="h6">Quick Start</b-card-title>
            </b-card-body>
        </b-card>
        <div>
            <b-list-group>
                <b-list-group-item to="/workout/new" class="s-font btr-0" v-if="!$store.state.activeWorkout.workoutCommenced">
                    <span
                        class="d-flex align-items"
                    >
                        <span>New Workout</span>
                        <span class="ml-auto"><b-icon-plus /></span>
                    </span>
                </b-list-group-item>
                <b-list-group-item :to="$store.state.activeWorkout.initialUrl" class="s-font btr-0" v-else>
                    <span class="d-flex align-items">
                        <span>Resume Workout</span>
                        <span class="ml-auto"><b-icon-play /></span>
                    </span>
                </b-list-group-item>
                <b-list-group-item
                    v-for="workout in $store.state.userProfile.docData.workouts"
                    :key="workout._id"
                    :to="'/workout/new?b=' + workout._id"
                    class="s-font d-flex align-items"
                    :disabled="$store.state.activeWorkout.workoutCommenced"
                >
                    <span>{{ workout.name }}</span>
                    <span class="ml-auto text-muted xs-font">
                        {{ createdAtText(workout.createdAt) }}
                    </span>
                </b-list-group-item>
            </b-list-group>
        </div>
    </div>
</template>

<script lang="ts">
import Vue from "vue";

import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

export default Vue.extend({
    name: "QuickStart",
    created() {
        dayjs.extend(relativeTime);
    },

    methods: {
        createdAtText(date: string): string {
            return dayjs(date).fromNow();
        }
    }
});
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
