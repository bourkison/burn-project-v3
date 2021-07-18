<template>
    <b-container>
        <b-row>
            <b-col sm="3">
                <b-card class="navCard" no-body>
                    <b-list-group>
                        <b-list-group-item class="navItem" to="/burn" active-class="unset" exact-active-class="active">
                            <div class="d-flex align-items-center">
                                Burn
                                <b-icon-house class="ml-auto" />
                            </div>
                        </b-list-group-item>
                        <b-list-group-item class="navItem" to="/burn/recent" active-class="unset" exact-active-class="active">
                            <div class="d-flex align-items-center">
                                Recent
                                <b-icon-search class="ml-auto" />
                            </div>
                        </b-list-group-item>
                        <b-list-group-item class="navItem" to="/burn/new" active-class="active" exact-active-class="active">
                            <div class="d-flex align-items-center">
                                New Burn
                                <b-icon-plus class="ml-auto" />
                            </div>
                        </b-list-group-item>
                    </b-list-group>
                </b-card>

                <RecentWorkoutsChart :userId="$store.state.userProfile.data.uid" />
            </b-col>

            <b-col sm="6">
                <router-view class="centerCol"></router-view>
            </b-col>

            <b-col sm="3">
                <!--  -->
            </b-col>
        </b-row>
    </b-container>
</template>

<script>
import RecentWorkoutsChart from '@/components/Charts/RecentWorkoutsChart.vue'

export default {
    name: 'Burn',
    components: { RecentWorkoutsChart }
}
</script>

<style scoped>
.navCard {
    margin-top: 40px;
}

.centerCol {
    margin-top: 40px;
}
</style>