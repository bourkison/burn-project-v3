<template>
    <b-container>
        <b-row>
            <b-col sm="3">
                <b-card class="navCard" no-body>
                    <b-list-group>
                        <b-list-group-item
                            class="navItem"
                            to="/workout"
                            active-class="unset"
                            exact-active-class="active"
                        >
                            <div class="d-flex align-items-center">
                                Workout
                                <b-icon-house class="ml-auto" />
                            </div>
                        </b-list-group-item>
                        <b-list-group-item
                            class="navItem"
                            to="/workout/recent"
                            active-class="unset"
                            exact-active-class="active"
                        >
                            <div class="d-flex align-items-center">
                                Recent
                                <b-icon-search class="ml-auto" />
                            </div>
                        </b-list-group-item>
                        <b-list-group-item
                            class="navItem"
                            to="/workout/new"
                            active-class="active"
                            exact-active-class="active"
                        >
                            <div
                                class="d-flex align-items-center"
                                v-if="
                                    !$store.state.activeWorkout
                                        .workoutCommenced ||
                                        $router.currentRoute.name ===
                                            'New Workout'
                                "
                            >
                                New Workout
                                <b-icon-plus class="ml-auto" />
                            </div>
                            <div class="d-flex align-items-center" v-else>
                                Resume Workout
                                <b-icon-play class="ml-auto" />
                            </div>
                        </b-list-group-item>
                    </b-list-group>
                </b-card>

                <!-- <RecentWorkoutsChart
                    class="recentWorkoutsChart"
                    :userId="$store.state.userProfile.data.uid"
                /> -->
            </b-col>

            <b-col sm="6">
                <router-view class="centerCol"></router-view>
            </b-col>

            <b-col sm="3">
                <!-- <OneRepMaxExerciseChart
                    class="firstOneRepMaxExerciseChart"
                    :exercisePosition="0"
                    :userId="$store.state.userProfile.data.uid"
                />
                <OneRepMaxExerciseChart
                    class="oneRepMaxExerciseChart"
                    :exercisePosition="1"
                    :userId="$store.state.userProfile.data.uid"
                /> -->
            </b-col>
        </b-row>
    </b-container>
</template>

<script>
// import RecentWorkoutsChart from "@/components/Charts/RecentWorkoutsChart.vue";
// import OneRepMaxExerciseChart from "@/components/Charts/OneRepMaxExerciseChart.vue";

export default {
    name: "Workout",
    // components: { RecentWorkoutsChart, OneRepMaxExerciseChart }
};
</script>

<style scoped>
.centerCol,
.navCard,
.firstOneRepMaxExerciseChart {
    margin-top: 40px;
}

.recentWorkoutsChart,
.oneRepMaxExerciseChart {
    margin-top: 25px;
}
</style>
