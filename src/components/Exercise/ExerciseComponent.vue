<template>
    <b-card no-body>
        <div v-if="!isLoading">
            <div v-if="imageUrls.length > 1">
                <b-carousel
                    v-model="carouselModel"
                    controls
                    indicators
                    :interval="0"
                >
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

            <b-card-body>
                <b-card-title
                    ><router-link :to="'/exercises/' + exerciseId">{{
                        exerciseData.name
                    }}</router-link></b-card-title
                >
                <b-card-sub-title>{{
                    exerciseData.createdBy.username
                }}</b-card-sub-title>
                <Viewer :initialValue="exerciseData.description" />
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
import "@toast-ui/editor/dist/toastui-editor-viewer.css";

import { Viewer } from "@toast-ui/vue-editor";
import { API, Storage } from "aws-amplify";

import CommentSection from "@/components/Comment/CommentSection.vue";

export default {
    name: "ExerciseComponent",
    components: { CommentSection, Viewer },
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

            likeCount: 0,
            commentCount: 0,
            followCount: 0,

            isLiked: false,
            isFollowed: false,
            isFollowable: false,

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
                        Authorization: this.$store.state.userProfile.data
                            .idToken.jwtToken
                    },
                    queryStringParameters: {
                        counters: true
                    }
                };

                const response = (await API.get(
                    this.$store.state.apiName,
                    path,
                    myInit
                )).data;

                this.exerciseData = {
                    _id: response._id,
                    createdBy: response.createdBy,
                    description: response.description,
                    difficulty: response.difficulty,
                    filePaths: response.filePaths,
                    measureBy: response.measureBy,
                    muscleGroups: response.muscleGroups,
                    name: response.name,
                    tags: response.tags,
                }

                this.likeCount = response.likeCount;
                this.commentCount = response.commentCount;
                this.followCount = response.followCount;
                this.isLiked = response.isLiked;
                this.isFollowed = response.isFollowed;
                this.isFollowable = response.isFollowable;

                try {
                    if (this.exerciseData.filePaths) {
                        let urlPromises = [];

                        this.exerciseData.filePaths.forEach(path => {
                            urlPromises.push(Storage.get(path));
                        });

                        const imageUrls = await Promise.all(urlPromises);

                        imageUrls.forEach(url => {
                            this.imageUrls.push(url);
                        });
                    }
                } catch (err) {
                    console.error("Error getting image URLs:", err);
                } finally {
                    if (this.exerciseData) {
                        this.isLoading = false;
                    }
                }
            } catch (err) {
                console.error(
                    "Error downloading exercise:",
                    this.$props.exerciseId,
                    err
                );
            }
        },

        handleLike: function(x) {
            if (x > 0) {
                this.likeCount ++;
                this.isLiked = true;
            } else {
                this.likeCount --;
                this.isLiked = false;
            }
        },

        handleFollow: function(x) {
            if (x > 0) {
                this.followCount ++;
                this.isFollowed = true;
            } else {
                this.followCount --;
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
</style>
