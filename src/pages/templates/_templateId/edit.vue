<template>
    <b-container>
        <b-row align-v="center">
            <b-col sm="8">
                <b-container>
                    <b-card class="newTemplateCard" no-body>
                        <b-card-body>
                            <b-card-title>
                                {{
                                    newTemplateData.name
                                        ? newTemplateData.name
                                        : oldTemplateData.name
                                }}
                            </b-card-title>
                            <b-form-group label="Name" label-for="nameInput">
                                <b-form-input
                                    id="nameInput"
                                    v-model="newTemplateData.name"
                                    type="text"
                                    placeholder="Template Name"
                                    required
                                />
                            </b-form-group>
                        </b-card-body>
                    </b-card>

                    <b-card no-body class="exerciseSelectCard">
                        <b-card-body>
                            <h5>Exercises</h5>
                            <TemplateBuilder
                                @updateExercises="updateExercises"
                                :initExercises="oldTemplateData.exerciseReferences"
                            />
                        </b-card-body>
                    </b-card>

                    <b-card no-body class="descriptionCard">
                        <b-card-body>
                            <h5>Description</h5>
                            <client-only>
                                <DescriptionEditor @input="updateDescription" :initialValue="oldTemplateData.description" />
                            </client-only>
                        </b-card-body>
                    </b-card>
                </b-container>
            </b-col>

            <b-col sm="4">
                <b-container>
                    <b-card class="difficultySelectCard" no-body>
                        <b-card-body>
                            <h5>Difficulty</h5>
                            <DifficultySelector
                                @updateDifficulty="updateDifficulty"
                                :initDifficulty="oldTemplateData.difficulty"
                            />
                        </b-card-body>
                    </b-card>

                    <b-card class="muscleGroupSelectCard" no-body>
                        <b-card-body>
                            <h5>Muscle Groups</h5>
                            <MuscleGroupSelector
                                @updateMuscleGroups="updateMuscleGroups"
                                :initMgs="oldTemplateData.muscleGroups"
                            />
                        </b-card-body>
                    </b-card>

                    <b-card class="tagSelectCard" no-body>
                        <b-card-body>
                            <h5>Add Tags</h5>
                            <TagSelector
                                @updateTags="updateTags"
                                :initTags="oldTemplateData.tags"
                            />
                        </b-card-body>
                    </b-card>
                </b-container>
            </b-col>
        </b-row>
        <b-row class="justify-content-md-center">
            <b-col cols="12" md="auto">
                <b-container class="buttonsCont">
                    <b-button
                        variant="outline-danger"
                        @click="$router.go(-1)"
                        >Cancel</b-button
                    >
                    <b-button
                        variant="outline-primary"
                        @click="updateTemplate"
                        :disabled="isUpdating"
                    >
                        <span v-if="isUpdating"><b-spinner small/></span>
                        <span v-else>Update</span>
                    </b-button>
                </b-container>
            </b-col>
        </b-row>

        <b-alert
            class="position-fixed fixed-bottom m-0 rounded-0"
            variant="danger"
            dismissible
            fade
            style="z-index: 2000;"
            v-model="errorCountdown"
        >
            {{ errorMessage }}
        </b-alert>
    </b-container>
</template>

<script lang="ts">
import Vue from "vue";
import { ICreateTemplate, IExerciseReference } from "@/types";

import TagSelector from "@/components/Utility/TagSelector.vue";
import MuscleGroupSelector from "@/components/Utility/MuscleGroupSelector.vue";
import DifficultySelector from "@/components/Utility/DifficultySelector.vue";
import TemplateBuilder from "@/components/Template/TemplateBuilder.vue";
import DescriptionEditor from "@/components/TextEditor/DescriptionEditor.vue";

type TemplateEditData = {
    isUpdating: boolean;
    oldTemplateData: ICreateTemplate;
    newTemplateData: ICreateTemplate;
    errorCountdown: number;
    errorMessage: string;
    errorInterval: number | undefined;
}

export default Vue.extend({
    middleware: ["requiresAuth"],
    components: {
        DescriptionEditor,
        TagSelector,
        MuscleGroupSelector,
        DifficultySelector,
        TemplateBuilder
    },
    data(): TemplateEditData {
        return {
            isUpdating: false,

            oldTemplateData: {
                name: "",
                description: "",
                exerciseReferences: [],
                difficulty: 1,
                muscleGroups: [],
                tags: []
            },
            newTemplateData: {
                name: "",
                description: "",
                exerciseReferences: [],
                difficulty: 1,
                muscleGroups: [],
                tags: []
            },

            // Errror handling:
            errorCountdown: 0,
            errorMessage: "",
            errorInterval: undefined
        };
    },

    async asyncData({ params, app: { $accessor }, redirect, error, req }) {
        let oldTemplateData: ICreateTemplate | null = null;
        let newTemplateData: ICreateTemplate | null = null;

        try {
            const data = await $accessor.api.getTemplate({ templateId: params.templateId, req, init: {} })
            newTemplateData = data;
            oldTemplateData = data;

            if (!oldTemplateData.createdBy || !$accessor.userProfile || !$accessor.userProfile.docData || oldTemplateData.createdBy.username !== $accessor.userProfile.docData.username) {
                console.warn("Unauthorized");
                redirect("/templates/" + params.templateId);
            }
        } catch (err: any) {
            console.error(err);
            error({ message: err.message, statusCode: (err.response && err.response.status) });
        }

        return {
            oldTemplateData,
            newTemplateData
        }
    },

    methods: {
        async updateTemplate(): Promise<void> {
            try {
                this.isUpdating = true;
                console.log("Updating with:", JSON.stringify(this.newTemplateData));
                const init = {
                    body: {
                        templateForm: this.newTemplateData
                    }
                };
                const _id = await this.$accessor.api.editTemplate({ init, templateId: this.$route.params.templateId });

                this.$router.push("/templates/" + _id);
            }
            catch (err) {
                this.displayError(err);
            }
            finally {
                this.isUpdating = false;
            }
        },

        updateDescription(description: string): void {
            this.newTemplateData.description = description;
        },

        updateTags(tags: string[]): void {
            this.newTemplateData.tags = tags;
        },

        updateMuscleGroups(muscleGroups: string[]): void {
            this.newTemplateData.muscleGroups = muscleGroups;
        },

        updateDifficulty(difficulty: number): void {
            this.newTemplateData.difficulty = difficulty;
        },

        updateExercises(exercises: IExerciseReference[]): void {
            this.newTemplateData.exerciseReferences = exercises;
        },

        displayError(err: any): void {
            this.errorCountdown = 30;
            console.error(err);
            this.errorMessage = "Oops, an error has occured... Please try again later.";

            this.errorInterval = window.setInterval(() => {
                if (this.errorCountdown > 0) {
                    this.errorCountdown -= 1;
                } else {
                    window.clearInterval(this.errorInterval);
                    this.errorInterval = undefined;
                }
            }, 1000);
        }
    }
});
</script>

<style scoped>
.newTemplateCard,
.descriptionCard,
.difficultySelectCard,
.tagSelectCard,
.exerciseSelectCard,
.muscleGroupSelectCard {
    margin-top: 25px;
}

.buttonsCont {
    margin: 25px 0;
}

.buttonsCont button {
    margin: 0 3px;
}
</style>
