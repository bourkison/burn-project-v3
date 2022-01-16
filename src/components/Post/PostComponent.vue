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
                            ><nuxt-link
                                :to="'/' + postData.createdBy.username"
                                class="text-dark username"
                                >{{ postData.createdBy.username }}</nuxt-link
                            >
                        </span>
                        <span class="ml-1" v-if="postData.share.type">
                            <span v-if="postData.share.type == 'exercise'"
                                >&nbsp;shared an
                                <nuxt-link :to="'/exercises/' + postData.share._id"
                                    >exercise</nuxt-link
                                >.</span
                            >
                            <span v-if="postData.share.type == 'template'"
                                >&nbsp;shared a
                                <nuxt-link :to="'/templates/' + postData.share._id"
                                    >template</nuxt-link
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
                        <b-dropdown
                            left
                            variant="outline"
                            size="sm"
                            class="post-dropdown"
                            style="padding-top: 1px"
                        >
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
            <div v-else-if="video.url">
                <VideoPlayer
                    class="video-player"
                    :options="video.options"
                    :token="video.token"
                    :id="video.id"
                />
            </div>

            <b-card-body>
                <div>
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
                </div>
            </b-card-body>
            <CommentSection
                :docId="postData._id"
                coll="post"
                :followableComponent="false"
                :likeCount="postData.likeCount"
                :commentCount="postData.commentCount"
                :isLiked="postData.isLiked"
                @like="handleLike(1)"
                @unlike="handleLike(-1)"
                @addComment="commentCount++"
            />
        </b-card>
    </div>
    <div v-else-if="!isLoading" style="display: none"></div>
    <div v-else>
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
    
</template>

<script lang="ts">
import Vue, { PropType } from "vue";
import { Post } from "@/types/post";

import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

import CommentSection from "@/components/Comment/CommentSection.vue";

import WorkoutShare from "@/components/Workout/WorkoutShare.vue";
import ExerciseShare from "@/components/Exercise/ExerciseShare.vue";
import TemplateShare from "@/components/Template/TemplateShare.vue";

import { API, graphqlOperation, Storage } from "aws-amplify";
import { getVideoObject } from "@/graphql/queries";
import awsvideoconfig from "@/aws-video-exports";

import VideoPlayer from "@/components/Video/VideoPlayer.vue";
import { VideoJsPlayerOptions } from "video.js";

export default Vue.extend({
    name: "PostComponent",
    components: { CommentSection, WorkoutShare, ExerciseShare, TemplateShare, VideoPlayer },
    props: {
        postId: {
            required: true,
            type: String as PropType<string>,
        },
        skeletonAmount: {
            type: Number as PropType<number>,
            required: true,
        },
        skeletonWidth: {
            type: Array as PropType<number[]>,
            required: true,
        },
    },

    data() {
        return {
            isLoading: true,
            postData: null as Post | null,
            imgUrls: [] as string[],
            video: {
                id: "",
                url: "",
                token: "",
                options: {} as VideoJsPlayerOptions,
            },
            createdAtText: "",
            createdAtTextInterval: null as number | null,
            createdAtTextIntervalLength: 0,

            loadedSuccessfully: false,

            // Bootstrap:
            carouselModel: 0,
        };
    },

    created() {
        dayjs.extend(relativeTime);
    },

    async mounted() {
        try {
            this.postData = await this.$accessor.api.getPost({ postId: this.postId, init: {} });

            if (!this.postData) {
                throw new Error("No post data!");
            }

            this.createdAtText = dayjs(this.postData.createdAt).fromNow();
            const secondsAgo = dayjs().subtract(dayjs(this.postData.createdAt).unix()).unix();

            if (secondsAgo < 2700) {
                // 2700 = 45 minutes, when createdAtText = an hour ago
                if (secondsAgo < 90) {
                    this.createdAtTextIntervalLength = 30000;
                } else {
                    this.createdAtTextIntervalLength = 60000;
                }

                this.createdAtTextInterval = window.setInterval(() => {
                    if (this.postData) {
                        this.createdAtText = dayjs(this.postData.createdAt).fromNow();
                        const secondsAgo = dayjs().subtract(dayjs(this.postData.createdAt).unix()).unix();
    
                        if (secondsAgo > 2700) {
                            if (this.createdAtTextInterval) window.clearInterval(this.createdAtTextInterval);
                        } else if (secondsAgo > 90) {
                            this.createdAtTextIntervalLength = 60000;
                        }
                    }
                }, this.createdAtTextIntervalLength);
            }

            try {
                let urlPromises: Promise<string>[] = [];

                this.postData.filePaths.forEach(async (path) => {
                    if (path.fileType === "video") {
                        const videoObject = {
                            id: path.key,
                        };

                        const response: any = await API.graphql(
                            graphqlOperation(getVideoObject, videoObject)
                        );

                        this.video.token = response.data.getVideoObject.token;
                        this.video.id = path.key;
                        this.video.url =
                            "https://" +
                            awsvideoconfig.awsOutputVideo +
                            "/" +
                            this.video.id +
                            "/" +
                            this.video.id.split("/")[this.video.id.split("/").length - 1] +
                            ".m3u8";

                        this.video.options = {
                            autoplay: false,
                            controls: true,
                            sources: [
                                {
                                    src: this.video.url,
                                },
                            ],
                        };
                    } else if (path.fileType === "image") {
                        urlPromises.push(Storage.get(path.key));
                    }
                });

                const imageUrls = await Promise.all(urlPromises);

                imageUrls.forEach((url) => {
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

    beforeDestroy() {
        if (this.createdAtTextInterval) {
            window.clearInterval(this.createdAtTextInterval);
        }
    },

    methods: {
        handleLike(x: number): void {
            if (x > 0 && this.postData) {
                this.postData.isLiked = true;
                this.postData.likeCount++;
            } else if (this.postData) {
                this.postData.isLiked = false;
                this.postData.likeCount--;
            }
        }
    },
});
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

.post-dropdown button {
    box-shadow: none !important;
}
</style>
