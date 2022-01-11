<template>
    <b-container class="mb-5">
        <b-row align-v="center">
            <b-col sm="8">
                <b-container class="exerciseCard mainCard">
                    <b-card no-body>
                        <b-card-body>
                            <b-card-title>
                                {{ exerciseData.name }}
                                <b-dropdown
                                    right
                                    class="float-right exercise-dropdown exercise-view-dropdown"
                                    variant="outline"
                                    v-if="$store.state.userProfile && $store.state.userProfile.loggedIn"
                                >
                                    <span
                                        v-if="$store.state.userProfile && $store.state.userProfile.docData && 
                                            exerciseData.createdBy.userId ===
                                                $store.state.userProfile.docData._id
                                        "
                                    >
                                        <b-dropdown-item
                                            class="exercise-view-dropdown-item"
                                            :to="'/exercises/' + exerciseData._id + '/edit'"
                                            ><b-icon-pencil class="mr-1" />Edit</b-dropdown-item
                                        >
                                        <b-dropdown-item
                                            class="exercise-view-dropdown-item"
                                            @click="confirmDeleteExercise"
                                            :disabled="isDeleting"
                                            variant="danger"
                                        >
                                            <b-icon-trash class="mr-1" />
                                            <span v-if="!isDeleting">Delete</span>
                                            <span v-else class="text-center">
                                                <b-spinner small />
                                            </span>
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
                        <div v-if="(!$store.state.userProfile || !$store.state.userProfile.loggedIn) && exerciseData.filePaths.length">
                            <div class="text-small text-muted text-center">Login or Sign Up to view images/video.</div>
                        </div>
                        <div v-else-if="imageUrls.length > 1">
                            <b-carousel v-model="carouselModel" controls indicators :interval="0">
                                <b-aspect
                                    ><b-carousel-slide
                                        v-for="img in imageUrls"
                                        :key="img"
                                        :img-src="img"
                                /></b-aspect>
                            </b-carousel>
                        </div>
                        <div v-else-if="imageUrls.length > 0">
                            <b-img :src="imageUrls[0]" fluid-grow />
                        </div>
                        <div v-else-if="video.url">
                            <VideoPlayer
                                class="video-player"
                                :options="video.options"
                                :token="video.token"
                                :id="video.id"
                            />
                        </div>
                        <b-card-body>
                            <DescriptionViewer :value="exerciseData.description" />
                        </b-card-body>
                        <client-only>
                            <CommentSection
                                v-if="$store.state.userProfile && $store.state.userProfile.loggedIn"
                                :docId="exerciseData._id"
                                coll="exercise"
                                :followableComponent="true"
                                :likeCount="likeCount"
                                :commentCount="commentCount"
                                :followCount="followCount"
                                :isLiked="isLiked"
                                :isFollowed="isFollowed"
                                :isFollowable="isFollowable"
                                @like="handleLike(1)"
                                @unlike="handleLike(-1)"
                                @follow="handleFollow(1)"
                                @unfollow="handleFollow(-1)"
                                @addComment="commentCount++"
                            />
                        </client-only>
                    </b-card>
                </b-container>
            </b-col>
            <b-col sm="4">
                <!-- Ads Here. -->
                <b-container>
                    <b-card no-body class="exerciseCard">
                        <b-card-body>
                            <b-card-title>
                                Difficulty
                            </b-card-title>
                            <div>
                                <div class="text-center stars">
                                    <b-icon-star-fill
                                        v-for="star in exerciseData.difficulty"
                                        :key="star"
                                        font-scale="2"
                                        variant="warning"
                                    ></b-icon-star-fill>
                                </div>
                            </div>
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
                            <div>
                                <div style="text-center">
                                    <b-badge
                                        class="tags"
                                        v-for="(tag, index) in exerciseData.tags"
                                        :key="index"
                                        :variant="variants[index]"
                                        >{{ tag }}</b-badge
                                    >
                                </div>
                            </div>
                        </b-card-body>
                    </b-card>

                    <Chart
                        v-if="$store.state.userProfile && $store.state.userProfile.loggedIn"
                        class="performanceChart"
                        :editable="true"
                        :saveable="false"
                        :persistent="false"
                        :username="$store.state.userProfile && $store.state.userProfile.docData ? $store.state.userProfile.docData.username : ''"
                        :options="chartOptions"
                        :index="0"
                        position="exerciseView"
                        @updateChart="updateChart"
                    />
                </b-container>
            </b-col>
        </b-row>

        <b-modal
            v-model="modalIsDeleting"
            title="Please Confirm"
            @ok="deleteExercise"
            ok-variant="danger"
            centered
            button-size="sm"
            :ok-title-html="isDeleting ? '<b-spinner />' : 'Ok'"
        >
            <div>
                Are you sure you want to delete this exercise? This can not be undone.
            </div>

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
</template>

<script>
import { API, graphqlOperation, Storage } from "aws-amplify";
import { getVideoObject } from "@/graphql/queries";
import awsvideoconfig from "@/aws-video-exports";

import CommentSection from "@/components/Comment/CommentSection.vue";
import MuscleGroup from "@/components/Utility/MuscleGroup.vue";
import Chart from "@/components/Charts/Chart.vue";
import VideoPlayer from "@/components/Video/VideoPlayer.vue";
import DescriptionViewer from "@/components/TextEditor/DescriptionViewer.vue";

