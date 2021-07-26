<template>
    <b-card no-body>
        <div v-if="!isLoading">
            <div v-if="loadedSuccessfully">
                <b-card-body>
                    <b-card-title><router-link :to="'/templates/' + templateId" class="componentLink">{{ templateData.name }}</router-link></b-card-title>
                    <b-card-sub-title>{{ templateData.createdBy.username }}</b-card-sub-title>
                    <b-card-text>
                        <div :id="templateData._id + 'accordion'" class="accordion exerciseExpandableCont" role="tablist">
                            <ExerciseExpandable v-for="(exercise, index) in templateData.exerciseReferences" :exercise="exercise" :accordionIndex="index" :templateId="templateData._id" :key="exercise.exerciseId" :lazy="true" />
                        </div>
                    </b-card-text>
                    <Viewer :initialValue="templateData.description"/>

                    <div class="text-center">
                        <b-button variant="outline-success" size="sm" class="text-center" :to="'/workout/new?w=' + templateData._id">
                            Start Template
                            <b-icon-play />
                        </b-button>
                    </div>
                </b-card-body>
                <CommentSection :docId="templateData._id" coll="template" :followableComponent="true" />
            </div>
        </div>
        <div v-else>
            <b-card-body>
                <b-skeleton v-for="(index) in skeletonAmount" :key="index" animation="wave" :width="skeletonWidth[index]"></b-skeleton>
            </b-card-body>
        </div>
    </b-card>
</template>

<script>
import '@toast-ui/editor/dist/toastui-editor-viewer.css';

import { Viewer } from '@toast-ui/vue-editor'
import { API } from 'aws-amplify'

import CommentSection from '@/components/Comment/CommentSection.vue'
import ExerciseExpandable from '@/components/Exercise/ExerciseExpandable.vue'

export default {
    name: 'TemplateComponent',
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

            // Error handling
            loadedSuccessfully: false
        }
    },

    created: async function() {
        try {
            const path = '/template/' + this.$props.templateId;
            const myInit = {
                headers: {
                    Authorization: this.$store.state.userProfile.data.idToken.jwtToken
                }
            }
    
            const response = await API.get(this.$store.state.apiName, path, myInit).catch(err => {
                console.error(err);
                throw new Error("Template promise catch:" + this.$props.templateId + " | " + err)
            });
    
            if (!response) {
                throw new Error("Template no response:" + this.$props.templateId);
            }
    
            if (!response.success) {
                throw new Error("Template " + this.$props.templateId + " " + response.errorMessage);
            }
    
            this.loadedSuccessfully = true;
            this.templateData = response.data
        }
        catch(err) {
            this.displayError(err);
        }
        finally {
            this.isLoading = false;
        }
    },


    methods: {
        displayError: function(err) {
            console.error(err);
        }
    }
}
</script>

<style scoped>
.exerciseExpandableCont {
    padding: 20px;
}

.componentLink:hover {
    cursor: pointer;
}
</style>