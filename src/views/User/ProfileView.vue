<template>
    <div>
        {{ profile.username }}
    </div>
</template>

<script>
import { db } from '@/firebase'

export default {
    name: 'ProfileView',
    props: {
        profile: {
            type: Object,
            required: true
        }
    },
    data() {
        return {
            isLoading: true,
            posts: [],
            isFollowing: false,
            isLoggedInUser: false,
        }
    },

    created: function() {
        if (this.$props.profile.id === this.$store.state.userProfile.data.uid) {
            this.isLoggedInUser = true;
        }

        // Check if followed.
        if (!this.isLoggedInUser) {
            db.collection("users").doc(this.$store.state.userProfile.data.uid).collection("following").doc(this.profile.id).get()
            .then(followingDoc => {
                if (followingDoc.exists) {
                    this.isFollowing = true;
                }
            })
        }

        // Download posts.
        db.collection("users").doc(this.profile.id).collection("posts").orderBy("createdAt", "desc").get()
        .then(postSnapshot => {
            postSnapshot.forEach(post => {
                this.posts.push(post.id);
            })

            this.isLoading = false;
        })
    }
}
</script>