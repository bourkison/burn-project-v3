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
import { db } from '@/firebase'

import ProfileView from '@/views/User/ProfileView.vue'

export default {
    name: 'Profile',
    components: { ProfileView },
    data() {
        return {
            isLoading: true,
            profileExists: false,
            profile: {},
        }
    },

    created: function() {
        this.downloadUser();
    },

    beforeRouteUpdate: function(to, from, next) {
        next();
        this.downloadUser();
        console.log("PROFILE ROUTE UPDATE");
    },

    methods: {
        downloadUser: function() {
            this.isLoading = true;
            this.profileExists = false;
            this.profile = {};

            if (!this.$store.state.userProfile.loggedIn) {
                console.log("Not logged in");
            } else if (this.$route.params.profileid !== this.$store.state.userProfile.docData.username) {
                db.collection("users").where("username", "==", this.$route.params.profileid).get()
                .then(userSnapshot => {
                    if (userSnapshot.size > 0) {
                        userSnapshot.forEach(user => {
                            this.profile = user.data();
                            this.profile.id = user.id;
                            this.profileExists = true;
                            this.isLoading = false;
                        })
                    } else {
                        this.profileExists = false;
                        this.isLoading = false;
                    }
                })
            } else {
                this.profile = this.$store.state.userProfile.docData;
                this.profile.id = this.$store.state.userProfile.data.uid;
                this.profileExists = true;
                this.isLoading = false;
            }
        }
    }
}
</script>