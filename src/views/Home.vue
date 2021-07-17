<template>
    <b-container>
        <b-row>
            <b-col sm="3">
                <RecentWorkoutsChart :chartData="rwData" :options="rwOptions" />
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

export default {
    name: 'Home',
    components: { PostFeedHome, RecentWorkoutsChart },
    data() {
        return {
            rwData: {},
            rwOptions: {}
        }
    },

    created: function() {
        this.rwData = {
          labels: [this.getRandomInt(), this.getRandomInt()],
          datasets: [
            {
              label: 'Data One',
              backgroundColor: '#f87979',
              data: [this.getRandomInt(), this.getRandomInt()]
            }, {
              label: 'Data One',
              backgroundColor: '#f87979',
              data: [this.getRandomInt(), this.getRandomInt()]
            }
          ]
        }
    },

    methods: {
        getRandomInt: function() {
            return Math.floor(Math.random() * (50 - 5 + 1)) + 5;
        }
    }
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
</style>