export default {
    components: { CommentSection, MuscleGroup, Chart, VideoPlayer, DescriptionViewer },
    data() {
        return {
            isDeleting: false,

            exerciseData: null,
            imageUrls: [],
            video: {
                id: "",
                url: "",
                token: "",
                options: {}
            },

            likeCount: 0,
            commentCount: 0,
            followCount: 0,

            isLiked: false,
            isFollowed: false,
            isFollowable: false,

            // Chart
            chartOptions: {},

            // Bootstrap:
            carouselModel: 0,
            variants: ["success", "danger", "warning", "info", "dark"],
            modalIsDeleting: false
        };
    },
    head() {
        return {
            title: this.exerciseData ? "Burn · " + this.exerciseData.name : "Burn · Exercise",
            meta: [
                {
                    hid: "description",
                    name: "description",
                    content: this.$route.params.exerciseId + " tutorial"
                }
            ]
        }
    },

    async asyncData({ params, error, store, req }) {
        let exerciseData = null;
        let chartOptions = {
            type: "exercise",
            startDate: {
                unit: "month",
                amount: 3,
                date: null
            },
            endDate: {
                unit: "day",
                amount: 0,
                date: null
            },
            data: {
                exerciseId: "",
                preferenceIndex: 0,
                dataToPull: "orm"
            },
            interval: "day",
            backgroundColor: "#007bff",
            borderColor: "#007bff",
            pointBackgroundColor: "#007bff"
        };

        let likeCount = 0;
        let commentCount = 0;
        let followCount = 0;
        let isLiked = false;
        let isFollowed = false;
        let isFollowable = false;

        try {
            let response;
            if (store.state.userProfile && store.state.userProfile.loggedIn) {
                const path = "/exercise/" + params.exerciseId;
                const myInit = {
                    headers: {
                        Authorization: await store.dispatch("fetchJwtToken", { req })
                    },
                    queryStringParameters: {
                        counters: true
                    }
                };

                response = (await API.get(store.state.apiName, path, myInit));

                likeCount = response.data.likeCount;
                commentCount = response.data.commentCount;
                followCount = response.data.followCount;
                isLiked = response.data.isLiked;
                isFollowed = response.data.isFollowed;
                isFollowable = response.data.isFollowable;
            } else {
                response = await API.get(store.state.apiName, "/public/exercise/" + params.exerciseId, {});
            }

            if (response.data && response.data._id) {
                response = response.data;
            } else {
                error({ message: "Exercise not found", statusCode: 404 });
            }

            exerciseData = {
                _id: response._id,
                createdBy: response.createdBy,
                description: response.description,
                difficulty: response.difficulty,
                filePaths: response.filePaths,
                measureBy: response.measureBy,
                muscleGroups: response.muscleGroups,
                name: response.name,
                tags: response.tags
            };

            chartOptions.data.exercise = {
                exerciseId: response._id,
                createdBy: response.createdBy,
                name: response.name,
                filePaths: response.filePaths,
                tags: response.tags,
                muscleGroups: response.muscleGroups
            };
            chartOptions.exerciseId = response._id;

            return {
                exerciseData,
                chartOptions,
                likeCount,
                commentCount,
                followCount,
                isLiked,
                isFollowed,
                isFollowable
            }
        }
        catch (err) {
            console.error(err);
            error({ message: err.message, statusCode: (err.response && err.response.status) });
        }
    },

    mounted() {
        if (this.$store.state.userProfile && this.$store.state.userProfile.loggedIn) {
            this.loadImages();
        }
    },

    methods: {
        confirmDeleteExercise() {
            this.modalIsDeleting = true;
        },

        async deleteExercise(e) {
            e.preventDefault();

            this.isDeleting = true;

            const path = "/exercise/" + this.$route.params.exerciseid;
            const myInit = {
                headers: {
                    Authorization: await this.$store.dispatch("fetchJwtToken")
                }
            };

            const response = await API.del(this.$store.state.apiName, path, myInit);
            console.log("Deletion success!", response);

            this.isDeleting = false;
            this.modalIsDeleting = false;
            this.$router.push("/exercises");
        },

        handleLike(x) {
            if (x > 0) {
                this.likeCount++;
                this.isLiked = true;
            } else {
                this.likeCount--;
                this.isLiked = false;
            }
        },

        handleFollow(x) {
            if (x > 0) {
                this.followCount++;
                this.isFollowed = true;
            } else {
                this.followCount--;
                this.isFollowed = false;
            }
        },

        async loadImages() {
            try {
                let urlPromises = [];

                this.exerciseData.filePaths.forEach(async path => {
                    if (path.type === "video") {
                        const videoObject = {
                            id: path.key
                        };

                        const response = await API.graphql(
                            graphqlOperation(getVideoObject, videoObject)
                        );

                        this.video.token = response.data.getVideoObject.token;
                        this.video.id = path.key;
                        const uniqueId = path.key.split("/")[path.key.split("/").length - 1];
                        this.video.url =
                            "https://" +
                            awsvideoconfig.awsOutputVideo +
                            "/" +
                            this.video.id +
                            "/" +
                            uniqueId +
                            ".m3u8";

                        this.video.options = {
                            autoplay: true,
                            controls: true,
                            sources: [
                                {
                                    src: this.video.url
                                }
                            ]
                        };
                    } else if (path.type === "image") {
                        urlPromises.push(Storage.get(path.key));
                    }
                });

                const imageUrls = await Promise.all(urlPromises);

                imageUrls.forEach(url => {
                    this.imageUrls.push(url);
                });
            } catch (err) {
                console.error("Error getting image URLs:", err);
            }
        },

        updateChart(options) {
            this.chartOptions = options;
        }
    }
}
</script>

<style scoped>
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

<style>
.exercise-view-dropdown-item a {
    font-size: 13px !important;
    padding-left: 0.75rem !important
}

.exercise-view-dropdown button {
    box-shadow: none !important;
    padding: 0 !important;
}
</style>