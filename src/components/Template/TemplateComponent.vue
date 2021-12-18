<template>
    <b-card no-body>
        <div v-if="!isLoading">
            <div v-if="loadedSuccessfully">
                <b-card-body>
                    <b-card-title
                        ><router-link :to="'/templates/' + templateId" class="componentLink">{{
                            templateData.name
                        }}</router-link></b-card-title
                    >
                    <b-card-sub-title>{{ templateData.createdBy.username }}</b-card-sub-title>
                    <b-card-text>
                        <div
                            :id="templateData._id + 'accordion'"
                            class="accordion exerciseExpandableCont"
                            role="tablist"
                        >
                            <ExerciseExpandable
                                v-for="(exercise, index) in templateData.exerciseReferences"
                                :exercise="exercise"
                                :accordionIndex="index"
                                :templateId="templateData._id"
                                :key="index"
                                :lazy="true"
                            />
                        </div>
                    </b-card-text>
                    <TuiEditorViewer :initialValue="templateData.description" />

                    <div class="text-center" v-if="!$store.state.activeWorkout.workoutCommenced">
                        <b-button
                            variant="outline-success"
                            size="sm"
                            class="text-center"
                            :to="'/workout/new?w=' + templateData._id"
                        >
                            Start Template
                            <b-icon-play />
                        </b-button>
                    </div>
                </b-card-body>
                <CommentSection
                    :docId="templateData._id"
                    coll="template"
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
import { API } from "aws-amplify";

import CommentSection from "@/components/Comment/CommentSection.vue";
import ExerciseExpandable from "@/components/Exercise/ExerciseExpandable.vue";

export default {
    name: "TemplateComponent",
    components: { Viewer, CommentSection, ExerciseExpandable },
    props: {
        templateId: {
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
            templateData: {},

            likeCount: 0,
            commentCount: 0,
            followCount: 0,

            isLiked: false,
            isFollowed: false,
            isFollowable: false,

            // Error handling
            loadedSuccessfully: false
        };
    },

    created: async function() {
        try {
            const path = "/template/" + this.$props.templateId;
            const myInit = {
                headers: {
                    Authorization: await this.$store.dispatch("fetchJwtToken")
                },
                queryStringParameters: {
                    counters: true
                }
            };

            const response = await API.get(this.$store.state.apiName, path, myInit).catch(err => {
                console.error(err);
                throw new Error("Template promise catch:" + this.$props.templateId + " | " + err);
            });

            if (!response) {
                throw new Error("Template no response:" + this.$props.templateId);
            }

            if (!response.success) {
                throw new Error("Template " + this.$props.templateId + " " + response.errorMessage);
            }

            this.loadedSuccessfully = true;
            this.templateData = {
                _id: response.data._id,
                createdBy: response.data.createdBy,
                description: response.data.description,
                difficulty: response.data.difficulty,
                exerciseReferences: response.data.exerciseReferences,
                muscleGroups: response.data.muscleGroups,
                name: response.data.name,
                tags: response.data.tags
            };

            this.likeCount = response.data.likeCount;
            this.commentCount = response.data.commentCount;
            this.followCount = response.data.followCount;
            this.isLiked = response.data.isLiked;
            this.isFollowed = response.data.isFollowed;
            this.isFollowable = response.data.isFollowable;
        } catch (err) {
            this.displayError(err);
        } finally {
            this.isLoading = false;
        }
    },

    methods: {
        displayError: function(err) {
            console.error(err);
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
    }
};
</script>

<style scoped>
.exerciseExpandableCont {
    padding: 20px;
}

.componentLink:hover {
    cursor: pointer;
}
</style>
