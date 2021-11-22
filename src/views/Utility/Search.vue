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
                                    <b-button
                                        pill
                                        :variant="tabIndex == 0 ? 'primary' : 'outline-primary'"
                                        @click="tabIndex = 0"
                                        size="sm"
                                        class="mr-1"
                                        >Users</b-button
                                    >
                                    <b-button
                                        pill
                                        :variant="tabIndex == 1 ? 'primary' : 'outline-primary'"
                                        @click="tabIndex = 1"
                                        size="sm"
                                        class="ml-1 mr-1"
                                        >Exercises</b-button
                                    >
                                    <b-button
                                        pill
                                        :variant="tabIndex == 2 ? 'primary' : 'outline-primary'"
                                        @click="tabIndex = 2"
                                        size="sm"
                                        class="ml-1"
                                        >Templates</b-button
                                    >
                                </div>

                                <div class="mt-3" v-if="!isLoading">
                                    <b-tabs v-model="tabIndex" nav-class="tabNav">
                                        <b-tab title="Users" lazy>
                                            <b-list-group>
                                                <b-list-group-item
                                                    v-for="user in userResponses"
                                                    :key="user._id"
                                                    :to="'/' + user.username"
                                                >
                                                    <b-avatar
                                                        class="mr-2"
                                                        :src="user.profilePhoto"
                                                    />
                                                    {{ user.username }}
                                                </b-list-group-item>
                                            </b-list-group>
                                        </b-tab>

                                        <b-tab title="Exercises" lazy>
                                            <b-list-group>
                                                <b-list-group-item
                                                    v-for="exercise in exerciseResponses"
                                                    :key="exercise._id"
                                                    :to="'/exercises/' + exercise._id"
                                                >
                                                    {{ exercise.name }}
                                                </b-list-group-item>
                                            </b-list-group>
                                        </b-tab>

                                        <b-tab title="Templates" lazy>
                                            <b-list-group>
                                                <b-list-group-item
                                                    v-for="template in templateResponses"
                                                    :key="template._id"
                                                    :to="'/templates/' + template._id"
                                                >
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

            <b-col sm="4"> </b-col>
        </b-row>
    </b-container>
</template>

<script>
import { API } from "aws-amplify";

export default {
    name: "Search",
    data() {
        return {
            isLoading: true,
            searchText: "",
            hasResults: true,

            userResponses: [],
            exerciseResponses: [],
            templateResponses: [],

            tabIndex: 0,
        };
    },

    created: function() {
        this.search();
    },

    beforeRouteUpdate: function(to, from, next) {
        next();
        this.search();
    },

    methods: {
        search: async function() {
            this.isLoading = true;
            this.searchText = this.$route.query.q;

            this.userResponses = [];
            this.exerciseResponses = [];
            this.templateResponses = [];

            if (this.searchText) {
                const path = "/search"
                const myInit = {
                    headers: {
                        Authorization: await this.$store.dispatch("fetchJwtToken")
                    },
                    queryStringParameters: {
                        q: this.searchText,
                        collections: "exercise,template,user"
                    }
                }

                const response = await API.get(this.$store.state.apiName, path, myInit);

                const keys = Object.keys(response.data);
                const values = Object.values(response.data);

                values.forEach((responses, index) => {
                    if (keys[index] === "user") {
                        responses.forEach(userResponse => {
                            this.userResponses.push(userResponse);
                        })
                    }
                    else if (keys[index] === "exercise") {
                        responses.forEach(exerciseResponse => {
                            this.exerciseResponses.push(exerciseResponse);
                        })
                    }
                    else if (keys[index] === "template") {
                        responses.forEach(templateResponse => {
                            this.templateResponses.push(templateResponse);
                        })
                    }
                })

                if (!this.userResponses.length && !this.exerciseResponses.length && !this.templateResponses.length) {
                    this.hasResults = false;
                }

                this.isLoading = false;

                this.isLoading = false;
                
            } else {
                this.isLoading = false;
            }
        }
    }
};
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
