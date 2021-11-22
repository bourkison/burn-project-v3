<template>
    <b-nav-form @submit.prevent="searchPage">
        <b-form-input
            v-model="searchText"
            @focus="showPopover"
            @change="showPopover"
            @blur="hidePopover"
            id="testInput"
            placeholder="Search exercises, templates, users..."
            size="sm"
            debounce="250"
        />

        <b-popover
            id="mainSearchPopover"
            target="testInput"
            :show.sync="displayPopover"
            placement="bottomright"
            triggers="manual"
            custom-class="searchPopover"
        >
            <div v-if="!isLoading && searchText && hasResults">
                <div
                    v-if="userResponses.length > 0"
                    :class="
                        templateResponses.length > 0 || exerciseResponses.length > 0 ? 'mb-2' : ''
                    "
                >
                    <h6>Users</h6>
                    <b-list-group>
                        <b-list-group-item
                            v-for="user in userResponses"
                            :key="user._id"
                            :to="'/' + user.username"
                            class="p-2"
                        >
                            <b-avatar class="mr-2" :src="user.profilePhoto" />
                            {{ user.username }}
                        </b-list-group-item>
                    </b-list-group>
                </div>

                <div
                    v-if="exerciseResponses.length > 0"
                    :class="templateResponses.length > 0 ? 'mb-2' : ''"
                >
                    <h6>Exercises</h6>
                    <b-list-group>
                        <b-list-group-item
                            v-for="exercise in exerciseResponses"
                            :key="exercise._id"
                            :to="'/exercises/' + exercise._id"
                        >
                            {{ exercise.name }}
                        </b-list-group-item>
                    </b-list-group>
                </div>

                <div v-if="templateResponses.length > 0">
                    <h6>Templates</h6>
                    <b-list-group>
                        <b-list-group-item
                            v-for="template in templateResponses"
                            :key="template._id"
                            :to="'/templates/' + template._id"
                        >
                            {{ template.name }}
                        </b-list-group-item>
                    </b-list-group>
                </div>
            </div>
            <div v-else-if="!isLoading && !searchText.trim()">
                <span><em>Search for users, exercises or templates!</em></span>
            </div>
            <div v-else-if="!isLoading && searchText && !hasResults">
                <span><em>No results!</em></span>
            </div>
            <div v-else>
                <div class="text-center">
                    <b-spinner small />
                </div>
            </div>
        </b-popover>
    </b-nav-form>
</template>

<script>
import { API } from "aws-amplify"

export default {
    name: "MainSearch",
    data() {
        return {
            isLoading: false,
            searchText: "",
            hasResults: true,

            userResponses: [],
            exerciseResponses: [],
            templateResponses: [],

            // Bootstrap:
            displayPopover: false,
        };
    },

    methods: {
        showPopover: function() {
            this.displayPopover = true;
        },

        hidePopover: function() {
            this.$nextTick(() => {
                this.displayPopover = false;
            });
        },

        searchPage: function() {
            const encodedSearch = encodeURIComponent(this.searchText.trim());
            this.displayPopover = false;
            document.activeElement.blur();

            this.$router.push("/search?q=" + encodedSearch);
        }
    },

    watch: {
        searchText: async function() {
            this.isLoading = true;
            this.hasResults = true;

            this.userResponses = [];
            this.exerciseResponses = [];
            this.templateResponses = [];

            if (this.searchText.trim()) {
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
            } else {
                this.isLoading = false;
            }
        }
    }
};
</script>

<style scoped></style>

<style>
.searchPopover {
    left: -100px !important;
    width: 350px !important;
    max-width: 350px !important;
}
</style>
