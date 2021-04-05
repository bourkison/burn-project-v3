<template>
    <b-container class="profileCont">
        <b-row>
            <b-col cols="3">

            </b-col>

            <b-col cols="6">
                <b-container>
                    <b-card class="headerCard" no-body>
                        <b-card-body>
                            <b-card-title class="d-flex center-aligned w-100">
                                <b-avatar size="4rem" :src="profile.profilePhoto" />
                                <div class="ml-4 text-center w-100">
                                    <div class="pb-1 border-bottom border-light">{{ profile.username }}</div>
                                    <div class="d-flex followCount">
                                        <div class="w-50 m0 border-right border-light pt-1">{{ profile.followingCount }} following</div>
                                        <div class="w-50 m0 pt-1">{{ profile.followerCount }} followers</div>
                                    </div>
                                </div>
                            </b-card-title>

                            <b-card-text class="mt-4">
                                <PostNew />
                            </b-card-text>
                        </b-card-body>
                    </b-card>

                    <div v-if="!isLoading">
                        <PostFeed :posts="posts" :newPost="false" />
                    </div>

                    <div v-else>

                    </div>
                </b-container>
            </b-col>

            <b-col cols="6">

            </b-col>
        </b-row>
    </b-container>
</template>

<script>
import { db } from '@/firebase'

import PostNew from '@/components/Post/PostNew.vue'
import PostFeed from '@/components/Post/PostFeed.vue'

export default {
    name: 'ProfileView',
    components: { PostFeed, PostNew },
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

<style scoped>
    .profileCont {
        margin-top: 40px;
    }

    .center-aligned {
        align-items: center !important;
    }

    .followCount {
        font-size: 16px;
        font-weight: normal;
    }

    .headerCard {
        margin-bottom: 25px;
    }
</style>