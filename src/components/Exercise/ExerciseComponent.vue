<template>
    <b-card no-body :style="!loadedSuccessfully && !isLoading ? 'display:none;' : ''">
        <div v-if="!isLoading">
            <div v-if="loadedSuccessfully">
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
                            <div><nuxt-link :to="'/exercises/' + exerciseId">{{exerciseData.name}}</nuxt-link></div>
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
                    <DescriptionViewer :value="exerciseData.description" />
                </b-card-body>
                <CommentSection
                    :docId="exerciseData._id"
                    coll="exercise"
                    :followableComponent="true"
                    :likeCount="exerciseData.likeCount"
                    :commentCount="exerciseData.commentCount"
                    :followCount="exerciseData.followCount"
                    :isLiked="exerciseData.isLiked"
                    :isFollowed="exerciseData.isFollowed"
                    :isFollowable="exerciseData.isFollowable"
                    @like="handleLike(1)"
                    @unlike="handleLike(-1)"
                    @follow="handleFollow(1)"
                    @unfollow="handleFollow(-1)"
                />
            </div>
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

<script lang="ts">
import Vue, { PropType } from "vue";
import { Exercise } from "@/types/exercise";

import { API, graphqlOperation, Storage } from "aws-amplify";
import { getVideoObject } from "@/graphql/queries";
import awsvideoconfig from "@/aws-video-exports";

import VideoPlayer from "@/components/Video/VideoPlayer.vue";
import CommentSection from "@/components/Comment/CommentSection.vue";
import DescriptionViewer from "@/components/TextEditor/DescriptionViewer.vue";

type ExerciseComponent = {
    isLoading: boolean;
    exerciseData: Exercise | null;
    imageUrls: string[];
    video: {
        id: string;
        url: string;
        token: string;
        options: {
            autoplay: boolean,
            controls: boolean,
            sources: {
                src: string
            }[]
        } | {}
    };
    infoExpanded: boolean;
    loadedSuccessfully: boolean;
    carouselModel: number;
}

export default Vue.extend({
    name: "ExerciseComponent",
    components: { CommentSection, VideoPlayer, DescriptionViewer },
    props: {
        exerciseId: {
            type: String as PropType<string>,
            required: true
        },
        skeletonAmount: {
            type: Number as PropType<number>,
            required: true
        },
        skeletonWidth: {
            type: Array as PropType<string[]>,
            required: true
        }
    },

    data(): ExerciseComponent {
        return {
            isLoading: true,
            exerciseData: null,
            imageUrls: [],
            video: {
                id: "",
                url: "",
                token: "",
                options: {}
            },

            infoExpanded: false,

            // Error handling
            loadedSuccessfully: false,

            // Bootstrap:
            carouselModel: 0
        };
    },

    mounted() {
        if (this.exerciseId) {
            this.downloadExercise();
        }
    },

    methods: {
        async downloadExercise() {
            try {
                this.exerciseData = await this.$accessor.api.getExercise({ exerciseId: this.exerciseId, init: { queryStringParameters: { counters: true }}});

                try {
                    let urlPromises: Promise<string>[] = [];

                    this.exerciseData.filePaths.forEach(async path => {
                        if (path.fileType === "video") {
                            const videoObject = {
                                id: path.key
                            }

                            const response: any = await API.graphql(graphqlOperation(getVideoObject, videoObject));

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
                        } else if (path.fileType === "image") {
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
                        this.loadedSuccessfully = true;
                        this.isLoading = false;
                    }
                }
            } catch (err) {
                console.error("Error downloading exercise:", this.$props.exerciseId, err);
            }
        },

        handleLike(x: number): void {
            if (x > 0 && this.exerciseData) {
                this.exerciseData.likeCount++;
                this.exerciseData.isLiked = true;
            } else if (this.exerciseData) {
                this.exerciseData.likeCount--;
                this.exerciseData.isLiked = false;
            }
        },

        handleFollow(x: number): void {
            if (x > 0 && this.exerciseData) {
                this.exerciseData.followCount++;
                this.exerciseData.isFollowed = true;
            } else if (this.exerciseData) {
                this.exerciseData.followCount--;
                this.exerciseData.isFollowed = false;
            }
        }
    },

    watch: {
        exerciseId(n, o) {
            if (n && !o) {
                this.downloadExercise();
            }
        }
    }
});
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
