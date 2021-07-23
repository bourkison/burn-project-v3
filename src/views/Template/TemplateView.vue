<template>
    <b-container v-if="!isLoading && templateExists">
        <b-row align-v="center">
            <b-col sm="8">
                <b-container class="templateCard mainCard">
                    <b-card no-body>
                        <b-card-body>
                            <b-card-title>
                                {{ templateData.name }}
                                <b-dropdown right class="float-right" variant="outline">
                                    <span v-if="templateData.createdBy.id === this.$store.state.userProfile.data.uid">
                                        <b-dropdown-item :to="'/templates/' + templateData._id + '/edit'">Edit</b-dropdown-item>
                                        <b-dropdown-item variant="danger">Delete</b-dropdown-item>
                                    </span>
                                    <span v-else>
                                        <b-dropdown-item variant="danger">Report</b-dropdown-item>
                                    </span>
                                </b-dropdown>
                            </b-card-title>
                            <b-card-sub-title>
                                {{ templateData.createdBy.username }}
                            </b-card-sub-title>

                            <b-card-text>
                                <div :id="templateData.id + 'accordion'" class="accordion exerciseExpandableCont" role="tablist">
                                    <ExerciseExpandable v-for="(exercise, index) in templateData.exerciseReferences" :exercise="exercise" :accordionIndex="index" :templateId="templateData._id" :key="exercise.exerciseId" :lazy="false" />
                                </div>

                                <div class="text-center">
                                    <b-button variant="outline-success" size="sm" class="text-center" :to="'/workout/new?w=' + templateData.id">
                                        Start Template    
                                        <b-icon-play />
                                    </b-button>
                                </div>
                                <div class="mt-4">
                                    <Viewer :initialValue="templateData.description" />
                                </div>
                            </b-card-text>
                        </b-card-body>
                        <CommentSection :docId="templateData.id" collection="templates" :followableComponent="true" />
                    </b-card>
                </b-container>
            </b-col>

            <b-col sm="4">
                <b-card no-body class="templateCard">
                    <b-card-body>
                        <b-card-title>
                            Difficulty
                        </b-card-title>
                        <b-card-text>
                            <div class="text-center stars">
                                <b-icon-star-fill v-for="star in templateData.difficulty" :key="star" font-scale="2" variant="warning"></b-icon-star-fill>
                            </div>
                        </b-card-text>
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
                        <b-card-text>
                            <div style="text-center">
                                <b-badge class="tags" v-for="(tag, index) in templateData.tags" :key="index" :variant="variants[index]">{{ tag }}</b-badge>
                            </div>
                        </b-card-text>
                    </b-card-body>
                </b-card>
            </b-col>
        </b-row>
    </b-container>
</template>

<script>
import { API } from 'aws-amplify';
import { Viewer } from '@toast-ui/vue-editor'

import CommentSection from '@/components/Comment/CommentSection.vue'
import MuscleGroup from '@/components/Utility/MuscleGroup.vue'
import ExerciseExpandable from '@/components/Exercise/ExerciseExpandable.vue'

export default {
    name: 'TemplateView',
    components: { CommentSection, Viewer, MuscleGroup, ExerciseExpandable },
    data() {
        return {
            isLoading: true,
            templateExists: false,
            templateData: null,

            // Bootstrap:
            variants: ["success", "danger", "warning", "info", "dark"]
        }
    },

    created: function() {
        this.downloadTemplate();
    },

    beforeRouteUpdate: function(to, from, next) {
        next();
        this.downloadTemplate();
    },

    methods: {
        downloadTemplate: async function() {
            try {
                this.isLoading = true;
                this.templateExists = false;
                this.templateData = null;

                const path = '/template/' + this.$route.params.templateid;
                const myInit = {
                    headers: {
                        Authorization: this.$store.state.userProfile.data.signInUserSession.idToken.jwtToken
                    }
                }

                const response = await API.get(this.$store.state.apiName, path, myInit).catch(err => {
                    throw new Error("Error downloading template: " + this.$route.params.templateid + " at promise catch: " + err);
                });

                if (!response) {
                    throw new Error("Error downloading template: " + this.$route.params.templateid + " no repsonse");
                }

                if (!response.success) {
                    throw new Error("Error downloading template: " + this.$route.params.templateid + " call unsuccessful: " + response.errorMessage);
                }

                this.templateExists = true;
                this.templateData = response.data;
            }
            catch (err) {
                console.error(err);
            }
            finally {
                this.isLoading = false;
            }
        },
    }
}
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