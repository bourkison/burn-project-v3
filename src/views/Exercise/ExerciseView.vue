<template>
    <b-container v-if="!isLoading && exerciseExists">
        <b-row>
            <b-col sm="8">
                <b-container class="exerciseCard">
                    <b-card no-body>
                        <b-card-body>
                            <b-card-title>
                                {{ exerciseData.name }}
                                <b-dropdown right class="float-right" variant="outline">
                                    <span v-if="exerciseData.createdBy.id === this.$store.state.userProfile.data.uid">
                                        <b-dropdown-item>Edit</b-dropdown-item>
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
                        <div v-if="imgUrls.length > 1">
                            <b-carousel v-model="carouselModel" controls indicators :interval="0">
                                <b-aspect><b-carousel-slide v-for="img in imgUrls" :key="img" :img-src="img" /></b-aspect>
                            </b-carousel>
                        </div>
                        <div v-else-if="imgUrls.length > 0">
                            <b-img :src="imgUrls[0]" fluid-grow />
                        </div>
                        <b-card-body>
                            <b-card-text>
                                <Viewer :initialValue="exerciseData.description" />
                            </b-card-text>
                        </b-card-body>
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
import { db, storage } from '@/firebase'

import MuscleGroup from '@/components/Utility/MuscleGroup.vue'

export default {
    name: 'ExerciseView',
    components: { MuscleGroup, Viewer },
    data() {
        return {
            isLoading: true,
            exerciseExists: false,

            exerciseData: {},
            imgUrls: [],

            // Counters:
            likeCount: 0,
            commentCount: 0,
            followCount: 0,

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
    },

    methods: {
        downloadExercise: function() {
            db.collection("exercises").doc(this.$route.params.exerciseid).get()
            .then(exerciseDoc => {
                if (exerciseDoc.exists) {
                    this.exerciseData = exerciseDoc.data();
                    let imageDownloadPromises = [];

                    this.exerciseData.filePaths.forEach(filePath => {
                        imageDownloadPromises.push(storage.ref(filePath).getDownloadURL());
                    })

                    return Promise.all(imageDownloadPromises);
                } else {
                    this.exerciseExists = false;
                    this.isLoading = false;

                    throw new Error("Exercise does not exist.");
                }
            })
            .then(imgUrls => {
                imgUrls.forEach(url => {
                    this.imgUrls.push(url);
                })

                this.exerciseExists = true;

                // Pull like, comment and follow count.
                return db.collection("exercises").doc(this.$route.params.exerciseid).collection("counters").get()

            })
            .then(counterSnapshot => {
                counterSnapshot.forEach(counter => {
                    console.log(counter.data().likeCount);
                    this.likeCount += counter.data().likeCount;
                    this.commentCount += counter.data().commentCount;
                    this.followCount += counter.data().followCount;
                })

                return this.checkIfLiked()
            })
            .then(() => {
                console.log(this.exerciseData);
                this.isLoading = false;
            })
            .catch(e => {
                console.error("Error downloading exercise:", e);
            })
        },

        checkIfLiked: function() {
            // Check if the user has liked.
            return db.collection("users").doc(this.$store.state.userProfile.data.uid).collection("likes").where("id", "==", this.$route.params.exerciseid).get().then(likeSnapshot => {
                likeSnapshot.forEach(like => {
                    if (like.exists) {
                        this.isLiked = like.id;
                    }
                })
            });
        },
    }
}
</script>

<style>
.exerciseCard {
    margin-top: 20px;
}

.tags {
    margin: 2px;
}
</style>