<template>
    <b-nav-form @submit.prevent="searchPage">
        <b-form-input v-model="searchText" @focus="showPopover" @change="showPopover" @blur="hidePopover" id="testInput" placeholder="Search exercises, workouts, users..." size="sm" debounce="250" />

        <b-popover id="mainSearchPopover" target="testInput" :show.sync="displayPopover" placement="bottomright" triggers="manual" custom-class="searchPopover">
            <div v-if="!isLoading && searchText">
                <div v-if="userResponses.length > 0" :class="(workoutResponses.length > 0 || exerciseResponses.length > 0) ? 'mb-2' : ''">
                    <h6>Users</h6>
                    <b-list-group>
                        <b-list-group-item v-for="user in userResponses" :key="user.id" :to="'/' + user.username" class="p-2">
                            <b-avatar class="mr-2" :src="user.profilePhoto" />
                            {{ user.username }}
                        </b-list-group-item>
                    </b-list-group>
                </div>

                <div v-if="exerciseResponses.length > 0" :class="workoutResponses.length > 0 ? 'mb-2' : ''">
                    <h6>Exercises</h6>
                    <b-list-group>
                        <b-list-group-item v-for="exercise in exerciseResponses" :key="exercise.objectID" :to="'/exercises/' + exercise.objectID">
                            {{ exercise.name }}
                        </b-list-group-item>
                    </b-list-group>
                </div>

                <div v-if="workoutResponses.length > 0">
                    <h6>Workouts</h6>
                    <b-list-group>
                        <b-list-group-item v-for="workout in workoutResponses" :key="workout.objectID" :to="'/workouts/' + workout.objectID">
                            {{ workout.name }}
                        </b-list-group-item>
                    </b-list-group>
                </div>
            </div>
            <div v-else-if="!isLoading && !searchText">
                <span><em>Search for users, exercises or workouts!</em></span>
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
import algoliasearch from 'algoliasearch'

export default {
    name: 'MainSearch',
    data() {
        return {
            isLoading: false,
            searchText: '',

            userResponses: [],
            exerciseResponses: [],
            workoutResponses: [],

            // Bootstrap:
            displayPopover: false,

            // Algolia:
            searchClient: algoliasearch(
                "O9KO1L25CJ",
                "e6492bc28cfda8670d4981bb26e4bbbd"
            ),
            userIndex: null,
            exerciseIndex: null,
            workoutIndex: null,
        }
    },

    created: function() {
        this.userIndex = this.searchClient.initIndex("users");
        this.exerciseIndex = this.searchClient.initIndex("exercises");
        this.workoutIndex = this.searchClient.initIndex("workouts");
    },

    methods: {
        showPopover: function() {
            this.displayPopover = true;
        },

        hidePopover: function() {
            this.$nextTick(() => { this.displayPopover = false });
        },

        searchPage: function() {
            const encodedSearch = encodeURIComponent(this.searchText.trim());
            this.displayPopover = false;
            document.activeElement.blur();
            
            this.$router.push("/search?q=" + encodedSearch);
        }
    },

    watch: {
        searchText: function() {
            this.isLoading = true;

            let searchPromises = [];

            this.userResponses = [];
            this.exerciseResponses = [];
            this.workoutResponses = [];

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

                searchPromises.push(this.workoutIndex.search(this.searchText).then(responses => {
                    responses.hits.forEach(hit => {
                        this.workoutResponses.push(hit);
                    })
                }))

                Promise.all(searchPromises)
                .then(() => {
                    console.log("USER RESPONSES:", this.userResponses, "EXERCISE RESPONSES:", this.exerciseResponses, "WORKOUT RESPONSES:", this.workoutResponses);
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
</style>

<style>
    .searchPopover {
        left: -100px !important;
        width: 350px !important;
        max-width: 350px !important;
    }
</style>