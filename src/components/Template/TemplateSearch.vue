<template>
    <div>
        <b-form-input v-model="searchText" placeholder="Search templates..." />

        <div v-if="!isLoading">
            <div v-if="filteredCreatedTemplates.length > 0" class="mt-3">
                <h6>My Templates</h6>

                <b-list-group>
                    <b-list-group-item
                        class="d-flex"
                        align-v="center"
                        v-for="template in filteredCreatedTemplates"
                        :key="template.id"
                        @click="selectTemplate(template)"
                        href="#"
                    >
                        <div>{{ template.name }}</div>
                    </b-list-group-item>
                </b-list-group>
            </div>

            <div v-if="filteredFollowedTemplates.length > 0" class="mt-3">
                <h6>Followed Templates</h6>

                <b-list-group>
                    <b-list-group-item
                        class="d-flex"
                        align-v="center"
                        v-for="template in filteredFollowedWorkouts"
                        :key="template.id"
                        @click="selectWorkout(template)"
                        href="#"
                    >
                        <div>{{ template.name }}</div>
                    </b-list-group-item>
                </b-list-group>
            </div>
        </div>

        <div v-else class="text-center mt-3">
            <b-spinner small />
        </div>
    </div>
</template>

<script>
import { templatesCollection, userTemplatesCollection } from "@/firebase";

export default {
    name: "TemplateSearch",
    data() {
        return {
            isLoading: true,
            searchText: "",
            createdTemplates: [],
            followedTemplates: []
        };
    },

    created: function() {
        let templateDownloadPromises = [];

        userTemplatesCollection(this.$store.state.userProfile.data.uid)
            .get()
            .then(templateSnapshot => {
                templateSnapshot.forEach(templateDoc => {
                    let userTemplateData = templateDoc.data();
                    userTemplateData.id = templateDoc.id;

                    if (userTemplateData.isFollow) {
                        templateDownloadPromises.push(
                            templatesCollection()
                                .doc(userTemplateData.id)
                                .get()
                                .then(templateDoc => {
                                    let templateData = templateDoc.data();
                                    templateData.id = templateDoc.id;

                                    this.followedTemplates.push(templateData);
                                })
                        );
                    } else {
                        templateDownloadPromises.push(
                            templatesCollection()
                                .doc(userTemplateData.id)
                                .get()
                                .then(templateDoc => {
                                    let templateData = templateDoc.data();
                                    templateData.id = templateDoc.id;

                                    this.createdTemplates.push(templateData);
                                })
                        );
                    }
                });

                return Promise.all(templateDownloadPromises);
            })
            .then(() => {
                this.isLoading = false;
            })
            .catch(e => {
                console.error("Error downloading templates:", e);
            });
    },

    computed: {
        filteredCreatedTemplates: function() {
            if (this.searchText) {
                return this.createdTemplates.filter(createdTemplate => {
                    return createdTemplate.name
                        .toLowerCase()
                        .includes(this.searchText.toLowerCase());
                });
            } else {
                return this.createdTemplates;
            }
        },

        filteredFollowedTemplates: function() {
            if (this.searchText) {
                return this.followedTemplates.filter(followedTemplate => {
                    return followedTemplate.name
                        .toLowerCase()
                        .includes(this.searchText.toLowerCase());
                });
            } else {
                return this.followedTemplates;
            }
        }
    },

    methods: {
        selectTemplate: function(template) {
            this.$emit("selectTemplate", template);
        }
    }
};
</script>
