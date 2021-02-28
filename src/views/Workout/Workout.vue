<template>
    <b-container>
        <b-row>
            <b-col sm="3">
                <!-- 
                    Add here: 
                    - Links to Home, New, Discover
                    - Filter by (tags)
                -->
                <b-container>
                    <b-card class="navCard" no-body>
                            <b-list-group>
                                <b-list-group-item class="navItem" ref="homeWorkoutLink" @click="$router.push('/workouts')" href="#">
                                    <div class="d-flex align-items-center">
                                        Workouts
                                        <b-icon-house class="ml-auto" />
                                    </div>
                                </b-list-group-item>
                                <b-list-group-item class="navItem" ref="discoverWorkoutLink" @click="$router.push('/workouts/discover')" href="#">
                                    <div class="d-flex align-items-center">
                                        Discover
                                        <b-icon-search class="ml-auto"/>
                                    </div>
                                </b-list-group-item>
                                <b-list-group-item class="navItem" @click="$router.push('/workouts/new')" href="#">
                                    <div class="d-flex align-items-center">
                                        New
                                        <b-icon-plus class="ml-auto"/>
                                    </div>
                                </b-list-group-item>
                            </b-list-group>
                    </b-card>
                </b-container>
            </b-col>
            <b-col sm="6">
                <router-view></router-view>
            </b-col>
            <b-col sm="3">
                <!-- 
                    Ads here.
                 -->
            </b-col>
        </b-row>
    </b-container>
</template>

<script>
export default {
    name: 'Workout',
    mounted: function() {
        this.handleListGroupActive(this.$route.name);
    },

    beforeRouteUpdate: function(to, from, next) {
        this.handleListGroupActive(to.name);
        next();
    },

    methods: {
        handleListGroupActive: function(routeName) {
            switch(routeName) {
                case "Discover Workouts":
                    this.$refs.homeWorkoutLink.$el.classList.remove("active");
                    this.$refs.discoverWorkoutLink.$el.classList.add("active");
                    break;
                case "Followed Workouts":
                    this.$refs.homeWorkoutLink.$el.classList.add("active");
                    this.$refs.discoverWorkoutLink.$el.classList.remove("active");
                    break;
            }

            console.log(this.$route.name);
        }
    }
}
</script>

<style scoped>
.navCard {
    margin-top: 40px;
}
</style>