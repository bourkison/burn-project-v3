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
                                <b-list-group-item ref="homeExerciseLink" @click="$router.push('/exercises')" class="align-items-center">
                                    <div class="align-self-center">
                                        <span class="align-self-center">Exercises</span>
                                        <span class="align-self-center"><b-icon-house class="float-right" /></span>
                                    </div>
                                </b-list-group-item>
                                <b-list-group-item ref="discoverExerciseLink" @click="$router.push('/exercises/discover')">Discover<b-icon-search class="float-right"/></b-list-group-item>
                                <b-list-group-item @click="$router.push('/exercises/new')">New<b-icon-plus class="float-right"/></b-list-group-item>
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
        this.handleListGroupActive();
    },

    beforeRouteUpdate: function(to, from, next) {
        next();
        this.handleListGroupActive();
    },

    methods: {
            handleListGroupActive: function() {
                switch(this.$route.name) {
                    case "Discover Exercises":
                        this.$refs.homeExerciseLink.classList.remove("active");
                        this.$refs.discoverExerciseLink.classList.add("active");
                        console.log("Discover");
                        break;
                    case "Followed Exercises":
                        this.$refs.homeExerciseLink.classList.add("active");
                        this.$refs.discoverExerciseLink.classList.remove("active");
                        console.log("Followed");
                        break;
                }

                console.log(this.$route.name);
            }
        
    }
}
</script>