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
                        <b-card-title>Filters</b-card-title>

                        <div>
                            <h6>Username</h6>
                            <!-- <b-form-radio-group class="w-100" buttons stacked button-variant="outline-primary" :options="[{text: 'All', value: 'all'}, {text: 'Created', value: 'created'}, {text: 'Followed', value: 'followed'}]" /> -->
                            <UsernameFilter />
                        </div>
                    </b-card-body>
                </b-card>
            </b-col>
            <b-col sm="6">
                <b-container>
                    <div v-if="templates.length > 0 && !isLoading" class="mb-4">
                        <TemplateFeed class="templateFeed" :templates="templates" />

                        <div class="text-center" v-if="moreToLoad">
                            <b-button @click="loadMoreTemplates" variant="outline-dark" size="sm" v-b-visible.200="loadMoreTemplates">
                                <span v-if="!isLoadingMore">Load More</span>
                                <span v-else><b-spinner small /></span>
                            </b-button>
                        </div>
                    </div>
                    <div v-else-if="isLoading" class="text-center mt-5">
                        <b-spinner />
                    </div>
                    <div v-else>
                        <em>Looks like you haven't followed or created any templates.</em>
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
                 <div class="adTestCont">
                    <div class="adTest bg-warning text-center">
                        Template Home Ad Here.
                    </div>
                 </div>
            </b-col>
        </b-row>
    </b-container>
</template>

<script>
import { userTemplatesCollection } from '@/firebase'
import { API } from 'aws-amplify';

import TemplateFeed from '@/components/Template/TemplateFeed.vue'
import UsernameFilter from '@/components/Utility/UsernameFilter.vue'

export default {
    name: 'TemplateFollowed',
    components: { TemplateFeed, UsernameFilter },
    data() {
        return {
            isLoading: true,
            templates: [],

            // Filters:
            selectedMgs: [],

            // Lazy loading:
            isLoadingMore: true,
            moreToLoad: true,
            lastLoadedTemplate: null,

            // Errror handling:
            errorCountdown: 0,
            errorMessage: '',
            errorInterval: null
        }
    },

    created: async function() {
        try {
            this.isLoading = true;
    
            const path = '/template';
            const myInit = {
                headers: {
                    Authorization: this.$store.state.userProfile.data.signInUserSession.idToken.jwtToken
                },
                queryStringParameters: {
                    loadAmount: 5
                }
            };
    
            const response = await API.get(this.$store.state.apiName, path, myInit).catch(err => {
                console.error(err);
                throw new Error("Promise catch: " + err)
            })

            if (!response) { 
                throw new Error("No response");
            }

            if (!response.success) {
                throw new Error("Unsuccessful: " + response.errorMessage);
            }

            this.templates = response.data;
        }
        catch (err) {
            this.displayError(err);
        }
        finally {
            this.isLoading = false;
        }
    },

    methods: {
        loadMoreTemplates: function() {
            if (!this.isLoadingMore) {
                userTemplatesCollection(this.$store.state.userProfile.data.uid).orderBy("createdAt", "desc").startAfter(this.lastLoadedTemplate).limit(5).get()
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
            // this.getTemplates();
        },

        displayError: function(err) {
            this.errorCountdown = 30;
            console.error(err);
            this.errorMessage = "Oops, an error has occured... Please try again later.";

            this.errorInterval = window.setInterval(() => {
                if (this.errorCountdown > 0) {    
                    this.errorCountdown -= 1
                } else {
                    window.clearInterval(this.errorInterval);
                    this.errorInterval = null;
                }
            }, 1000);
        }
    }
}
</script>

<style scoped>
.navCard,
.templateFeed {
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
    line-height: 250px
}
</style>