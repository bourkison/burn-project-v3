<template>
    <b-container>
        <div :id="template.id + 'accordion'" class="accordion" role="tablist">
            <ExerciseExpandable
                v-for="(exercise, index) in template.exerciseReferences"
                :exercise="exercise"
                :accordionIndex="index"
                :templateId="template._id"
                :key="exercise._id"
                :lazy="true"
            />
        </div>
    </b-container>
</template>

<script lang="ts">
import Vue from "vue";
import { ITemplate } from "~/types";

import ExerciseExpandable from "@/components/Exercise/ExerciseExpandable.vue";

export default Vue.extend({
    name: "TemplateShare",
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
            template: {} as ITemplate
        };
    },

    created: function() {
        this.downloadTemplate();
    },

    methods: {
        async downloadTemplate(): Promise<void> {
            this.isLoading = true;

            try {
                this.template = await this.$accessor.api.getTemplate({  templateId: this.templateId, init: {} });
            } catch (err) {
                console.error(err);
            } finally {
                this.isLoading = false;
            }
        }
    },

    watch: {
        templateId(): void {
            this.downloadTemplate();
        }
    }
});
</script>
