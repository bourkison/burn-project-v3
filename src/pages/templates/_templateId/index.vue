<template>
    <b-container>
        <b-row align-v="center">
            <b-col sm="8">
                <b-container class="templateCard mainCard">
                    <b-card no-body>
                        <b-card-body>
                            <b-card-title>
                                {{ templateData.name }}
                                <b-dropdown right class="float-right" variant="outline">
                                    <span
                                        v-if="
                                            $store.state.userProfile && $store.state.userProfile.docData && templateData.createdBy.userId ===
                                                $store.state.userProfile.docData._id
                                        "
                                    >
                                        <b-dropdown-item
                                            :to="'/templates/' + templateData._id + '/edit'"
                                            >Edit</b-dropdown-item
                                        >
                                        <b-dropdown-item
                                            variant="danger"
                                            @click="confirmDeleteTemplate"
                                            :disabled="isDeleting"
                                        >
                                            <div v-if="!isDeleting">Delete</div>
                                            <div v-else>
                                                <b-spinner small />
                                            </div>
                                        </b-dropdown-item>
                                    </span>
                                    <span v-else>
                                        <b-dropdown-item variant="danger">Report</b-dropdown-item>
                                    </span>
                                </b-dropdown>
                            </b-card-title>
                            <b-card-sub-title>
                                {{ templateData.createdBy.username }}
                            </b-card-sub-title>

                            <div>
                                <div
                                    :id="templateData.id + 'accordion'"
                                    class="accordion exerciseExpandableCont"
                                    role="tablist"
                                >
                                    <ExerciseExpandable
                                        v-for="(exercise, index) in templateData.exerciseReferences"
                                        :exercise="exercise"
                                        :accordionIndex="index"
                                        :templateId="templateData._id"
                                        :key="index"
                                        :lazy="false"
                                    />
                                </div>

                                <div class="text-center">
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
                                <div class="mt-4">
                                    <DescriptionViewer :value="templateData.description" />
                                </div>
                            </div>
                        </b-card-body>
                        <client-only>
                            <CommentSection
                                v-if="$store.state.userProfile && $store.state.userProfile.loggedIn"
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
                        </client-only>
                    </b-card>
                </b-container>
            </b-col>

            <b-col sm="4">
                <b-card no-body class="templateCard">
                    <b-card-body>
                        <b-card-title>
                            Difficulty
                        </b-card-title>
                        <div>
                            <div class="text-center stars">
                                <b-icon-star-fill
                                    v-for="star in templateData.difficulty"
                                    :key="star"
                                    font-scale="2"
                                    variant="warning"
                                ></b-icon-star-fill>
                            </div>
                        </div>
                    </b-card-body>
                </b-card>

                <b-card no-body class="templateCard">
                    <b-card-body>
                        <b-card-title>
                            Muscle Groups
                        </b-card-title>
                        <MuscleGroup :selectedGroups="templateData.muscleGroups" />
                    </b-card-body>
                </b-card>

                <b-card no-body class="templateCard">
                    <b-card-body>
                        <b-card-title>
                            Tags
                        </b-card-title>
                        <div>
                            <div style="text-center">
                                <b-badge
                                    class="tags"
                                    v-for="(tag, index) in templateData.tags"
                                    :key="index"
                                    :variant="variants[index]"
                                    >{{ tag }}</b-badge
                                >
                            </div>
                        </div>
                    </b-card-body>
                </b-card>
            </b-col>
        </b-row>

        <b-modal
            v-model="modalIsDeleting"
            title="Please Confirm"
            @ok="deleteTemplate"
            ok-variant="danger"
            centered
            button-size="sm"
            :ok-title-html="isDeleting ? '<b-spinner />' : 'Ok'"
        >
            <div>
                Are you sure you want to delete this template? This can not be undone.
            </div>

            <template #modal-footer="{ ok, cancel }">
                <b-button size="sm" @click="cancel">
                    <div>Cancel</div>
                </b-button>

                <b-button size="sm" variant="danger" @click="ok" :disabled="isDeleting">
                    <div v-if="!isDeleting">Ok</div>
                    <div v-else><b-spinner small /></div>
                </b-button>
            </template>
        </b-modal>
    </b-container>
