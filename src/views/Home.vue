<template>
    <b-container>
        <b-row>
            <b-col sm="3">
                <RecentWorkoutsChart class="recentWorkoutsChart" :userId="$store.state.userProfile.data.uid" />
                <OneRepMaxExerciseChart class="oneRepMaxExerciseChart" :exercisePosition="0" :userId="$store.state.userProfile.data.uid" />
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
</template>

<script>
import PostFeedHome from '@/components/Post/PostFeedHome.vue'
import RecentWorkoutsChart from '@/components/Charts/RecentWorkoutsChart.vue'
import OneRepMaxExerciseChart from '@/components/Charts/OneRepMaxExerciseChart.vue'

export default {
    name: 'Home',
    components: { OneRepMaxExerciseChart, PostFeedHome, RecentWorkoutsChart }
}
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
    line-height: 250px
}

.recentWorkoutsChart,
.oneRepMaxExerciseChart {
    margin-top: 25px;
}
</style>