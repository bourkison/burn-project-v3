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

<script>
import { API } from 'aws-amplify';

import ExerciseExpandable from "@/components/Exercise/ExerciseExpandable.vue";

export default {
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
            template: {}
        };
    },

    created: function() {
        this.downloadTemplate();
    },

    methods: {
        downloadTemplate: async function() {
            this.isLoading = true;

            const path = "/template/" + this.$props.templateId;
            const myInit = {
                headers: {
                    Authorization: this.$store.state.userProfile.data.idToken.jwtToken
                }
            }

            try {
                this.template = (await API.get(this.$store.state.apiName, path, myInit)).data;
            }
            catch (err) {
                console.error(err)
            }
            finally {
                this.isLoading = false;
            }
        }
    },

    watch: {
        templateId: function() {
            this.downloadTemplate();
        }
    }
};
</script>
