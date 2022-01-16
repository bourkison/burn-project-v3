<template>
    <b-container>
        <b-row>
            <b-col sm="3">
                <b-card class="navCard" no-body>
                    <b-list-group>
                        <b-list-group-item class="navItem" to="/templates" active-class="unset">
                            <div class="d-flex align-items-center">
                                Templates
                                <b-icon-house class="ml-auto" />
                            </div>
                        </b-list-group-item>
                        <b-list-group-item class="navItem" to="/templates/followed" active>
                            <div class="d-flex align-items-center">
                                Followed
                                <b-icon-search class="ml-auto" />
                            </div>
                        </b-list-group-item>
                        <b-list-group-item class="navItem" to="/templates/new" active-class="unset">
                            <div class="d-flex align-items-center">
                                New
                                <b-icon-plus class="ml-auto" />
                            </div>
                        </b-list-group-item>
                    </b-list-group>
                </b-card>

                <b-card class="navCard" no-body>
                    <b-card-body>
                        <b-card-title>Filter By</b-card-title>

                        <div>
                            <div>
                                <h6>Username</h6>
                                <UsernameFilter />
                            </div>
                            <div class="mt-3">
                                <h6>Muscle Groups</h6>
                                <MuscleGroupSelector
                                    @updateMuscleGroups="updateMuscleGroups"
                                    :initMgs="selectedMgs"
                                />
                            </div>

                            <div class="mt-3">
                                <h6>Tags</h6>
                                <TagSelector @updateTags="updateTags" :initTags="selectedTags" />
                            </div>
                        </div>
                    </b-card-body>
                </b-card>
            </b-col>
            <b-col sm="6">
                <b-container>
                    <div v-if="templates.length > 0 || isLoading" class="mb-4">
                        <TemplateFeed
                            class="templateFeed"
                            :templates="templates"
                            :isLoading="isLoading"
                        />

                        <div class="text-center" v-if="moreToLoad">
                            <b-button
                                @click="loadMoreTemplates"
                                variant="outline-dark"
                                size="sm"
                                v-b-visible.200="loadMoreTemplates"
                            >
                                <span v-if="!isLoadingMore">Load More</span>
                                <span v-else><b-spinner small/></span>
                            </b-button>
                        </div>
                    </div>
                    <div v-else class="text-center notemplatesfound">
                        No templates found!
                    </div>
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
            </b-col>
            <b-col sm="3">
                <!-- 
                    Ads here.
                 -->
                <div class="adTest bg-warning text-center">
                    Template Followed Ad Here.
                </div>
            </b-col>
        </b-row>
    </b-container>
</template>

<script lang="ts">
import Vue from "vue";
import { TemplateReference, QueryTemplateInit } from "@/types/template";

import TemplateFeed from "@/components/Template/TemplateFeed.vue";

import UsernameFilter from "@/components/Utility/UsernameFilter.vue";
import MuscleGroupSelector from "@/components/Utility/MuscleGroupSelector.vue";
import TagSelector from "@/components/Utility/TagSelector.vue";

type TemplateFollowedData = {
    isLoading: boolean;
    templateExists: boolean;
    templates: TemplateReference[];
    selectedMgs: string[];
    selectedTags: string[];
    isLoadingMore: boolean;
    moreToLoad: boolean;
    errorCountdown: number;
    errorMessage: string;
    errorInterval: number | undefined;
}

export default Vue.extend({
    middleware: ["requiresAuth"],
    components: {
        TemplateFeed,
        UsernameFilter,
        MuscleGroupSelector,
        TagSelector
    },
    data(): TemplateFollowedData {
        return {
            isLoading: true,
            templateExists: false,
            templates: [],

            // Filters:
            selectedMgs: [],
            selectedTags: [],

            // Lazy loading:
            isLoadingMore: true,
            moreToLoad: true,

            // Errror handling:
            errorCountdown: 0,
            errorMessage: "",
            errorInterval: undefined
        };
    },

    async mounted() {
        if (this.$route.query.muscleGroups && typeof this.$route.query.muscleGroups === "string") {
            this.selectedMgs = this.$route.query.muscleGroups.split(",");
        }

        if (this.$route.query.tags && typeof this.$route.query.tags === "string") {
            this.selectedTags = this.$route.query.tags.split(",");
        }

        this.downloadTemplates();
    },

    methods: {
        async downloadTemplates() {
            try {
                this.isLoading = true;
                await this.queryTemplates();
            } catch (err: any) {
                if (err.response && err.response.status !== 404) {
                    this.displayError(err);
                }

                this.moreToLoad = false;
            } 
            finally {
                this.isLoading = false;
                this.isLoadingMore = false;
            }
        },

        async loadMoreTemplates() {
            if (!this.isLoadingMore && this.moreToLoad) {
                try {
                    this.isLoadingMore = true;
                    await this.queryTemplates(this.templates[this.templates.length - 1].templateId)
                }
                catch (err: any) {
                    if (err.response && err.response.status !== 404) {
                        this.displayError(err);
                    }

                    this.moreToLoad = false;
                }
                finally {
                    this.isLoadingMore = false;
                }
            }
        },

        async queryTemplates(startAt?: string) {
            let init: QueryTemplateInit = {
                queryStringParameters: {
                    loadAmount: 5,
                    user: true
                }
            };

            if (startAt && init.queryStringParameters) {
                init.queryStringParameters.startAt = startAt;
            }

            if (this.selectedMgs.length > 0 && init.queryStringParameters) {
                init.queryStringParameters.muscleGroups = this.selectedMgs.join(",");
            }

            if (this.selectedTags.length > 0 && init.queryStringParameters) {
                init.queryStringParameters.tags = this.selectedTags.join(",");
            }

            const references = await this.$accessor.api.queryTemplate({ init });


            references.forEach(reference => {
                reference.loaded = false;
                this.templates.push(reference);
            })
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
        },

        updateMuscleGroups(muscleGroups: string[]) {
            this.selectedMgs = muscleGroups;
            let isFiltered = false;

            let query: { muscleGroups?: string, tags?: string } = {};

            if (this.selectedMgs.length > 0) {
                isFiltered = true;
                query.muscleGroups = this.selectedMgs.join(",");
            }

            if (this.selectedTags.length > 0) {
                isFiltered = true;
                query.tags = this.selectedTags.join(",");
            }

            if (isFiltered) {
                this.$router.replace({ path: "/templates/followed", query: query });
            } else {
                this.$router.replace({ path: "/templates/followed", query: undefined });
            }

            this.downloadTemplates();
        },

        updateTags(tags: string[]) {
            this.selectedTags = tags;
            let isFiltered = false;

            let query: { muscleGroups?: string, tags?: string } = {};

            if (this.selectedMgs.length > 0) {
                isFiltered = true;
                query.muscleGroups = this.selectedMgs.join(",");
            }

            if (this.selectedTags.length > 0) {
                isFiltered = true;
                query.tags = this.selectedTags.join(",");
            }

            if (isFiltered) {
                this.$router.replace({ path: "/templates/followed", query: query });
            } else {
                this.$router.replace({ path: "/templates/followed", query: undefined });
            }
            this.downloadTemplates();
        }
    }
});
</script>

<style scoped>
.navCard,
.templateFeed,
.notemplatesfound {
    margin-top: 40px;
}

.adTestCont {
    height: 1000px;
}

.adTest {
    position: sticky;
    top: 100px;
    height: 250px;
    width: 300px;
    padding: 0;
    margin-top: 40px;
    line-height: 250px;
}
</style>