</template>

<script>
import { API } from "aws-amplify";

import CommentSection from "@/components/Comment/CommentSection.vue";
import MuscleGroup from "@/components/Utility/MuscleGroup.vue";
import ExerciseExpandable from "@/components/Exercise/ExerciseExpandable.vue";
import DescriptionViewer from "@/components/TextEditor/DescriptionViewer.vue";

export default {
    components: { CommentSection, DescriptionViewer, MuscleGroup, ExerciseExpandable },
    data() {
        return {
            isDeleting: false,
            templateData: null,

            likeCount: 0,
            commentCount: 0,
            followCount: 0,

            isLiked: false,
            isFollowed: false,
            isFollowable: false,

            // Bootstrap:
            variants: ["success", "danger", "warning", "info", "dark"],
            modalIsDeleting: false
        };
    },

    async asyncData({ req, params, store, error }) {
        let templateData = null;
        let likeCount = 0;
        let commentCount = 0;
        let followCount = 0;
        let isLiked = false;
        let isFollowed = false;
        let isFollowable = false;

        try {
            let response;

            if (store.state.userProfile && store.state.userProfile.loggedIn) {
                const path = "/template/" + params.templateId;
                const myInit = {
                    headers: {
                        Authorization: await store.dispatch("fetchJwtToken", { req })
                    },
                    queryStringParameters: {
                        counters: true
                    }
                };
    
                response = await API.get(store.state.apiName, path, myInit);

                likeCount = response.data.likeCount;
                commentCount = response.data.commentCount;
                followCount = response.data.followCount;
                isLiked = response.data.isLiked;
                isFollowed = response.data.isFollowed;
                isFollowable = response.data.isFollowable;
            } else {
                console.log("Making request", store.state.apiName, "/public/template/" + params.templateId)
                response = await API.get(store.state.apiName, "/public/template/" + params.templateId, {});
            }

            if (!response) {
                throw new Error(
                    "Error downloading template: " +
                        params.templateId +
                        " no repsonse"
                );
            }

            if (!response.success) {
                throw new Error(
                    "Error downloading template: " +
                        params.templateId +
                        " call unsuccessful: " +
                        response.errorMessage
                );
            }

            templateData = {
                _id: response.data._id,
                createdBy: response.data.createdBy,
                description: response.data.description,
                difficulty: response.data.difficulty,
                exerciseReferences: response.data.exerciseReferences,
                muscleGroups: response.data.muscleGroups,
                name: response.data.name,
                tags: response.data.tags
            };

            return {
                templateData,
                likeCount,
                commentCount,
                followCount,
                isLiked,
                isFollowed,
                isFollowable,
            }
        } catch (err) {
            console.error(err);
            error({ message: err.message, statusCode: (err.response && err.response.status) });
        }
    },

    methods: {
        confirmDeleteTemplate() {
            this.modalIsDeleting = true;
        },

        async deleteTemplate(e) {
            e.preventDefault();

            this.isDeleting = true;

            const path = "/template/" + this.$route.params.templateId;
            const myInit = {
                headers: {
                    Authorization: await this.$store.dispatch("fetchJwtToken")
                }
            };

            const response = await API.del(this.$store.state.apiName, path, myInit);
            console.log("Deletion success:", response);

            this.isDeleting = false;
            this.modalIsDeleting = false;
            this.$router.push("/templates");
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
        }
    }
};
</script>

<style scoped>
.templateCard {
    margin-top: 20px;
}

.tags {
    margin: 2px;
}

.mainCard {
    margin-bottom: 20px;
}

.exerciseExpandableCont {
    padding: 20px;
}
</style>
