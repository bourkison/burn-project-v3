<template>
    <b-container>
        <b-row align-v="center">
            <b-col sm="8">
                <b-container>
                    <b-card class="newTemplateCard" no-body>
                        <b-card-body>
                            <b-card-title>
                                {{ templateForm.name ? templateForm.name : "New Template" }}
                            </b-card-title>
                            <b-form-group label="Name" label-for="nameInput">
                                <b-form-input
                                    id="nameInput"
                                    v-model="templateForm.name"
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
                            <TemplateBuilder @updateExercises="updateExercises" />
                        </b-card-body>
                    </b-card>

                    <b-card no-body class="descriptionCard">
                        <b-card-body>
                            <h5>Description</h5>
                            <client-only>
                                <DescriptionEditor @input="updateDescription" />
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
                            <DifficultySelector @updateDifficulty="updateDifficulty" />
                        </b-card-body>
                    </b-card>

                    <b-card class="muscleGroupSelectCard" no-body>
                        <b-card-body>
                            <h5>Muscle Groups</h5>
                            <MuscleGroupSelector @updateMuscleGroups="updateMuscleGroups" />
                        </b-card-body>
                    </b-card>

                    <b-card class="tagSelectCard" no-body>
                        <b-card-body>
                            <h5>Add Tags</h5>
                            <TagSelector @updateTags="updateTags" />
                        </b-card-body>
                    </b-card>
                </b-container>
            </b-col>
        </b-row>
        <b-row class="justify-content-md-center">
            <b-col cols="12" md="auto">
                <b-container class="buttonsCont">
                    <b-button variant="outline-danger" @click="$router.push('/templates/')"
                        >Cancel</b-button
                    >
                    <b-button
                        variant="outline-primary"
                        @click="createTemplate"
                        :disabled="isCreating"
                    >
                        <span v-if="isCreating"><b-spinner small/></span>
                        <span v-else>Create</span>
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

import TemplateBuilder from "@/components/Template/TemplateBuilder.vue";
import DifficultySelector from "@/components/Utility/DifficultySelector.vue";
import MuscleGroupSelector from "@/components/Utility/MuscleGroupSelector.vue";
import TagSelector from "@/components/Utility/TagSelector.vue";
import DescriptionEditor from "@/components/TextEditor/DescriptionEditor.vue";

interface TemplateNewData {
    isCreating: boolean;
    templateForm: ICreateTemplate;
    errorCountdown: number;
    errorMessage: string;
    errorInterval: number | undefined;
}

export default Vue.extend({
    middleware: ["requiresAuth"],
    components: {
        DescriptionEditor,
        DifficultySelector,
        TagSelector,
        TemplateBuilder,
        MuscleGroupSelector
    },
    data(): TemplateNewData {
        return {
            isCreating: false,
            templateForm: {
                name: "",
                description: "",
                exercises: [],
                difficulty: 1,
                muscleGroups: [],
                tags: []
            },

            // Error handling:
            errorCountdown: 0,
            errorMessage: "",
            errorInterval: undefined
        };
    },

    methods: {
        async createTemplate(): Promise<void> {
            try {
                this.isCreating = true;

                console.log(JSON.stringify(JSON.stringify({ templateForm: this.templateForm })));
                const init = {
                    body: {
                        templateForm: this.templateForm
                    }
                };

                const _id = await this.$accessor.api.createTemplate({ init })
                this.$router.push("/templates/" + _id);
            } catch (err: any) {
                this.displayError(err);
            } finally {
                this.isCreating = false;
            }
        },

        updateDescription(description: string): void {
            this.templateForm.description = description;
        },

        updateDifficulty(difficulty: number): void {
            this.templateForm.difficulty = difficulty;
        },

        updateTags(tags: string[]): void {
            this.templateForm.tags = tags;
        },

        updateMuscleGroups(mgs: string[]): void {
            this.templateForm.muscleGroups = mgs;
        },

        updateExercises(exercises: IExerciseReference[]): void {
            let temp: IExerciseReference[] = [];
            exercises.forEach((exercise: IExerciseReference) => {
                temp.push(exercise);
            });

            this.templateForm.exercises = temp;
        },

        displayError(err: any) {
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
