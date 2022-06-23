<template>
    <b-container>
        <b-card no-body class="mb-1 exerciseExpandableItem">
            <b-card-header header-tag="header" class="p-1" role="tab">
                <b-button
                    block
                    variant="outlined"
                    class="d-flex"
                    size="sm"
                    @click="isVisible = !isVisible"
                >
                    <span v-if="!isLoading">{{ exercise.name }}</span>
                    <span v-else><b-spinner small/></span>
                    <strong v-if="isVisible" aria-hidden="true" class="ml-auto">-</strong>
                    <strong v-else aria-hidden="true" class="ml-auto">+</strong>
                </b-button>
            </b-card-header>

            <b-collapse v-model="isVisible">
                <b-card-body>
                    <div v-if="!isLoading">
                        <DescriptionViewer :value="exercise.description" />
                    </div>
                    <div v-else class="text-center">
                        <b-spinner small />
                    </div>
                </b-card-body>
            </b-collapse>
        </b-card>
    </b-container>
</template>

<script lang="ts">
import Vue, { PropType } from "vue";
import { Exercise } from "@/types/exercise";
import DescriptionViewer from "@/components/TextEditor/DescriptionViewer.vue";

export default Vue.extend({
    name: "ExerciseShare",
    components: { DescriptionViewer },
    props: {
        exerciseId: {
            type: String as PropType<string>,
            required: true
        }
    },
    data() {
        return {
            isLoading: true,
            exercise: null as Exercise | null,

            // Bootstrap:
            isVisible: false
        };
    },

    created() {
        this.downloadExercise();
    },

    methods: {
        async downloadExercise(): Promise<void> {
            this.isLoading = true;

            try {
                this.exercise = await this.$accessor.api.getExercise({ exerciseId: this.exerciseId, init: {} });
            } catch (err) {
                console.error(err);
            } finally {
                this.isLoading = false;
            }
        }
    },

    watch: {
        exerciseId() {
            this.downloadExercise();
        }
    }
});
</script>
