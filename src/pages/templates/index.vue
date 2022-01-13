<template>
    <b-container>
        <b-row>
            <b-col sm="3">
                <b-card class="navCard" no-body>
                    <b-list-group>
                        <b-list-group-item class="navItem" to="/templates" active>
                            <div class="d-flex align-items-center">
                                Templates
                                <b-icon-house class="ml-auto" />
                            </div>
                        </b-list-group-item>
                        <b-list-group-item
                            class="navItem"
                            to="/templates/followed"
                            active-class="unset"
                        >
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

                <b-card class="navCard" no-body>
                    <b-card-body>
                        <b-card-title>Sort By</b-card-title>
                    </b-card-body>
                </b-card>
            </b-col>
            <b-col sm="6">
                <b-container>
                    <div v-if="templates.length > 0 || isLoading">
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
                    <div v-else>Error pulling top templates</div>
                </b-container>
            </b-col>
            <b-col sm="3">
                <!-- 
                    Ads here.
                 -->
                <div class="adTest bg-warning text-center">
                    Template Home Ad Here.
                </div>
            </b-col>
        </b-row>
    </b-container>
</template>

<script lang="ts">
import Vue from "vue";
import { ITemplateReference } from "@/types";
import { QueryTemplateInit } from "@/types/api";

import MuscleGroupSelector from "@/components/Utility/MuscleGroupSelector.vue";
import TagSelector from "@/components/Utility/TagSelector.vue";
import UsernameFilter from "@/components/Utility/UsernameFilter.vue";

import TemplateFeed from "@/components/Template/TemplateFeed.vue";

type TemplateDiscoverData = {
    isLoading: boolean;
    templates: ITemplateReference[];
    selectedMgs: string[];
    selectedTags: string[]
    isLoadingMore: boolean;
    moreToLoad: boolean;
    errorCountdown: number;
    errorMessage: string;
    errorInterval: number | undefined;
}

export default Vue.extend({
    middleware: ["requiresAuth"],
    components: {
        MuscleGroupSelector,
        TagSelector,
        UsernameFilter,
        TemplateFeed
    },
    data(): TemplateDiscoverData {
        return {
            isLoading: true,
            templates: [],

            // Filters:
            selectedMgs: [],
            selectedTags: [],

            // Lazy loading:
            isLoadingMore: true,
            moreToLoad: true,

            // Error handling:
            errorCountdown: 0,
            errorMessage: "",
            errorInterval: undefined
        };
    },

    mounted() {
        if (this.$route.query.muscleGroups && typeof this.$route.query.muscleGroups === "string") {
            this.selectedMgs = this.$route.query.muscleGroups.split(",");
        }

        if (this.$route.query.tags && typeof this.$route.query.tags === "string") {
            this.selectedTags = this.$route.query.tags.split(",");
        }

        this.downloadTemplates();
    },

    methods: {
        async downloadTemplates(): Promise<void> {
            try {
                this.isLoading = true;
                await this.queryTemplate(this.templates[this.templates.length - 1].templateId);
            } 
            catch (err: any) {
                if (err.response && err.response.status !== 404) {
                    this.displayError(err);
                }
            } 
            finally {
                this.isLoading = false;
                this.isLoadingMore = false;
            }
        },

        async loadMoreTemplates(): Promise<void> {
            if (!this.isLoadingMore && this.moreToLoad) {
                try {
                    this.isLoadingMore = true;
                    await this.queryTemplate()
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

        async queryTemplate(startAt?: string): Promise<void> {
            const init: QueryTemplateInit = {
                queryStringParameters: {
                    loadAmount: 5,
                    user: false
                }
            }

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

            if (references.length < 5) {
                this.moreToLoad = false;
            }
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
        },

        updateMuscleGroups(muscleGroups: string[]): void {
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
                this.$router.replace({
                    path: "/templates",
                    query: query
                });
            } else {
                this.$router.replace({
                    path: "/templates",
                    query: undefined
                });
            }

            this.downloadTemplates();
        },

        updateTags(tags: string[]): void {
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
                this.$router.replace({ path: "/templates", query: query });
            } else {
                this.$router.replace({
                    path: "/templates",
                    query: undefined
                });
            }

            this.downloadTemplates();
        }
    }
});
</script>

<style scoped>
.navCard,
.templateFeed {
    margin-top: 40px;
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

<style>
.filterTabsNab {
    padding: 0.5rem !important;
}
</style>
