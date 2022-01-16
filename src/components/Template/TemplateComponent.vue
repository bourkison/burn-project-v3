<template>
    <b-card no-body :style="!loadedSuccessfully && !isLoading ? 'display:none;' : ''">
        <div v-if="!isLoading">
            <div v-if="loadedSuccessfully">
                <b-card-body>
                    <b-card-title
                        ><router-link :to="'/templates/' + templateId" class="componentLink">{{
                            templateData.name
                        }}</router-link></b-card-title
                    >
                    <b-card-sub-title>{{ templateData.createdBy.username }}</b-card-sub-title>
                    <div>
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
                    </div>
                    <DescriptionViewer :value="templateData.description" />

                    <div class="text-center" v-if="!$accessor.activeWorkout.workoutCommenced">
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

<script lang="ts">
import Vue, { PropType } from "vue";
import { Template } from "@/types/template";

import CommentSection from "@/components/Comment/CommentSection.vue";
import ExerciseExpandable from "@/components/Exercise/ExerciseExpandable.vue";
import DescriptionViewer from "@/components/TextEditor/DescriptionViewer.vue";

type TemplateComponentData = {
    isLoading: boolean;
    templateData: Template | undefined;
    loadedSuccessfully: boolean;
}

export default Vue.extend({
    name: "TemplateComponent",
    components: { CommentSection, ExerciseExpandable, DescriptionViewer },
    props: {
        templateId: {
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

    data(): TemplateComponentData {
        return {
            isLoading: true,
            templateData: undefined,

            // Error handling
            loadedSuccessfully: false
        };
    },

    async created() {
        try {
            this.templateData = await this.$accessor.getTemplate({ templateId: this.templateId });
        } 
        catch (err) {
            this.displayError(err);
        } 
        finally {
            this.isLoading = false;
        }
    },

    methods: {
        displayError(err: any) {
            console.error(err);
        },

        handleLike(x: number) {
            if (x > 0 && this.templateData) {
                this.templateData.likeCount++;
                this.templateData.isLiked = true;
            } else if (this.templateData) {
                this.templateData.likeCount--;
                this.templateData.isLiked = false;
            }
        },

        handleFollow(x: number) {
            if (x > 0 && this.templateData) {
                this.templateData.followCount++;
                this.templateData.isFollowed = true;
            } else if (this.templateData) {
                this.templateData.followCount--;
                this.templateData.isFollowed = false;
            }
        }
    }
});
</script>

<style scoped>
.exerciseExpandableCont {
    padding: 20px;
}

.componentLink:hover {
    cursor: pointer;
}
</style>
