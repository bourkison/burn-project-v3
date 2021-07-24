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
                                    <span v-if="exerciseData.createdBy.userId === this.$store.state.userProfile.docData._id">
                                        <b-dropdown-item :to="'/exercises/' + exerciseData._id + '/edit'">Edit</b-dropdown-item>
                                        <b-dropdown-item @click="confirmDeleteExercise" :disabled="isDeleting" variant="danger">
                                            <div v-if="!isDeleting">Delete</div>
                                            <div v-else class="text-center"><b-spinner small /></div>
                                        </b-dropdown-item>
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
                        <div v-if="imageUrls.length > 1">
                            <b-carousel v-model="carouselModel" controls indicators :interval="0">
                                <b-aspect><b-carousel-slide v-for="img in imageUrls" :key="img" :img-src="img" /></b-aspect>
                            </b-carousel>
                        </div>
                        <div v-else-if="imageUrls.length > 0">
                            <b-img :src="imageUrls[0]" fluid-grow />
                        </div>
                        <b-card-body>
                            <b-card-text>
                                <Viewer :initialValue="exerciseData.description" />
                            </b-card-text>
                        </b-card-body>
                        <CommentSection :_id="exerciseData._id" coll="exercise" :followableComponent="true" />
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

        <b-modal v-model="modalIsDeleting" title="Please Confirm" @ok="deleteExercise" ok-variant="danger" centered button-size="sm" :ok-title-html="isDeleting ? '<b-spinner />' : 'Ok'">
            <div>Are you sure you want to delete this exercise? This can not be undone.</div>

            <template #modal-footer="{ ok, cancel }">
                <b-button size="sm" @click="cancel">
                    <div>Cancel</div>
                </b-button>

                <b-button size="sm" variant="danger" @click="ok" :disabled="isDeleting">
                    <div v-if="!isDeleting">OK</div>
                    <div v-else><b-spinner small /></div>
                </b-button>
            </template>
        </b-modal>
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

import { Viewer } from '@toast-ui/vue-editor';
import { API, Storage } from 'aws-amplify';

import CommentSection from '@/components/Comment/CommentSection.vue';
import ExerciseChart from '@/components/Charts/ExerciseChart.vue';
import MuscleGroup from '@/components/Utility/MuscleGroup.vue';

export default {
    name: 'ExerciseView',
    components: { CommentSection, MuscleGroup, Viewer, ExerciseChart },
    data() {
        return {
            isLoading: true,
            isDeleting: false,
            exerciseExists: false,

            exerciseData: null,
            imageUrls: [],

            // Bootstrap:
            carouselModel: 0,
            variants: ["success", "danger", "warning", "info", "dark"],
            modalIsDeleting: false,
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
            try {
                this.isLoading = true;
                this.exerciseExists = false;
                this.exerciseData = null;
                this.carouselModel = 0;
    
                const path = '/exercise/' + this.$route.params.exerciseid;
                const myInit = {
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": this.$store.state.userProfile.data.idToken.jwtToken
                    }
                }
    
                const response = await API.get(this.$store.state.apiName, path, myInit);
                this.exerciseData = response.data;

                if (this.exerciseData) {
                    console.log("EXERCISE DOWNLOAD SUCCESS:", this.exerciseData);
                    this.exerciseExists = true;
                } else {
                    throw new Error("Exercise does not exist");
                }

                try {
                    if (this.exerciseData.filePaths) {
                        let urlPromises = [];

                        this.exerciseData.filePaths.forEach(path => {
                            urlPromises.push(Storage.get(path))
                        })

                        const imageUrls = await Promise.all(urlPromises);

                        imageUrls.forEach(url => {
                            this.imageUrls.push(url);
                        })
                    }
                }

                catch (err) {
                    console.error("Error getting image URLs:", err);
                }
            }
            catch (err) {
                console.error(err);
            }
            finally {
                this.isLoading = false;
            }
        },

        confirmDeleteExercise: function() {
            this.modalIsDeleting = true;
        },

        deleteExercise: async function(e) {
            e.preventDefault();

            this.isDeleting = true;

            const path = '/exercise/' + this.$route.params.exerciseid;
            const myInit = {
                headers: {
                    Authorization: this.$store.state.userProfile.data.idToken.jwtToken
                }
            }

            const response = await API.del(this.$store.state.apiName, path, myInit);
            console.log("Deletion success!", response);

            this.isDeleting = false;
            this.modalIsDeleting = false;
            this.$router.push("/exercises");
        }
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