<template>
    <b-container>
        <b-row align-v="center">
            <b-col sm="8">
                <b-container>
                    <b-card no-body class="searchHeader">
                        <b-card-body>
                            <b-card-title>"{{ searchText }}" Results</b-card-title>

                            <div>
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

                                <div class="mt-3">
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
                            </div>
                        </b-card-body>
                    </b-card>
                </b-container>
            </b-col>

            <b-col sm="4">
                <div class="adTest bg-warning text-center">
                    Search Ad Here.
                </div>
            </b-col>
        </b-row>
    </b-container>
</template>

<script>
import { API } from "aws-amplify";

export default {
    middleware: ["requiresAuth"],
    data() {
        return {
            searchText: "",
            hasResults: true,

            userResponses: [],
            exerciseResponses: [],
            templateResponses: [],

            tabIndex: 0,
        };
    },

    async asyncData({ req, store, route, error }) {
        let searchText = route.query.q;
        let userResponses = [];
        let exerciseResponses = [];
        let templateResponses = [];
        let hasResults = true;

        try {
            if (searchText) {
                const path = "/search"
                const myInit = {
                    headers: {
                        Authorization: await store.dispatch("fetchJwtToken", { req })
                    },
                    queryStringParameters: {
                        q: searchText,
                        collections: "exercise,template,user"
                    }
                }
    
                const response = await API.get(store.state.apiName, path, myInit);
    
                const keys = Object.keys(response.data);
                const values = Object.values(response.data);
    
                values.forEach((responses, index) => {
                    if (keys[index] === "user") {
                        responses.forEach(userResponse => {
                            userResponses.push(userResponse);
                        })
                    }
                    else if (keys[index] === "exercise") {
                        responses.forEach(exerciseResponse => {
                            exerciseResponses.push(exerciseResponse);
                        })
                    }
                    else if (keys[index] === "template") {
                        responses.forEach(templateResponse => {
                            templateResponses.push(templateResponse);
                        })
                    }
                })
    
                if (!userResponses.length && !exerciseResponses.length && !templateResponses.length) {
                    hasResults = false;
                }
            }
        }
        catch (err) {
            console.error(err);
            error({ message: err.message, statusCode: (err.response && err.response.status) });
        }

        return {
            searchText,
            userResponses,
            exerciseResponses,
            templateResponses,
            hasResults
        }
    }
};
</script>

<style scoped>
.searchHeader,
.searchResults {
    margin-top: 40px;
}

.adTest {
    height: 250px;
    width: 300px;
    padding: 0;
    margin-top: 40px;
    line-height: 250px;
}
</style>

<style>
.tabNav {
    display: none !important;
}
</style>
