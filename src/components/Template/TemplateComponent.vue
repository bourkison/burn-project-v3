<template>
    <b-card no-body>
        <div v-if="!isLoading">
            <b-card-body>
                <b-card-title><router-link :to="'/templates/' + templateId" class="componentLink">{{ templateData.name }}</router-link></b-card-title>
                <b-card-sub-title>{{ templateData.createdBy.username }}</b-card-sub-title>
                <b-card-text>
                    <div :id="templateData.id + 'accordion'" class="accordion exerciseExpandableCont" role="tablist">
                        <ExerciseExpandable v-for="(exercise, index) in templateData.exercises" :exercise="exercise" :accordionIndex="index" :templateId="templateData.id" :key="exercise.id" :lazy="true" />
                    </div>
                </b-card-text>
                <Viewer :initialValue="templateData.description"/>

                <div class="text-center">
                    <b-button variant="outline-success" size="sm" class="text-center" :to="'/burn/new?w=' + templateData.id">
                        Start Template
                        <b-icon-play />
                    </b-button>
                </div>
            </b-card-body>
            <CommentSection :docId="templateData.id" collection="templates" :followableComponent="true" />
        </div>
        <div v-else>
            <b-card-body>
                <b-skeleton v-for="(index) in (Math.floor(Math.random() * 4) + 3)" :key="index" animation="wave" :width="(Math.floor(Math.random() * 50) + 50).toString() + '%'"></b-skeleton>
            </b-card-body>
        </div>
    </b-card>
</template>

<script>
import '@toast-ui/editor/dist/toastui-editor-viewer.css';

import { Viewer } from '@toast-ui/vue-editor'
import { templatesCollection } from '@/firebase'

import CommentSection from '@/components/Comment/CommentSection.vue'
import ExerciseExpandable from '@/components/Exercise/ExerciseExpandable.vue'

export default {
    name: 'TemplateComponent',
    components: { Viewer, CommentSection, ExerciseExpandable },
    props: {
        templateId: {
            required: true,
            type: String
        }
    },

    data() {
        return {
            isLoading: true,
            templateData: {},
        }
    },

    created: function() {
        templatesCollection().doc(this.$props.templateId).get()
        .then(templateDoc => {
            this.templateData = templateDoc.data();
            this.templateData.id = templateDoc.id;

            // Pull like, comment and follow count.
            this.isLoading = false;
        })
        .catch(e => {
            console.error("Error downloading template data", e);
        })
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