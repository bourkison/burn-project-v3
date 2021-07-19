<template>
    <b-container>
        <b-card no-body>
            <b-card-body v-if="!isLoading">
                <b-card-title>Burns</b-card-title>
                <b-form-input placeholder="Search for a burn or template..." v-model="searchText"></b-form-input>
                <b-card-text>
                    <b-container class="mt-3">
                        <div v-if="filteredBurns.length > 0">
                            <h5>Recent Burns</h5>
                            <b-list-group class="mt-2 mb-2">
                                <b-list-group-item class="d-flex" align-v="center" :to="'/burn/new?b=' + burn.id" v-for="burn in filteredBurns" :key="burn.id">
                                    <div>{{ burn.name }}</div>
                                    <div class="ml-auto text-muted" style="font-size:12px;line-height:2;">{{ burn.createdAtText }}</div>
                                </b-list-group-item>
                            </b-list-group>
                        </div>

                        <div v-if="filteredTemplates.length > 0" class="mt-3">
                            <h5>Followed Templates</h5>
                            <b-list-group class="mt-2 mb-2">
                                <b-list-group-item class="d-flex" align-v="center" :to="'/burn/new?w=' + template.id" v-for="template in filteredTemplates" :key="template.id">
                                    <div>{{ template.name }}</div>
                                    <div class="ml-auto text-muted" style="font-size:12px;line-height:2;">{{ template.createdBy.username }}</div>
                                </b-list-group-item>
                            </b-list-group>
                        </div>
                    </b-container>
                </b-card-text>
            </b-card-body>

            <b-card-body v-else class="text-center">
                <b-spinner small />
            </b-card-body>
        </b-card>
    </b-container>
</template>

<script>
import { templatesCollection, userTemplatesCollection } from '@/firebase'

import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'

export default {
    name: 'BurnView',
    data() {
        return {
            isLoading: true,

            userTemplates: [],
            userBurns: [],

            searchText: ''
        }
    },

    created: async function() {
        dayjs.extend(relativeTime);
        let promises = [];

        // First download user templates.
        promises.push(userTemplatesCollection(this.$store.state.userProfile.data.uid).orderBy("createdAt", "desc").get()
        .then(templateSnapshot => {
            let templatePromises = [];

            templateSnapshot.forEach(template => {
                templatePromises.push(templatesCollection().doc(template.id).get())
            })

            return Promise.all(templatePromises)
            .then(templateDocs => {
                templateDocs.forEach(templateDoc => {
                    let data = templateDoc.data();
                    data.id = templateDoc.id;

                    this.userTemplates.push(data);
                })
            })
        }))

        // Then get user burns from store.
        if (this.$store.state.userBurns === null) {
            await this.$store.dispatch('fetchBurns', this.$store.state.userProfile.data).catch(e => { console.error(e) });
        }

        let uniqueNames = [];
        this.$store.state.userBurns.forEach(burn => {
            let b = burn;

            if (!uniqueNames.includes(b.name)) {
                b.createdAtText = dayjs(dayjs.unix(b.createdAt.seconds)).fromNow();
                this.userBurns.push(b);
                uniqueNames.push(b.name);
            }
        })

        Promise.all(promises)
        .then(() => {
            this.isLoading = false;
            console.log("Burns:", this.userBurns);
            console.log("Templates:", this.userTemplates);
        })
    },

    computed: {
        filteredBurns: function() {
            if (this.searchText) {
                return this.userBurns.filter(recentBurn => {
                    return recentBurn.name.toLowerCase().includes(this.searchText.toLowerCase());
                })
            } else {
                return this.userBurns
            }
        },

        filteredTemplates: function() {
            if (this.searchText) {
                return this.userTemplates.filter(template => {
                    return template.name.toLowerCase().includes(this.searchText.toLowerCase());
                })
            } else {
                return this.userTemplates;
            }
        }
    }
}
</script>