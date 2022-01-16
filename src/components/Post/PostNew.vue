<template>
    <div>
        <ImageUploader
            @updateImages="updateImages"
            @updateVideo="updateVideo"
            :inlineDisplay="true"
            :resetVariablesIncrementor="resetVariablesIncrementor"
            @resetVariables="resetVariablesIncrementor++"
        />

        <div v-if="post.share.type" class="mt-1 mb-3">
            <div class="text-right">
                <b-icon-x variant="danger" class="clickableIcon" @click="post.share = {}" />
            </div>

            <div v-if="post.share.type == 'exercise'">
                <ExerciseShare :exerciseId="post.share._id" />
            </div>
            <div v-else-if="post.share.type == 'template'">
                <TemplateShare :templateId="post.share._id" />
            </div>
            <div v-else-if="post.share.type == 'workout'">
                <WorkoutShare
                    :workoutId="post.share._id"
                    :username="$store.state.userProfile.docData.username"
                />
            </div>
        </div>

        <client-only>
            <PostEditor
                v-model="post.content"
                :isLoading="isPosting"
                @exerciseClick="exerciseModal = !exerciseModal"
                @templateClick="templateModal = !templateModal"
                @workoutClick="workoutModal = !workoutModal"
                @postClick="createPost"
            />
        </client-only>

        <b-modal v-model="exerciseModal" centered title="Exercises" hide-footer button-size="sm">
            <ExerciseSearch @selectExercise="addExercise" />
        </b-modal>

        <b-modal v-model="templateModal" centered title="Templates" hide-footer button-size="sm">
            <TemplateSearch @selectTemplate="addTemplate" />
        </b-modal>

        <b-modal v-model="workoutModal" centered title="Workouts" hide-footer buttons-size="sm">
            <WorkoutSearch @selectWorkout="addWorkout" />
        </b-modal>
    </div>
</template>

<script lang="ts">
import Vue from "vue";
import { ImageToUpload } from "@/types";
import { CreatePost } from "@/types/post";
import { Workout } from "@/types/workout";
import { ExerciseReference } from "@/types/exercise";
import { TemplateReference } from "@/types/template";

import { API, Storage, graphqlOperation } from "aws-amplify";
import { createVideoObject, createVodAsset } from "@/graphql/mutations";

import PostEditor from "@/components/TextEditor/PostEditor.vue";
import ImageUploader from "~/components/Image/ImageUploader.vue";

import WorkoutSearch from "@/components/Workout/WorkoutSearch.vue";
import WorkoutShare from "@/components/Workout/WorkoutShare.vue";
import ExerciseSearch from "@/components/Exercise/ExerciseSearch.vue";
import ExerciseShare from "@/components/Exercise/ExerciseShare.vue";
import TemplateSearch from "@/components/Template/TemplateSearch.vue";
import TemplateShare from "@/components/Template/TemplateShare.vue";

import { v4 as uuidv4 } from "uuid";
import awsvideoconfig from "@/aws-video-exports.js";

