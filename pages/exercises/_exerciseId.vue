<template>
    <b-container v-if="!isLoading && exerciseExists" class="mb-5">
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
                                >
                                    <span
                                        v-if="
                                            exerciseData.createdBy.userId ===
                                                this.$store.state.userProfile.docData._id
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
                        <div v-if="imageUrls.length > 1">
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
                            <!-- <VideoPlayer
                                class="video-player"
                                :options="video.options"
                                :token="video.token"
                                :id="video.id"
                            /> -->
                        </div>
                        <b-card-body>
                            <b-card-text>
                                <TuiEditorViewer :initialValue="exerciseData.description" />
                            </b-card-text>
                        </b-card-body>
                        <!-- <CommentSection
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
                        /> -->
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
                                    <b-icon-star-fill
                                        v-for="star in exerciseData.difficulty"
                                        :key="star"
                                        font-scale="2"
                                        variant="warning"
                                    ></b-icon-star-fill>
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
                                    <b-badge
                                        class="tags"
                                        v-for="(tag, index) in exerciseData.tags"
                                        :key="index"
                                        :variant="variants[index]"
                                        >{{ tag }}</b-badge
                                    >
                                </div>
                            </b-card-text>
                        </b-card-body>
                    </b-card>

                    <!-- <Chart
                        class="performanceChart"
                        :editable="true"
                        :saveable="false"
                        :persistent="false"
                        :username="$store.state.userProfile.docData.username"
                        :options="chartOptions"
                        :index="0"
                        position="exerciseView"
                        @updateChart="updateChart"
                    /> -->
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
    <b-container v-else-if="!isLoading && !exerciseExists">
        <!-- 404 -->
        <div>Exercise does not exist!</div>
    </b-container>
    <b-container v-else>
        <div style="margin-top:40px;" class="text-center"><b-spinner /></div>
    </b-container>
</template>

<script>
import { API, graphqlOperation, Storage } from "aws-amplify";
import { getVideoObject } from "@/graphql/queries";
import awsvideoconfig from "@/aws-video-exports";

import MuscleGroup from "@/components/Utility/MuscleGroup.vue";


export default {
    components: { MuscleGroup },
    data() {
        return {
            isLoading: true,
            isDeleting: false,
            exerciseExists: false,

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
            chartOptions: {
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
            },

            // Bootstrap:
            carouselModel: 0,
            variants: ["success", "danger", "warning", "info", "dark"],
            modalIsDeleting: false
        };
    },
    head() {
        return {
            title: this.$route.params.exerciseId,
            meta: [
                {
                    hid: "description",
                    name: "description",
                    content: this.$route.params.exerciseId + " tutorial"
                }
            ]
        }
    },
    async fetch() {
        try {
                this.isLoading = true;
                this.exerciseExists = false;
                this.exerciseData = null;
                this.carouselModel = 0;

                const path = "/exercise/" + this.$route.params.exerciseid;
                const myInit = {
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: await this.$store.dispatch("fetchJwtToken")
                    },
                    queryStringParameters: {
                        counters: true
                    }
                };

                const response = (await API.get(this.$store.state.apiName, path, myInit)).data;

                this.chartOptions.data.exercise = {
                    exerciseId: response._id,
                    createdBy: response.createdBy,
                    name: response.name,
                    filePaths: response.filePaths,
                    tags: response.tags,
                    muscleGroups: response.muscleGroups
                };
                this.chartOptions.exerciseId = response._id;

                this.exerciseData = {
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

                this.likeCount = response.likeCount;
                this.commentCount = response.commentCount;
                this.followCount = response.followCount;
                this.isLiked = response.isLiked;
                this.isFollowed = response.isFollowed;
                this.isFollowable = response.isFollowable;

                if (this.exerciseData) {
                    console.log("EXERCISE DOWNLOAD SUCCESS:", this.exerciseData);
                    this.exerciseExists = true;
                } else {
                    throw new Error("Exercise does not exist");
                }

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
            } catch (err) {
                console.error(err);
            } finally {
                this.isLoading = false;
            }
    },
    fetchOnServer: true,
    created() {
        console.log("PARAMS", this.$route.params);
    }
}
</script>

<style>

</style>