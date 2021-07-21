<template>
    <b-container v-if="!isLoading && exerciseExists">
        <b-row align-v="center">
            <b-col sm="8">
                <b-container class="exerciseCard mainCard">
                    <b-card no-body>
                        <b-card-body>
                            <b-card-title>
                                {{ exerciseData.name }}
                                <b-dropdown right class="float-right" variant="outline">
                                    <span v-if="exerciseData.createdBy._id === this.$store.state.userProfile.docData._id">
                                        <b-dropdown-item :to="'/exercises/' + exerciseData._id + '/edit'">Edit</b-dropdown-item>
                                        <b-dropdown-item variant="danger">Delete</b-dropdown-item>
                                    </span>
                                    <span v-else>
                                        <b-dropdown-item variant="danger">Report</b-dropdown-item>
                                    </span>
                                </b-dropdown>
                            </b-card-title>
                            <b-card-sub-title>
                                {{ exerciseData.createdBy.username }}
                            </b-card-sub-title>
                        </b-card-body>
                        <div v-if="exerciseData.filePaths.length > 1">
                            <b-carousel v-model="carouselModel" controls indicators :interval="0">
                                <b-aspect><b-carousel-slide v-for="img in exerciseData.filePaths" :key="img" :img-src="img" /></b-aspect>
                            </b-carousel>
                        </div>
                        <div v-else-if="exerciseData.filePaths.length > 0">
                            <b-img :src="exerciseData.filePaths[0]" fluid-grow />
                        </div>
                        <b-card-body>
                            <b-card-text>
                                <Viewer :initialValue="exerciseData.description" />
                            </b-card-text>
                        </b-card-body>
                        <CommentSection :docId="exerciseData._id" collection="exercises" :followableComponent="true" />
                    </b-card>
                </b-container>
            </b-col>
            <b-col sm="4">
                <!-- Ads Here. -->
                <b-container v-if="!isLoading && exerciseExists">
                    <b-card no-body class="exerciseCard">
                        <b-card-body>
                            <b-card-title>
                                Difficulty
                            </b-card-title>
                            <b-card-text>
                                <div class="text-center stars">
                                    <b-icon-star-fill v-for="star in exerciseData.difficulty" :key="star" font-scale="2" variant="warning"></b-icon-star-fill>
                                </div>
                            </b-card-text>
                        </b-card-body>
                    </b-card>

                    <b-card no-body class="exerciseCard">
                        <b-card-body>
                            <b-card-title>
                                Muscle Groups
                            </b-card-title>
                            <MuscleGroup :selectedGroups="exerciseData.muscleGroups" />
                        </b-card-body>
                    </b-card>

                    <b-card no-body class="exerciseCard">
                        <b-card-body>
                            <b-card-title>
                                Tags
                            </b-card-title>
                            <b-card-text>
                                <div style="text-center">
                                    <b-badge class="tags" v-for="(tag, index) in exerciseData.tags" :key="index" :variant="variants[index]">{{ tag }}</b-badge>
                                </div>
                            </b-card-text>
                        </b-card-body>
                    </b-card>

                    <b-card no-body class="performanceChart">
                        <b-card-body>
                            <b-card-title>Your Performance</b-card-title>

                            <ExerciseChart :exerciseId="exerciseData._id" />
                        </b-card-body>
                    </b-card>
                </b-container>
            </b-col>
        </b-row>
    </b-container>
    <b-container v-else-if="!isLoading && !exerciseExists">
        <!-- 404 -->
        <div>Exercise does not exist!</div>
    </b-container>
    <b-container v-else>
        <div style="margin-top:40px;" class="text-center"><b-spinner /></div>
    </b-container>
</template>

<script>
import '@toast-ui/editor/dist/toastui-editor-viewer.css';

import { Viewer } from '@toast-ui/vue-editor'
// import { db, storage } from '@/firebase'
import { API } from 'aws-amplify'

import CommentSection from '@/components/Comment/CommentSection.vue'
import ExerciseChart from '@/components/Charts/ExerciseChart.vue'
import MuscleGroup from '@/components/Utility/MuscleGroup.vue'

export default {
    name: 'ExerciseView',
    components: { CommentSection, MuscleGroup, Viewer, ExerciseChart },
    data() {
        return {
            isLoading: true,
            exerciseExists: false,

            exerciseData: {},

            // Bootstrap:
            carouselModel: 0,
            variants: ["success", "danger", "warning", "info", "dark"]
        }
    },

    created: function() {
        this.downloadExercise();
    },

    beforeRouteUpdate: function(to, from, next) {
        next();
        this.downloadExercise();
    },

    methods: {
        downloadExercise: async function() {
            this.isLoading = true;
            this.exerciseExists = false;
            this.exerciseData = {};
            this.carouselModel = 0;

            const path = '/exercise/' + this.$route.params.exerciseid;
            const myInit = {
                headers: {
                    Authorization: this.$store.state.userProfile.data.signInUserSession.idToken.jwtToken
                }
            }

            const response = await API.get(this.$store.state.apiName, path, myInit);
            this.exerciseData = response.data;

            if (this.exerciseData) {
                console.log("EXERCISE DOWNLOAD SUCCESS:", this.exerciseData);
                this.exerciseExists = true;
                this.isLoading = false;
            }
        },
    }
}
</script>

<style>
.exerciseCard,
.performanceChart {
    margin-top: 20px;
}

.mainCard {
    margin-bottom: 20px;
}

.tags {
    margin: 2px;
}
</style>