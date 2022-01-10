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

<script>
import { API } from "aws-amplify";

import MuscleGroupSelector from "@/components/Utility/MuscleGroupSelector.vue";
import TagSelector from "@/components/Utility/TagSelector.vue";
import UsernameFilter from "@/components/Utility/UsernameFilter.vue";

import TemplateFeed from "@/components/Template/TemplateFeed.vue";

export default {
    name: "TemplateDiscover",
    components: {
        MuscleGroupSelector,
        TagSelector,
        UsernameFilter,
        TemplateFeed
    },
    data() {
        return {
            isLoading: true,
            templates: [],

            // Firebase:
            fbQuery: null,

            // Filters:
            selectedMgs: [],
            selectedTags: [],

            // Lazy loading:
            isLoadingMore: true,
            moreToLoad: true,
            lastLoadedTemplate: null,

            // Error handling:
            errorCountdown: 0,
            errorMessage: "",
            errorInterval: null
        };
    },

    mounted() {
        if (this.$route.query.muscleGroups) {
            this.selectedMgs = this.$route.query.muscleGroups.split(",");
        }

        if (this.$route.query.tags) {
            this.selectedTags = this.$route.query.tags.split(",");
        }

        this.downloadTemplates();
    },

    methods: {
        async downloadTemplates() {
            try {
                this.isLoading = true;
                this.templates = [];

                const path = "/template";
                let myInit = {
                    headers: {
                        Authorization: await this.$store.dispatch("fetchJwtToken")
                    },
                    queryStringParameters: {
                        loadAmount: 5,
                        user: false
                    }
                };

                if (this.selectedMgs.length > 0) {
                    myInit.queryStringParameters.muscleGroups = this.selectedMgs.join(",");
                }

                if (this.selectedTags.length > 0) {
                    myInit.queryStringParameters.tags = this.selectedTags.join(",");
                }

                const response = await API.get(this.$store.state.apiName, path, myInit).catch(
                    err => {
                        throw err;
                    }
                );

                if (!response) {
                    throw new Error("No response");
                }

                if (!response.success) {
                    throw new Error("Unsuccessful: " + response.errorMessage);
                }

                response.data.forEach(template => {
                    let temp = template;
                    temp.loaded = false;
                    this.templates.push(temp);
                })

                if (response.data.length < 5) {
                    this.moreToLoad = false;
                }
            } catch (err) {
                if (err.response && err.response.status !== 404) {
                    this.displayError(err);
                }
            } finally {
                this.isLoading = false;
                this.isLoadingMore = false;
            }
        },

        async loadMoreTemplates() {
            if (!this.isLoadingMore && this.moreToLoad) {
                try {
                    this.isLoadingMore = true;
                    const path = "/template";
                    let myInit = {
                        headers: {
                            Authorization: await this.$store.dispatch("fetchJwtToken")
                        },
                        queryStringParameters: {
                            loadAmount: 5,
                            user: false,
                            startAt: this.templates[this.templates.length - 1]._id
                        }
                    };
    
                    if (this.selectedMgs.length > 0) {
                        myInit.queryStringParameters.muscleGroups = this.selectedMgs.join(",");
                    }
    
                    if (this.selectedTags.length > 0) {
                        myInit.queryStringParameters.tags = this.selectedTags.join(",");
                    }
    
                    const response = await API.get(this.$store.state.apiName, path, myInit);
    
                    response.data.forEach(template => {
                        let temp = template;
                        temp.loaded = false;
                        this.templates.push(temp);
                    })
    
                    if (response.data.length < 5) {
                        this.moreToLoad = false;
                    }
                }
                catch (err) {
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
        },

        updateMuscleGroups(muscleGroups) {
            this.selectedMgs = muscleGroups;
            let isFiltered = false;

            let query = {};

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
                    query: null
                });
            }

            this.downloadTemplates();
        },

        updateTags(tags) {
            this.selectedTags = tags;
            let isFiltered = false;

            let query = {};

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
                    query: null
                });
            }

            this.downloadTemplates();
        }
    }
};
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
