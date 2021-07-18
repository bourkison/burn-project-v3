<template>
    <b-container>
        <b-row>
            <b-col sm="3">
                <!-- 
                    Add here: 
                    - Links to Home, New, Discover
                    - Filter by (tags)
                -->
                <b-card class="navCard" no-body>
                        <b-list-group>
                            <b-list-group-item class="navItem" ref="homeExerciseLink" to="/exercises" active-class="unset" exact-active-class="active">
                                <div class="d-flex align-items-center">
                                    Exercises
                                    <b-icon-house class="ml-auto" />
                                </div>
                            </b-list-group-item>
                            <b-list-group-item class="navItem" ref="discoverExerciseLink" to="/exercises/discover" active-class="unset" exact-active-class="active">
                                <div class="d-flex align-items-center">
                                    Discover
                                    <b-icon-search class="ml-auto"/>
                                </div>
                            </b-list-group-item>
                            <b-list-group-item class="navItem" to="/exercises/new" active-class="unset" exact-active-class="active">
                                <div class="d-flex align-items-center">
                                    New
                                    <b-icon-plus class="ml-auto"/>
                                </div>
                            </b-list-group-item>
                        </b-list-group>
                </b-card>
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
}
</script>

<style scoped>
.navCard {
    margin-top: 40px;
}
</style>