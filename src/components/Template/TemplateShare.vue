<template>
    <b-container>
        <div :id="template.id + 'accordion'" class="accordion" role="tablist">
            <ExerciseExpandable v-for="(exercise, index) in template.exercises" :exercise="exercise" :accordionIndex="index" :templateId="template.id" :key="exercise.id" :lazy="false" />
        </div>
    </b-container>
</template>

<script>
import { templatesCollection } from '@/firebase'

import ExerciseExpandable from '@/components/Exercise/ExerciseExpandable.vue'

export default {
    name: 'TemplateShare',
    components: { ExerciseExpandable },
    props: {
        templateId: {
            type: String,
            required: true
        }
    },
    data() {
        return {
            isLoading: true,
            template: {}
        }
    },

    created: function() {
        this.downloadTemplate();
    },

    methods: {
        downloadTemplate: function() {
            this.isLoading = true;

            templatesCollection().doc(this.$props.templateId).get()
            .then(templateDoc => {
                this.template = templateDoc.data();
                this.template.id = templateDoc.id;

                this.isLoading = false;
            })
        }
    },

    watch: {
        templateId: function() {
            this.downloadTemplate();
        }
    }
}
</script>