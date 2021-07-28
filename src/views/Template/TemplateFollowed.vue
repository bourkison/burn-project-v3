<template>
    <b-container>
        <b-row>
            <b-col sm="3">
                <!-- 
                    Add here: 
                    - Links to Home, New, Discover
                    - Filter by (tags)
                -->
                <b-card class="navCard" no-body>
                    <b-list-group>
                        <b-list-group-item
                            class="navItem"
                            to="/templates"
                            active-class="unset"
                            active
                        >
                            <div class="d-flex align-items-center">
                                Templates
                                <b-icon-house class="ml-auto" />
                            </div>
                        </b-list-group-item>
                        <b-list-group-item
                            class="navItem"
                            to="/templates/discover"
                            active-class="unset"
                        >
                            <div class="d-flex align-items-center">
                                Discover
                                <b-icon-search class="ml-auto" />
                            </div>
                        </b-list-group-item>
                        <b-list-group-item
                            class="navItem"
                            to="/templates/new"
                            active-class="unset"
                        >
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
                                <TagSelector
                                    @updateTags="updateTags"
                                    :initTags="selectedTags"
                                />
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
                    Template Home Ad Here.
                </div>
            </b-col>
        </b-row>
    </b-container>
</template>

<script>
import { userTemplatesCollection } from "@/firebase";
import { API } from "aws-amplify";

import TemplateFeed from "@/components/Template/TemplateFeed.vue";

import UsernameFilter from "@/components/Utility/UsernameFilter.vue";
import MuscleGroupSelector from "@/components/Utility/MuscleGroupSelector.vue";
import TagSelector from "@/components/Utility/TagSelector.vue";

export default {
    name: "TemplateFollowed",
    components: {
        TemplateFeed,
        UsernameFilter,
        MuscleGroupSelector,
        TagSelector
    },
    data() {
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
            lastLoadedTemplate: null,

            // Errror handling:
            errorCountdown: 0,
            errorMessage: "",
            errorInterval: null
        };
    },

    created: async function() {
        if (this.$route.query.muscleGroups) {
            this.selectedMgs = this.$route.query.muscleGroups.split(",");
        }

        if (this.$route.query.tags) {
            this.selectedTags = this.$route.query.tags.split(",");
        }

        this.downloadTemplates();
    },

    methods: {
        downloadTemplates: async function() {
            try {
                this.isLoading = true;
                this.templates = [];

                const path = "/template";
                let myInit = {
                    headers: {
                        Authorization: this.$store.state.userProfile.data
                            .idToken.jwtToken
                    },
                    queryStringParameters: {
                        loadAmount: 5,
                        user: true
                    }
                };

                if (this.selectedMgs.length > 0) {
                    myInit.queryStringParameters.muscleGroups = this.selectedMgs.join(
                        ","
                    );
                }

                if (this.selectedTags.length > 0) {
                    myInit.queryStringParameters.tags = this.selectedTags.join(
                        ","
                    );
                }

                const response = await API.get(
                    this.$store.state.apiName,
                    path,
                    myInit
                ).catch(err => {
                    if (err.response.status === 404) {
                        this.templates = [];
                    } else {
                        throw err;
                    }
                });

                if (!response) {
                    throw new Error("No response");
                }

                if (!response.success) {
                    throw new Error("Unsuccessful: " + response.errorMessage);
                }

                this.templates = response.data;
                this.isLoadingMore = false;
                this.moreToLoad = false;
            } catch (err) {
                if (err.response && err.response.status !== 404) {
                    this.displayError(err);
                }
            } finally {
                this.isLoading = false;
            }
        },

        loadMoreTemplates: function() {
            if (!this.isLoadingMore) {
                userTemplatesCollection(this.$store.state.userProfile.data.uid)
                    .orderBy("createdAt", "desc")
                    .startAfter(this.lastLoadedTemplate)
                    .limit(5)
                    .get()
                    .then(templateSnapshot => {
                        templateSnapshot.forEach(template => {
                            this.templates.push(template.id);
                        });

                        if (templateSnapshot.size < 5) {
                            this.moreToLoad = false;
                        }

                        setTimeout(() => {
                            this.isLoadingMore = false;
                        }, 500);
                        this.lastLoadedTemplate =
                            templateSnapshot.docs[templateSnapshot.size - 1];
                    })
                    .catch(e => {
                        console.error("Error downloading more templates:", e);
                    });
            }
        },

        displayError: function(err) {
            this.errorCountdown = 30;
            console.error(err);
            this.errorMessage =
                "Oops, an error has occured... Please try again later.";

            this.errorInterval = window.setInterval(() => {
                if (this.errorCountdown > 0) {
                    this.errorCountdown -= 1;
                } else {
                    window.clearInterval(this.errorInterval);
                    this.errorInterval = null;
                }
            }, 1000);
        },

        updateMuscleGroups: function(muscleGroups) {
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
                this.$router.replace({ path: "/templates", query: query });
            }

            this.downloadTemplates();
        },

        updateTags: function(tags) {
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
                this.$router.replace({ path: "/templates", query: null });
            }
            this.downloadTemplates();
        }
    }
};
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
