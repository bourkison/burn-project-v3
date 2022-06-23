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
                        :key="template.templateId"
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
                        v-for="template in filteredFollowedTemplates"
                        :key="template.templateId"
                        @click="selectTemplate(template)"
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

<script lang="ts">
import Vue from "vue";
import { TemplateReference } from "@/types/template";

export default Vue.extend({
    name: "TemplateSearch",
    data() {
        return {
            isLoading: true,
            searchText: "",
            createdTemplates: [] as TemplateReference[],
            followedTemplates: [] as TemplateReference[]
        };
    },

    async created() {
        try {
            const init = {
                queryStringParameters: {
                    loadAmount: 25,
                    user: true
                }
            };

            const templateResults = await this.$accessor.api.queryTemplate({ init })

            templateResults.forEach(template => {
                if (template.isFollow) {
                    this.followedTemplates.push(template);
                } else {
                    this.createdTemplates.push(template);
                }
            })
        }
        catch (err: any) {
            if (err.response && err.response.status === 404) {
                console.error("No templates");
            } else {
                // ERROR HERE
            }
        }
        finally {
            this.isLoading = false;
        }
    },

    computed: {
        filteredCreatedTemplates: function(): TemplateReference[] {
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

        filteredFollowedTemplates: function(): TemplateReference[] {
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
        selectTemplate: function(template: TemplateReference) {
            this.$emit("selectTemplate", template);
        }
    }
});
</script>
