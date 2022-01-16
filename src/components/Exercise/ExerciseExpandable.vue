<template>
    <b-card no-body class="mb-1 exerciseExpandableItem">
        <b-card-header header-tag="header" class="p-1" role="tab">
            <b-button
                block
                v-b-toggle="templateId + '_' + accordionIndex + '_accordion'"
                variant="outlined"
                class="d-flex"
                size="sm"
            >
                {{ exercise.name }}
                <strong v-if="isVisible" aria-hidden="true" class="ml-auto">-</strong>
                <strong v-else aria-hidden="true" class="ml-auto">+</strong>
            </b-button>
        </b-card-header>

        <b-collapse
            :id="templateId + '_' + accordionIndex + '_accordion'"
            accordion="my-accordion"
            role="tabpanel"
            v-model="isVisible"
        >
            <b-card-body>
                <div v-if="!isLoading">
                    <DescriptionViewer :value="exerciseData.description" />
                </div>
                <div v-else class="text-center">
                    <b-spinner small />
                </div>
            </b-card-body>
        </b-collapse>
    </b-card>
</template>

<script lang="ts">
import Vue, { PropType } from "vue"
import { Exercise, ExerciseReference } from "@/types/exercise";

import DescriptionViewer from "@/components/TextEditor/DescriptionViewer.vue";

type ExerciseExpandable = {
    exerciseData: Exercise | undefined;
    isLoading: boolean;
    isVisible: false
}

export default Vue.extend({
    name: "ExerciseExpandable",
    components: { DescriptionViewer },
    props: {
        exercise: {
            type: Object as PropType<ExerciseReference>,
            required: true
        },
        accordionIndex: {
            type: Number as PropType<number>,
            required: true
        },
        templateId: {
            type: String as PropType<string>,
            required: true
        },
        lazy: {
            type: Boolean as PropType<boolean>,
            required: true
        }
    },

    data(): ExerciseExpandable {
        return {
            exerciseData: undefined,
            isLoading: true,

            isVisible: false
        };
    },

    mounted() {
        if (!this.$props.lazy) {
            this.downloadData();
        }
    },

    methods: {
        async downloadData(): Promise<void> {
            try {                
                if (this.$accessor.userProfile && this.$accessor.userProfile.loggedIn) {
                    this.exerciseData = await this.$accessor.api.getExercise({ exerciseId: this.exercise.exerciseId, init: {} })
                } else {
                    this.exerciseData = await this.$accessor.api.getExercisePublic({ exerciseId: this.exercise.exerciseId, init: {} });
                }

                this.isLoading = false;
            } catch (err) {
                console.error(err);
            }
        }
    },

    watch: {
        isVisible() {
            // Download data if we havent already and user has expanded.
            if (this.isVisible && this.isLoading) {
                this.downloadData();
            }
        }
    }
});
</script>

<style scoped>
.exerciseExpandableItem {
    margin-bottom: 0 !important;
}
</style>

<style>
    .exerciseExpandableItem button:focus {
        box-shadow: none !important;
    }
</style>