export default Vue.extend({
    name: "PostNew",
    components: {
        PostEditor,
        ImageUploader,
        WorkoutSearch,
        WorkoutShare,
        ExerciseSearch,
        ExerciseShare,
        TemplateSearch,
        TemplateShare,
    },
    data() {
        return {
            isPosting: false,
            post: {
                content: "",
                filePaths: [],
                share: {},
            } as CreatePost,
            imagesToUpload: [] as ImageToUpload[],
            videoToUpload: null as File | null,

            // Modals:
            exerciseModal: false,
            templateModal: false,
            workoutModal: false,

            // Below iterator is watched by ImageUploader.
            // On change, the ImageUploader resets variables.
            resetVariablesIncrementor: 0,
        };
    },

    methods: {
        async createPost(): Promise<void> {
            if (!this.isPosting) {
                try {
                    console.log(JSON.stringify(JSON.stringify(this.post)));
                    this.isPosting = true;

                    if (this.imagesToUpload.length) {
                        // First upload all images using .map (see ExerciseNew.vue for further explanation)
                        const uploadResults = await Promise.all(
                            this.imagesToUpload.map(async (image, i) => {
                                const imageName =
                                    this.$accessor.userProfile?.docData?.username + "/" + uuidv4() || uuidv4();

                                const imageData = await fetch(image.url);
                                const blob = await imageData.blob();

                                const imageResponse = Storage.put(imageName, blob, {
                                    contentType: blob.type,
                                    progressCallback: (progress) => {
                                        console.log(
                                            "Image:",
                                            i,
                                            progress.loaded / progress.total,
                                            this
                                        );
                                    },
                                }).catch((err) => {
                                    console.error("Error uploading image:", i, err);
                                });

                                return imageResponse;
                            })
                        );

                        uploadResults.forEach((result) => {
                            if (result) {
                                this.post.filePaths.push({ key: result.key, fileType: "image" });
                            } else {
                                console.error("No response from upload");
                            }
                        });
                    } else if (this.videoToUpload) {
                        const uuid =
                            this.$accessor.userProfile?.docData?.username + "/" + uuidv4() || "";
                        const fileNameSplit = this.videoToUpload.name.split(".");
                        const fileExtension = fileNameSplit[fileNameSplit.length - 1];
                        const fileName = `${uuid}.${fileExtension}`;
                        const videoObject = {
                            input: {
                                id: uuid,
                                loaded: false,
                            },
                        };

                        // Call API and upload video.
                        await API.graphql(graphqlOperation(createVideoObject, videoObject));

                        const videoAsset = {
                            input: {
                                vodAssetVideoId: uuid,
                                title: uuid,
                                description: uuid,
                            },
                        };

                        API.graphql(graphqlOperation(createVodAsset, videoAsset));
                        await Storage.put(fileName, this.videoToUpload, {
                            bucket: awsvideoconfig.awsInputVideo,
                            contentType: "video/*",
                            customPrefix: {
                                public: "",
                            },
                            progressCallback: (progress) => {
                                console.log("Uploaded:", progress.loaded / progress.total);
                                this.$emit("uploadProgression", progress.loaded, progress.total);
                            },
                        }).catch((err) => {
                            console.error("ERROR UPLOADED:", err);
                        });

                        this.post.filePaths.push({ key: uuid, fileType: "video" });
                        console.log("UUID:", uuid);
                    }

                    const init = {
                        body: {
                            postForm: this.post
                        },
                    };

                    const response = await this.$accessor.api.createPost({ init });

                    console.log("POST CREATED:", response);
                    this.$emit("newPost", response);
                    this.isPosting = false;
                    this.resetVariablesIncrementor++;
                    this.resetVariables();
                } catch (err) {
                    console.error("Error creating post:", err);
                }
            }
        },

        addWorkout: function (workout: Workout): void {
            this.post.share = {
                _id: workout._id,
                type: "workout",
            };

            this.workoutModal = false;
        },

        addExercise: function (exercise: ExerciseReference): void {
            this.post.share = {
                _id: exercise.exerciseId,
                type: "exercise",
            };

            this.exerciseModal = false;
        },

        addTemplate: function (template: TemplateReference): void {
            this.post.share = {
                _id: template.templateId,
                type: "template",
            };

            this.templateModal = false;
        },

        updateImages: function (images: ImageToUpload[]): void {
            this.imagesToUpload = images;
        },

        updateVideo: function (video: File): void {
            this.videoToUpload = video;
        },

        resetVariables: function (): void {
            (this.isPosting = false),
                (this.post = {
                    content: "",
                    filePaths: [],
                    share: {},
                }),
                (this.imagesToUpload = []);
        },
    },
});
</script>

<style scoped>
.clickableIcon {
    vertical-align: middle !important;
}

.clickableIcon:hover {
    cursor: pointer;
}
</style>
