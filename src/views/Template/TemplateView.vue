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
                                        <b-dropdown-item :to="'/templates/' + templateData.id + '/edit'">Edit</b-dropdown-item>
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
                                    <ExerciseExpandable v-for="(exercise, index) in templateData.exercises" :exercise="exercise" :accordionIndex="index" :templateId="templateData.id" :key="exercise.id" :lazy="false" />
                                </div>

                                <div class="text-center">
                                    <b-button variant="outline-success" size="sm" class="text-center" :to="'/burn/new?w=' + templateData.id">
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
import { templatesCollection, userTemplatesCollection } from '@/firebase'
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
            templateData: {},

            // Bootstrap:
            variants: ["success", "danger", "warning", "info", "dark"]
        }
    },

    created: function() {
        this.downloadTemplate();

        userTemplatesCollection().where("template.id", "==", this.$route.params.templateid).get()
        .then(templateSnapshot => {
            console.log("TEST:", templateSnapshot.size);
        })
    },

    beforeRouteUpdate: function(to, from, next) {
        next();
        this.downloadTemplate();
    },

    methods: {
        downloadTemplate: function() {
            this.isLoading = true;
            this.templateExists = false;
            this.templateData = {};

            templatesCollection().doc(this.$route.params.templateid).get()
            .then(templateDoc => {
                if (templateDoc.exists) {
                    this.templateData = templateDoc.data();
                    this.templateData.id = templateDoc.id;

                    this.templateExists = true;

                    this.isLoading = false;
                } else {
                    this.templateExists = false;
                    throw new Error("Template does not exist");
                }
            })
            .catch(e => {
                console.error("Error downloading template", e);
                this.isLoading = false;
            })
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