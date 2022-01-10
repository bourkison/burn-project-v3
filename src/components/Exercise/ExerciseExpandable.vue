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

<script>
import { API } from "aws-amplify";
import DescriptionViewer from "@/components/TextEditor/DescriptionViewer";

export default {
    name: "ExerciseExpandable",
    components: { DescriptionViewer },
    props: {
        exercise: {
            type: Object,
            required: true
        },
        accordionIndex: {
            type: Number,
            required: true
        },
        templateId: {
            type: String,
            required: true
        },
        lazy: {
            type: Boolean,
            required: true
        }
    },

    data() {
        return {
            exerciseData: null,
            isLoading: true,

            isVisible: false
        };
    },

    created: function() {
        if (!this.$props.lazy) {
            this.downloadData();
        }
    },

    methods: {
        downloadData: async function() {
            try {
                const path = "/exercise/" + this.$props.exercise.exerciseId;
                const myInit = {
                    headers: {
                        Authorization: await this.$store.dispatch("fetchJwtToken")
                    }
                };

                const response = await API.get(this.$store.state.apiName, path, myInit).catch(
                    err => {
                        throw new Error(
                            "Error downloading exercise: " +
                                this.$props.exercise.exerciseId +
                                " at promise catch: " +
                                err
                        );
                    }
                );

                if (!response) {
                    throw new Error(
                        "Error downloading exercise: " +
                            this.$props.exercise.exerciseId +
                            " no repsonse"
                    );
                }

                if (!response.success) {
                    throw new Error(
                        "Error downloading exercise: " +
                            this.$props.exercise.exerciseId +
                            " call unsuccessful: " +
                            response.errorMessage
                    );
                }

                this.exerciseData = response.data;
                this.isLoading = false;
            } catch (err) {
                console.error(err);
            }
        }
    },

    watch: {
        isVisible: function() {
            // Download data if we havent already and user has expanded.
            if (this.isVisible && this.isLoading) {
                this.downloadData();
            }
        }
    }
};
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
