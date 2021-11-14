<template>
    <b-container v-if="$store.state.userProfile.loggedIn">
        <b-row>
            <b-col sm="3">
                <QuickStart class="quickStart" />
                <div v-for="(chart, index) in $store.state.userProfile.docData.options.charts.homepage.leftRail" :key="index">
                    <div v-if="chart.category === 'workout' && chart.type === 'recent'">
                        <RecentWorkoutsChart
                            class="recentWorkoutsChart"
                            :username="$store.state.userProfile.docData.username"
                            :chartOptions="chart"
                        />
                    </div>
                    <div v-else-if="chart.category === 'exercise' && chart.type === 'favorite'">
                        <OneRepMaxExerciseChart
                            class="oneRepMaxExerciseChart"
                            :username="$store.state.userProfile.docData.username"
                            position="homepageLeftRail"
                            :index="index"
                            :chartOptions="chart"
                        />
                    </div>
                </div>
            </b-col>
            <b-col sm="6">
                <b-container v-if="$store.state.userProfile.loggedIn">
                    <PostFeedHome />
                </b-container>
                <b-container v-else>
                    Log in to get started!
                </b-container>
            </b-col>
            <b-col sm="3">
                <div class="adTestCont">
                    <div class="adTest bg-warning text-center">
                        Homepage Ad Here.
                    </div>
                </div>
            </b-col>
        </b-row>
    </b-container>
    <b-container v-else>
        Sign Up or Sign In to get Started!
    </b-container>
</template>

<script>
import QuickStart from "@/components/Utility/QuickStart.vue";
import PostFeedHome from "@/components/Post/PostFeedHome.vue";
import RecentWorkoutsChart from "@/components/Charts/RecentWorkoutsChart.vue";
import OneRepMaxExerciseChart from "@/components/Charts/OneRepMaxExerciseChart.vue";

export default {
    name: "Home",
    components: { OneRepMaxExerciseChart, PostFeedHome, RecentWorkoutsChart, QuickStart }
};
</script>

<style scoped>
.adTestCont {
    height: 1000px;
}

.adTest {
    position: sticky;
    top: 100px;
    height: 250px;
    width: 300px;
    padding: 0;
    margin-top: 40px;
    line-height: 250px;
}

.quickStart,
.recentWorkoutsChart,
.oneRepMaxExerciseChart {
    margin-top: 25px;
}
</style>
