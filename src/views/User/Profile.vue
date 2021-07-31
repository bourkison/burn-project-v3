<template>
    <div v-if="!isLoading && profileExists">
        <ProfileView :profile="profile" />
    </div>
    <div v-else-if="!isLoading && !profileExists">
        404
    </div>
    <div v-else>
        <b-spinner />
    </div>
</template>

<script>
import { API } from "aws-amplify";

import ProfileView from "@/views/User/ProfileView.vue";

export default {
    name: "Profile",
    components: { ProfileView },
    data() {
        return {
            isLoading: true,
            profileExists: false,
            profile: {}
        };
    },

    created: function() {
        this.downloadUser();
    },

    beforeRouteUpdate: function(to, from, next) {
        next();
        this.downloadUser();
    },

    methods: {
        downloadUser: async function() {
            this.isLoading = true;
            this.profileExists = false;
            this.profile = {};

            const path = "/user/" + this.$route.params.profileid;
            const myInit = {
                headers: {
                    Authorization: this.$store.state.userProfile.data.idToken.jwtToken
                },
                queryStringParameters: {
                    view: "profile"
                }
            };

            this.profile = (await API.get(this.$store.state.apiName, path, myInit)).data;
            this.profileExists = true;
            this.isLoading = false;
        }
    }
};
</script>
