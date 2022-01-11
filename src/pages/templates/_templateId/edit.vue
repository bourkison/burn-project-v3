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

<script>
import { API } from "aws-amplify";

import TagSelector from "@/components/Utility/TagSelector.vue";
import MuscleGroupSelector from "@/components/Utility/MuscleGroupSelector.vue";
import DifficultySelector from "@/components/Utility/DifficultySelector.vue";
import TemplateBuilder from "@/components/Template/TemplateBuilder.vue";
import DescriptionEditor from "@/components/TextEditor/DescriptionEditor.vue";

export default {
    middleware: ["requiresAuth"],
    components: {
        DescriptionEditor,
        TagSelector,
        MuscleGroupSelector,
        DifficultySelector,
        TemplateBuilder
    },
    data() {
        return {
            isUpdating: false,

            oldTemplateData: {},
            newTemplateData: {},

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

            // Errror handling:
            errorCountdown: 0,
            errorMessage: "",
            errorInterval: null
        };
    },

    async asyncData({ params, req, redirect, store, error }) {
        let oldTemplateData = null;
        let newTemplateData = null;

        try {
            const path = "/template/" + params.templateId;
            const myInit = {
                headers: {
                    Authorization: await store.dispatch("fetchJwtToken", { req })
                }
            };

            const response = await API.get(store.state.apiName, path, myInit);

            if (!response || !response.success) {
                throw new Error(
                    "Error downloading template: " +
                        params.templateId +
                        " response: " + response ? response.message : ""
                );
            }

            console.log("RESPONSE:", response);
            newTemplateData = response.data;
            oldTemplateData = response.data;

            if (oldTemplateData.createdBy.username !== store.state.userProfile.docData.username) {
                console.warn("Unauthorized");
                redirect("/templates/" + params.templateId);
            }
        } catch (err) {
            console.error(err);
            error({ message: err.message, statusCode: (err.response && err.response.status) });
        }

        return {
            oldTemplateData,
            newTemplateData
        }
    },

    methods: {
        async updateTemplate() {
            try {
                this.isUpdating = true;
                console.log("Updating with:", JSON.stringify(this.newTemplateData));

                const path = "/template/" + this.$route.params.templateid;
                const myInit = {
                    headers: {
                        Authorization: await this.$store.dispatch("fetchJwtToken")
                    },
                    body: {
                        templateForm: this.newTemplateData
                    }
                };

                const response = await API.put(this.$store.state.apiName, path, myInit);

                if (!response) {
                    throw new Error("no API response");
                }

                if (!response.success) {
                    throw new Error("API error: " + response.errorMessage);
                }

                this.$router.push("/templates/" + response.data._id);
            } catch (err) {
                this.displayError(err);
            } finally {
                this.isUpdating = false;
            }
        },

        updateDescription(md) {
            this.newTemplateData.description = md;
        },

        updateTags(tags) {
            this.newTemplateData.tags = tags;
        },

        updateMuscleGroups(muscleGroups) {
            this.newTemplateData.muscleGroups = muscleGroups;
        },

        updateDifficulty(difficulty) {
            this.newTemplateData.difficulty = difficulty;
        },

        updateExercises(exercises) {
            let temp = [];
            exercises.forEach(exercise => {
                temp.push({ id: exercise.id, name: exercise.name });
            });

            this.newTemplateData.exercises = temp;
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