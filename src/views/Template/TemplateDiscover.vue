<template>
<b-container>
        <b-row>
            <b-col sm="3">
                <b-card class="navCard" no-body>
                    <b-list-group>
                        <b-list-group-item class="navItem" to="/templates" active-class="unset" exact-active-class="active">
                            <div class="d-flex align-items-center">
                                Templates
                                <b-icon-house class="ml-auto" />
                            </div>
                        </b-list-group-item>
                        <b-list-group-item class="navItem" to="/templates/discover" active-class="unset" exact-active-class="active">
                            <div class="d-flex align-items-center">
                                Discover
                                <b-icon-search class="ml-auto"/>
                            </div>
                        </b-list-group-item>
                        <b-list-group-item class="navItem" to="/templates/new" active-class="unset" exact-active-class="active">
                            <div class="d-flex align-items-center">
                                New
                                <b-icon-plus class="ml-auto"/>
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
                                <MuscleGroupSelector @updateMuscleGroups="updateMuscleGroups" />
                            </div>

                            <div class="mt-3">
                                <h6>Tags</h6>
                                <TagSelector />
                            </div>
                        </div>
                    </b-card-body>
                </b-card>
            </b-col>
            <b-col sm="6">
                <b-container>
                    <div v-if="templates.length > 0 && !isLoading">
                        <TemplateFeed class="templateFeed" :templates="templates" />

                        <div class="text-center" v-if="moreToLoad">
                            <b-button @click="loadMoreTemplates" variant="outline-dark" size="sm" v-b-visible.200="loadMoreTemplates">
                                <span v-if="!isLoadingMore">Load More</span>
                                <span v-else><b-spinner small /></span>
                            </b-button>
                        </div>
                    </div>
                    <div v-else-if="isLoading" class="text-center mt-5"><b-spinner /></div>
                    <div v-else>Error pulling top templates</div>
                </b-container>
            </b-col>
            <b-col sm="3">
                <!-- 
                    Ads here.
                 -->
            </b-col>
        </b-row>
    </b-container>
</template>

<script>
import { templatesCollection } from '@/firebase'

import MuscleGroupSelector from '@/components/Utility/MuscleGroupSelector.vue'
import TagSelector from '@/components/Utility/TagSelector.vue'
import UsernameFilter from '@/components/Utility/UsernameFilter.vue'

import TemplateFeed from '@/components/Template/TemplateFeed.vue'

export default {
    name: 'TemplateDiscover',
    components: { MuscleGroupSelector, TagSelector, UsernameFilter, TemplateFeed },
    data() {
        return {
            isLoading: true,
            templates: [],

            // Firebase:
            fbQuery: null,

            // Filters:
            selectedMgs: [],

            // Lazy loading:
            isLoadingMore: true,
            moreToLoad: true,
            lastLoadedTemplate: null,
        }
    },

    created: function() {
        templatesCollection().orderBy("createdAt", "desc").limit(5).get()
        .then(templateSnapshot => {
            templateSnapshot.forEach(templateDoc => {
                this.templates.push(templateDoc.id)
            })


            if (templateSnapshot.size < 5) {
                this.moreToLoad = false;
            }

            setTimeout(() => { this.isLoadingMore = false }, 500);
            this.lastLoadedTemplate = templateSnapshot.docs[templateSnapshot.size - 1];

            this.isLoading = false;
        })
        .catch(e => {
            console.error("Error downloading templates", e);
        })
    },

    methods: {
        getTemplates: function() {
            this.isLoading = true;
            this.templates = [];
            this.moreToLoad = true;
            this.lastLoadedTemplate = null;
            this.isLoadingMore = true;

            this.fbQuery = templatesCollection();

            if (this.selectedMgs.length > 0) {
                this.fbQuery = this.fbQuery.where("muscleGroups", "array-contains-any", this.selectedMgs);
            }

            this.fbQuery.orderBy("createdAt", "desc").limit(5).get()
            .then(templateSnapshot => {
                if (templateSnapshot.size > 0) {
                    templateSnapshot.forEach(template => {
                        this.templates.push(template.id);
                    })

                    if (templateSnapshot.size < 5) {
                        this.moreToLoad = false;
                    }

                    setTimeout(() => { this.isLoadingMore = false }, 500);
                    this.lastLoadedTemplate = templateSnapshot.docs[templateSnapshot.size - 1];
                } else {
                    this.moreToLoad = false;
                }

                this.isLoading = false;
            })
            .catch(e => {
                this.isLoading = false;
                console.error("Error getting templates:", e);
            })
        },

        loadMoreTemplates: function() {
            if (!this.isLoadingMore) {
                templatesCollection().orderBy("createdAt", "desc").startAfter(this.lastLoadedTemplate).limit(5).get()
                .then(templateSnapshot => {
                    templateSnapshot.forEach(template => {
                        this.templates.push(template.id);
                    })

                    if (templateSnapshot.size < 5) {
                        this.moreToLoad = false;
                    }

                    setTimeout(() => { this.isLoadingMore = false }, 500);
                    this.lastLoadedTemplate = templateSnapshot.docs[templateSnapshot.size - 1];
                })
                .catch(e => {
                    console.error("Error downloading more templates:", e);
                })
            }
        },

        updateMuscleGroups: function(muscleGroups) {
            this.selectedMgs = muscleGroups;
            this.getTemplates();
        }
    }
}
</script>

<style scoped>
.navCard,
.templateFeed {
    margin-top: 40px;
}
</style>

<style>
    .filterTabsNab {
        padding: 0.5rem !important;
    }
</style>