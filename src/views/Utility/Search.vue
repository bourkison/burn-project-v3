<template>
    <b-container>
        <b-row align-v="center">
            <b-col sm="8">
                <b-container>
                    <b-card no-body class="searchHeader">
                        <b-card-body>
                            <b-card-title>"{{ searchText }}" Results</b-card-title>

                            <b-card-text>
                                <div class="text-center">
                                    <b-button pill :variant="tabIndex == 0 ? 'primary' : 'outline-primary'" @click="tabIndex=0" size="sm" class="mr-1">Users</b-button>
                                    <b-button pill :variant="tabIndex == 1 ? 'primary' : 'outline-primary'" @click="tabIndex=1" size="sm" class="ml-1 mr-1">Exercises</b-button>
                                    <b-button pill :variant="tabIndex == 2 ? 'primary' : 'outline-primary'" @click="tabIndex=2" size="sm" class="ml-1">Templates</b-button>
                                </div>

                                <div class="mt-3" v-if="!isLoading">
                                    <b-tabs v-model="tabIndex" nav-class="tabNav">
                                        <b-tab title="Users" lazy>
                                            <b-list-group>
                                                <b-list-group-item v-for="user in userResponses" :key="user.id" :to="'/' + user.username">
                                                    <b-avatar class="mr-2" :src="user.profilePhoto" />
                                                    {{ user.username }}
                                                </b-list-group-item>
                                            </b-list-group>
                                        </b-tab>

                                        <b-tab title="Exercises" lazy>
                                            <b-list-group>
                                                <b-list-group-item v-for="exercise in exerciseResponses" :key="exercise.objectID" :to="'/exercises/' + exercise.objectID">
                                                    {{ exercise.name }}
                                                </b-list-group-item>
                                            </b-list-group>
                                        </b-tab>

                                        <b-tab title="Templates" lazy>
                                            <b-list-group>
                                                <b-list-group-item v-for="template in templateResponses" :key="template.objectID" :to="'/templates/' + template.objectID">
                                                    {{ template.name }}
                                                </b-list-group-item>
                                            </b-list-group>
                                        </b-tab>
                                    </b-tabs>
                                </div>

                                <div v-else class="text-center mt-3">
                                    <b-spinner />
                                </div>
                            </b-card-text>
                        </b-card-body>
                    </b-card>
                </b-container>
            </b-col>

            <b-col sm="4">

            </b-col>
        </b-row>
    </b-container>
</template>

<script>
import algoliasearch from 'algoliasearch'

export default {
    name: 'Search',
    data() {
        return {
            isLoading: true,
            searchText: '',

            userResponses: [],
            exerciseResponses: [],
            templateResponses: [],

            tabIndex: 0,

            // Algolia:
            searchClient: algoliasearch(
                "O9KO1L25CJ",
                "e6492bc28cfda8670d4981bb26e4bbbd"
            ),
            userIndex: null,
            exerciseIndex: null,
            templateIndex: null,
        }
    },

    created: function() {
        this.searchText = this.$route.query.q;

        this.userIndex = this.searchClient.initIndex("users");
        this.exerciseIndex = this.searchClient.initIndex("exercises");
        this.templateIndex = this.searchClient.initIndex("templates");

        this.searchAlgolia();
    },

    beforeRouteUpdate: function(to, from, next) {
        next();
        this.searchText = this.$route.query.q;
        this.searchAlgolia();
    },

    methods: {
        searchAlgolia: function() {
            this.isLoading = true;
            this.searchText = this.$route.query.q;

            console.log("SEARCH");

            let searchPromises = [];

            this.userResponses = [];
            this.exerciseResponses = [];
            this.templateResponses = [];

            if (this.searchText) {
                searchPromises.push(this.userIndex.search(this.searchText).then(responses => {
                    responses.hits.forEach(hit => {
                        this.userResponses.push(hit);
                    })
                }))

                searchPromises.push(this.exerciseIndex.search(this.searchText).then(responses => {
                    responses.hits.forEach(hit => {
                        this.exerciseResponses.push(hit);
                    })
                }))

                searchPromises.push(this.templateIndex.search(this.searchText).then(responses => {
                    responses.hits.forEach(hit => {
                        this.templateResponses.push(hit);
                    })
                }))

                Promise.all(searchPromises)
                .then(() => {
                    console.log("USER RESPONSES:", this.userResponses, "EXERCISE RESPONSES:", this.exerciseResponses, "TEMPLATE RESPONSES:", this.templateResponses);
                    this.isLoading = false;
                })
            } else {
                this.isLoading = false;
            }
        }
    }
}
</script>

<style scoped>
    .searchHeader,
    .searchResults {
        margin-top: 40px;
    }
</style>

<style>
    .tabNav {
        display: none !important;
    }
</style>