<template>
    <b-container v-if="$store.state.userProfile.loggedIn">
        <b-row>
            <b-col sm="3">
                <QuickStart class="quickStart" />
                <div v-for="(chart, index) in $store.state.userProfile.docData.options.charts.homepage.leftRail" :key="index">
                    <Chart class="chart" :username="$store.state.userProfile.docData.username" :options="chart" :editable="true" :saveable="true" position="homepageLeftRail" :index="index" />
                </div>
                <div class="mt-5 text-center text-muted">
                    <b-icon-plus-circle class="clickableIcon" font-scale="2" />
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
import Chart from "@/components/Charts/Chart.vue"

export default {
    name: "Home",
    components: { PostFeedHome, Chart, QuickStart }
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
.chart {
    margin-top: 25px;
}

.clickableIcon:hover {
    cursor: pointer;
}
</style>
