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

<script>
import { API } from "aws-amplify";

import TemplateBuilder from "@/components/Template/TemplateBuilder.vue";
import DifficultySelector from "@/components/Utility/DifficultySelector.vue";
import MuscleGroupSelector from "@/components/Utility/MuscleGroupSelector.vue";
import TagSelector from "@/components/Utility/TagSelector.vue";

import DescriptionEditor from "@/components/TextEditor/DescriptionEditor.vue";

export default {
    middleware: ["requiresAuth"],
    components: {
        DescriptionEditor,
        DifficultySelector,
        TagSelector,
        TemplateBuilder,
        MuscleGroupSelector
    },
    data() {
        return {
            isLoading: true,
            isCreating: false,
            templateForm: {
                name: "",
                description: "",
                exercises: [],
                difficulty: 1,
                muscleGroups: [],
                tags: []
            },

            // Editor:
            editorOptions: {
                minHeight: "300px",
                language: "en-US",
                hideModeSwitch: true,
                usageStatistics: false,
                toolbarItems: [
                    "heading",
                    "bold",
                    "italic",
                    "divider",
                    "link",
                    "ul",
                    "ol",
                    "quote",
                    "divider",
                    "indent",
                    "outdent",
                    "hr"
                ]
            },

            // Error handling:
            errorCountdown: 0,
            errorMessage: "",
            errorInterval: null
        };
    },

    methods: {
        async createTemplate() {
            try {
                this.isCreating = true;

                console.log(JSON.stringify(JSON.stringify({ templateForm: this.templateForm })));

                const path = "/template";
                const myInit = {
                    headers: {
                        Authorization: await this.$store.dispatch("fetchJwtToken")
                    },
                    body: {
                        templateForm: this.templateForm
                    }
                };

                const response = await API.post(this.$store.state.apiName, path, myInit);

                if (!response.data) {
                    if (response.message) {
                        throw new Error("API Error in response: " + response.errorMessage);
                    } else {
                        throw new Error("No response");
                    }
                }

                console.log("RESPONSE:", response);

                this.$router.push("/templates/" + response._id);
            } catch (err) {
                this.displayError(err);
            } finally {
                this.isCreating = false;
            }
        },

        updateDescription(md) {
            this.templateForm.description = md;
        },

        updateDifficulty(difficulty) {
            this.templateForm.difficulty = difficulty;
        },

        updateTags(tags) {
            this.templateForm.tags = tags;
        },

        updateMuscleGroups(mgs) {
            this.templateForm.muscleGroups = mgs;
        },

        updateExercises(exercises) {
            let temp = [];
            exercises.forEach(exercise => {
                temp.push({
                    exerciseId: exercise._id,
                    name: exercise.name,
                    muscleGroups: exercise.muscleGroups,
                    tags: exercise.tags,
                    isFollow: exercise.isFollow,
                    createdAt: exercise.createdAt,
                    createdBy: exercise.createdBy
                });
            });

            this.templateForm.exercises = temp;
        },

        displayError(err) {
            this.errorCountdown = 30;
            console.error(err);
            this.errorMessage = "Oops, an error has occured... Please try again later.";

            this.errorInterval = window.setInterval(() => {
                if (this.errorCountdown > 0) {
                    this.errorCountdown -= 1;
                } else {
                    window.clearInterval(this.errorInterval);
                    this.errorInterval = null;
                }
            }, 1000);
        }
    }
};
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
