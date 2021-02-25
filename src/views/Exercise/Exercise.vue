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
                                <b-list-group-item class="navItem" ref="homeExerciseLink" @click="$router.push('/exercises')" href="#">
                                    <div class="d-flex align-items-center">
                                        Exercises
                                        <b-icon-house class="ml-auto" />
                                    </div>
                                </b-list-group-item>
                                <b-list-group-item class="navItem" ref="discoverExerciseLink" @click="$router.push('/exercises/discover')" href="#">
                                    <div class="d-flex align-items-center">
                                        Discover
                                        <b-icon-search class="ml-auto"/>
                                    </div>
                                </b-list-group-item>
                                <b-list-group-item class="navItem" @click="$router.push('/exercises/new')" href="#">
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
    name: 'Exercise',
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
                    case "Discover Exercises":
                        this.$refs.homeExerciseLink.$el.classList.remove("active");
                        this.$refs.discoverExerciseLink.$el.classList.add("active");
                        console.log("Discover");
                        break;
                    case "Followed Exercises":
                        this.$refs.homeExerciseLink.$el.classList.add("active");
                        this.$refs.discoverExerciseLink.$el.classList.remove("active");
                        console.log("Followed");
                        break;
                }

                console.log(this.$route.name);
            }
        
    }
}
</script>

<style scoped>
.navItem:hover {
    cursor: pointer;
}
</style>