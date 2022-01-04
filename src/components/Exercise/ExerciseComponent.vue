<template>
    <b-card no-body>
        <div v-if="!isLoading">
            <div v-if="imageUrls.length > 1">
                <b-carousel v-model="carouselModel" controls indicators :interval="0">
                    <b-aspect
                        ><b-carousel-slide v-for="(img, index) in imageUrls" :key="index" :img-src="img"
                    /></b-aspect>
                </b-carousel>
            </div>
            <div v-else-if="imageUrls.length > 0">
                <b-img :src="imageUrls[0]" fluid-grow />
            </div>
            <div v-else-if="video.url">
                <VideoPlayer class="video-player" :options="video.options" :token="video.token" :id="video.id" />
            </div>

            <b-card-body>
                <b-card-title>
                    <div class="d-flex align-item-center">
                        <div><router-link :to="'/exercises/' + exerciseId">{{exerciseData.name}}</router-link></div>
                        <div class="ml-auto font-small">
                            <b-dropdown class="exercise-component-dropdown" variant="outline">
                                <b-dropdown-item class="exercise-component-dropdown-item" :to="'/exercises/' + exerciseData._id + '/edit'"><b-icon-pencil class="mr-1" /> Edit</b-dropdown-item>
                                <b-dropdown-item class="exercise-component-dropdown-item" @click="infoExpanded = !infoExpanded"><b-icon-info class="mr-1" />Expand</b-dropdown-item>
                            </b-dropdown>
                        </div>
                    </div>
                </b-card-title>
                <b-card-sub-title>{{ exerciseData.createdBy.username }}</b-card-sub-title>
                <b-collapse v-model="infoExpanded" class="mt-2">
                    <div class="text-muted font-small">
                        <div>Muscle Groups: {{ exerciseData.muscleGroups.join(", ") }}</div>
                        <div>Tags: <b-badge class="mr-1" variant="dark" v-for="(tag, index) in exerciseData.tags" :key="index">{{ tag }}</b-badge></div>
                        </div>
                </b-collapse>
                <TuiEditorViewer :value="exerciseData.description" />
            </b-card-body>
            <CommentSection
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
            />
        </div>
        <div v-else>
            <b-card-body>
                <b-skeleton
                    v-for="index in skeletonAmount"
                    :key="index"
                    animation="wave"
                    :width="skeletonWidth[index]"
                ></b-skeleton>
            </b-card-body>
        </div>
    </b-card>
</template>

<script>
import { API, graphqlOperation, Storage } from "aws-amplify";
import { getVideoObject } from "@/graphql/queries";
import awsvideoconfig from "@/aws-video-exports";

import VideoPlayer from "@/components/Video/VideoPlayer.vue";
import CommentSection from "@/components/Comment/CommentSection.vue";

export default {
    name: "ExerciseComponent",
    components: { CommentSection, VideoPlayer },
    props: {
        exerciseId: {
            type: String,
            required: true
        },
        skeletonAmount: {
            type: Number,
            required: true
        },
        skeletonWidth: {
            type: Array,
            required: true
        }
    },

    data() {
        return {
            isLoading: true,
            exerciseData: {},
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
            infoExpanded: false,

            // Bootstrap:
            carouselModel: 0
        };
    },

    created: function() {
        if (this.$props.exerciseId) {
            this.downloadExercise();
        }
    },

    methods: {
        downloadExercise: async function() {
            try {
                const path = "/exercise/" + this.$props.exerciseId;
                const myInit = {
                    headers: {
                        Authorization: await this.$store.dispatch("fetchJwtToken")
                    },
                    queryStringParameters: {
                        counters: true
                    }
                };

                const response = (await API.get(this.$store.state.apiName, path, myInit)).data;

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

                try {
                    let urlPromises = [];

                    this.exerciseData.filePaths.forEach(async path => {
                        if (path.type === "video") {
                            const videoObject = {
                                id: path.key
                            }

                            const response = await API.graphql(graphqlOperation(getVideoObject, videoObject));

                            this.video.token = response.data.getVideoObject.token;
                            this.video.id = path.key;
                            this.video.url = "https://" + awsvideoconfig.awsOutputVideo + "/" + this.video.id + "/" + this.video.id + ".m3u8";

                            this.video.options = {
                                autoplay: false,
                                controls: true,
                                sources: [
                                    {
                                        src: this.video.url
                                    }
                                ]
                            }
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
                } finally {
                    if (this.exerciseData) {
                        this.isLoading = false;
                    }
                }
            } catch (err) {
                console.error("Error downloading exercise:", this.$props.exerciseId, err);
            }
        },

        handleLike: function(x) {
            if (x > 0) {
                this.likeCount++;
                this.isLiked = true;
            } else {
                this.likeCount--;
                this.isLiked = false;
            }
        },

        handleFollow: function(x) {
            if (x > 0) {
                this.followCount++;
                this.isFollowed = true;
            } else {
                this.followCount--;
                this.isFollowed = false;
            }
        }
    },

    watch: {
        exerciseId: function(n, o) {
            if (n && !o) {
                this.downloadExercise();
            }
        }
    }
};
</script>

<style>
.componentLink:hover {
    cursor: pointer;
}

.font-small {
    font-size: 12px !important;
}

.exercise-component-dropdown-item a {
    font-size: 12px !important;
    padding-left: 0.75rem !important
}

.exercise-component-dropdown button {
    box-shadow: none !important;
    padding: 0 !important;
}
</style>
