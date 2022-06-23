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
                    v-if="userResults.length > 0"
                    :class="
                        templateResults.length > 0 || exerciseResults.length > 0 ? 'mb-2' : ''
                    "
                >
                    <h6>Users</h6>
                    <b-list-group>
                        <b-list-group-item
                            v-for="user in userResults"
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
                    v-if="exerciseResults.length > 0"
                    :class="templateResults.length > 0 ? 'mb-2' : ''"
                >
                    <h6>Exercises</h6>
                    <b-list-group>
                        <b-list-group-item
                            v-for="exercise in exerciseResults"
                            :key="exercise._id"
                            :to="'/exercises/' + exercise._id"
                        >
                            {{ exercise.name }}
                        </b-list-group-item>
                    </b-list-group>
                </div>

                <div v-if="templateResults.length > 0">
                    <h6>Templates</h6>
                    <b-list-group>
                        <b-list-group-item
                            v-for="template in templateResults"
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

<script lang="ts">
import Vue from "vue";

type MainSearchData = {
    isLoading: boolean;
    searchText: string;
    hasResults: boolean;
    userResults: { _id: string, username: string }[];
    exerciseResults: { _id: string, name: string }[];
    templateResults: { _id: string, name: string }[];
    displayPopover: boolean;
}

export default Vue.extend({
    name: "MainSearch",
    data(): MainSearchData {
        return {
            isLoading: false,
            searchText: "",
            hasResults: true,

            userResults: [],
            exerciseResults: [],
            templateResults: [],

            // Bootstrap:
            displayPopover: false,
        };
    },

    methods: {
        showPopover(): void {
            this.displayPopover = true;
        },

        hidePopover(): void {
            this.$nextTick(() => {
                this.displayPopover = false;
            });
        },

        searchPage(): void {
            const encodedSearch = encodeURIComponent(this.searchText.trim());
            this.displayPopover = false;
            try {
                (document.activeElement as HTMLElement).blur();
            }
            catch {
                console.warn("Either no active element or active element is not HTMLElement");
            }

            this.$router.push("/search?q=" + encodedSearch);
        }
    },

    watch: {
        async searchText(): Promise<void> {
            this.isLoading = true;
            this.hasResults = true;

            if (this.searchText.trim()) {
                const init = {
                    queryStringParameters: {
                        q: this.searchText,
                        collections: "exercise,template,user"
                    }
                }

                const response = await this.$accessor.api.getSearch({ init });

                this.userResults = [];
                this.exerciseResults = [];
                this.templateResults = [];

                const keys = Object.keys(response);
                const values = Object.values(response);

                values.forEach((responses, index) => {
                    if (responses) {
                        if (keys[index] === "user") {
                            responses.forEach(userResponse => {
                                // @ts-ignore
                                this.userResults.push(userResponse);
                            })
                        }
                        else if (keys[index] === "exercise") {
                            responses.forEach(exerciseResponse => {
                                // @ts-ignore
                                this.exerciseResults.push(exerciseResponse);
                            })
                        }
                        else if (keys[index] === "template") {
                            responses.forEach(templateResponse => {
                                // @ts-ignore
                                this.templateResults.push(templateResponse);
                            })
                        }
                    }
                })

                if (!this.userResults.length && !this.exerciseResults.length && !this.templateResults.length) {
                    this.hasResults = false;
                }

                this.isLoading = false;
            } else {
                this.userResults = [];
                this.exerciseResults = [];
                this.templateResults = [];
                this.isLoading = false;
            }
        }
    }
});
</script>

<style scoped></style>

<style>
.searchPopover {
    left: -100px !important;
    width: 350px !important;
    max-width: 350px !important;
}
</style>
