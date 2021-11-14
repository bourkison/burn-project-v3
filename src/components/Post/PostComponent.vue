<template>
    <div v-if="!isLoading && loadedSuccessfully">
        <b-card no-body header-bg-variant="transparent">
            <!-- Header -->
            <template #header>
                <div v-if="!isLoading" class="d-flex alignHeader" align-v="center">
                    <div class="d-flex centeredHeader" align-v="center">
                        <b-avatar
                            :to="'/' + postData.createdBy.username"
                            size="1.5rem"
                            class="mr-1 disableAvatarHover"
                            :src="postData.createdBy.profilePhoto"
                        />
                        <span
                            ><router-link
                                :to="'/' + postData.createdBy.username"
                                class="text-dark username"
                                >{{ postData.createdBy.username }}</router-link
                            >
                        </span>
                        <span class="ml-1" v-if="postData.share.type">
                            <span v-if="postData.share.type == 'exercise'"
                                >&nbsp;shared an
                                <router-link :to="'/exercises/' + postData.share._id"
                                    >exercise</router-link
                                >.</span
                            >
                            <span v-if="postData.share.type == 'template'"
                                >&nbsp;shared a
                                <router-link :to="'/templates/' + postData.share._id"
                                    >template</router-link
                                >.</span
                            >
                            <span v-if="postData.share.type == 'workout'"
                                >&nbsp;shared a workout.</span
                            >
                        </span>
                    </div>
                    <div class="d-flex ml-auto text-muted centeredHeader">
                        <span
                            class="createdAtText"
                            :title="Date(postData.createdAt).toLocaleString()"
                            ><em>{{ createdAtText }}</em></span
                        >
                        <b-dropdown left variant="outline" size="sm" style="padding-top:1px;">
                            <span
                                v-if="
                                    postData.createdBy.userId ===
                                        $store.state.userProfile.docData._id
                                "
                            >
                                <b-dropdown-item>Edit</b-dropdown-item>
                                <b-dropdown-item variant="danger">Delete</b-dropdown-item>
                            </span>
                            <span v-else>
                                <b-dropdown-item variant="danger">Report</b-dropdown-item>
                            </span>
                        </b-dropdown>
                    </div>
                </div>
            </template>

            <!-- Content -->
            <div v-if="imgUrls.length > 1">
                <b-carousel v-model="carouselModel" controls indicators :interval="0">
                    <b-aspect
                        ><b-carousel-slide v-for="img in imgUrls" :key="img" :img-src="img"
                    /></b-aspect>
                </b-carousel>
            </div>
            <div v-else-if="imgUrls.length > 0">
                <img class="w-100" :src="imgUrls[0]" />
            </div>

            <b-card-body>
                <b-card-text>
                    <div v-if="postData.share.type" class="mb-3">
                        <div v-if="postData.share.type == 'exercise'">
                            <ExerciseShare :exerciseId="postData.share._id" />
                        </div>

                        <div v-else-if="postData.share.type == 'template'">
                            <TemplateShare :templateId="postData.share._id" />
                        </div>

                        <div v-else-if="postData.share.type == 'workout'">
                            <WorkoutShare
                                :workoutId="postData.share._id"
                                :userId="postData.createdBy.userId"
                            />
                        </div>
                    </div>
                    {{ postData.content }}
                </b-card-text>
            </b-card-body>
            <CommentSection
                :docId="postData._id"
                coll="post"
                :followableComponent="false"
                :likeCount="likeCount"
                :commentCount="commentCount"
                :isLiked="isLiked"
                @like="handleLike(1)"
                @unlike="handleLike(-1)"
            />
        </b-card>
    </div>
    <div v-else-if="isLoading && !loadedSuccessfully">
        <b-card no-body>
            <b-card-body>
                <b-skeleton
                    v-for="index in skeletonAmount"
                    :key="index"
                    animation="wave"
                    :width="skeletonWidth[index]"
                ></b-skeleton>
            </b-card-body>
        </b-card>
    </div>
    <div v-else style="display: none;"></div>
</template>

<script>
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

import CommentSection from "@/components/Comment/CommentSection.vue";

import WorkoutShare from "@/components/Workout/WorkoutShare.vue";
import ExerciseShare from "@/components/Exercise/ExerciseShare.vue";
import TemplateShare from "@/components/Template/TemplateShare.vue";

import { API, Storage } from "aws-amplify";

export default {
    name: "PostComponent",
    components: { CommentSection, WorkoutShare, ExerciseShare, TemplateShare },
    props: {
        postId: {
            required: true,
            type: String
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
            postData: {},
            imgUrls: [],
            createdAtText: "",

            likeCount: 0,
            commentCount: 0,
            isLiked: false,
            loadedSuccessfully: false,

            // Bootstrap:
            carouselModel: 0
        };
    },

    created: function() {
        dayjs.extend(relativeTime);
    },

    mounted: async function() {
        try {
            const path = "/post/" + this.$props.postId;
            const myInit = {
                headers: {
                    Authorization: await this.$store.dispatch("fetchJwtToken")
                }
            };

            const response = (
                await API.get(this.$store.state.apiName, path, myInit).catch(err => {
                    console.error(err);
                })
            ).data;

            this.postData = {
                _id: response._id,
                createdBy: response.createdBy,
                createdAt: response.createdAt,
                content: response.content,
                filePaths: response.filePaths,
                share: response.share
            };

            this.likeCount = response.likeCount;
            this.commentCount = response.commentCount;
            this.isLiked = response.isLiked;

            this.createdAtText = dayjs(this.postData.createdAt).fromNow();

            try {
                let urlPromises = [];

                this.postData.filePaths.forEach(path => {
                    urlPromises.push(Storage.get(path));
                })

                const imageUrls = await Promise.all(urlPromises);

                imageUrls.forEach(url => {
                    this.imgUrls.push(url);
                });
            } catch (err) {
                console.error("Error getting image URLs:", err);
            } finally {
                this.isLoading = false;
                if (this.postData) {
                    this.loadedSuccessfully = true;
                }
                this.$emit("postLoaded");
            }
        } catch (err) {
            console.error("Error downloading post", err);
        }

        this.isLoading = false;
    },

    methods: {
        handleLike: function(x) {
            if (x > 0) {
                this.isLiked = true;
                this.likeCount++;
            } else {
                this.isLiked = false;
                this.likeCount--;
            }
        }
    }
};
</script>

<style scoped>
.username {
    font-weight: 600;
}

.alignHeader {
    margin: 0 -5px;
}

.createdAtText {
    font-size: 12px;
    line-height: 24px;
}

.centeredHeader {
    align-items: center;
}
</style>

<style>
.disableAvatarHover img {
    transform: none !important;
}
</style>
