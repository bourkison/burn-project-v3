<template>
    <b-container class="profileCont">
        <b-row>
            <b-col cols="3">
                <RecentWorkoutsChart :userId="profile.id" />
            </b-col>

            <b-col cols="6">
                <b-container>
                    <b-card class="headerCard" no-body>
                        <b-card-body>
                            <b-card-title class="d-flex center-aligned w-100">
                                <b-avatar size="4rem" :src="profile.profilePhoto" />
                                <div class="ml-3 text-center w-100">
                                    <div class="pb-1 border-bottom border-light">
                                        {{ profile.username }}
                                    </div>
                                    <div class="d-flex followCount border-bottom border-light">
                                        <div class="w-50 m0 border-right border-light pt-1 pb-1">
                                            {{ profile.followerCount }}
                                            followers
                                        </div>
                                        <div class="w-50 m0 pt-1 pb-1">
                                            {{ profile.followingCount }}
                                            following
                                        </div>
                                    </div>
                                    <div>
                                        <div v-if="isLoggedInUser" class="ml-5 mr-5 pt-1">
                                            <b-button block variant="outline-dark" size="sm"
                                                >Edit Profile</b-button
                                            >
                                        </div>
                                        <div v-else class="d-flex">
                                            <div
                                                class="w-50 ml-2 pr-1 pt-1 border-right border-light"
                                            >
                                                <b-button block variant="outline-dark" size="sm"
                                                    >Message</b-button
                                                >
                                            </div>
                                            <div class="w-50 mr-2 pl-1 pt-1">
                                                <b-button
                                                    v-if="!isFollowed"
                                                    @click="handleFollow"
                                                    variant="primary"
                                                    block
                                                    size="sm"
                                                    :disabled="isFollowing"
                                                >
                                                    <span v-if="!isFollowing">Follow</span>
                                                    <span v-else><b-spinner small/></span>
                                                </b-button>

                                                <b-button
                                                    v-else
                                                    @click="handleFollow"
                                                    variant="outline-danger"
                                                    block
                                                    size="sm"
                                                    :disabled="isFollowing"
                                                >
                                                    <span v-if="!isFollowing">Unfollow</span>
                                                    <span v-else><b-spinner small/></span>
                                                </b-button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </b-card-title>

                            <b-card-text class="mt-4" v-if="isLoggedInUser">
                                <PostNew />
                            </b-card-text>
                        </b-card-body>
                    </b-card>

                    <div v-if="!isLoading">
                        <PostFeed :posts="posts" :newPost="false" />
                    </div>

                    <div v-else></div>
                </b-container>
            </b-col>

            <b-col cols="6"> </b-col>
        </b-row>
    </b-container>
</template>

<script>
import { db, fv } from "@/firebase";
import { API } from 'aws-amplify';

import PostNew from "@/components/Post/PostNew.vue";
import PostFeed from "@/components/Post/PostFeed.vue";

import RecentWorkoutsChart from "@/components/Charts/RecentWorkoutsChart.vue";

export default {
    name: "ProfileView",
    components: { PostFeed, PostNew, RecentWorkoutsChart },
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
            isFollowed: false,
            isLoggedInUser: false
        };
    },

    created: function() {
        this.downloadPosts();
    },

    beforeRouteUpdate: function(to, from, next) {
        this.downloadPosts();
        next();
    },

    methods: {
        downloadPosts: async function() {
            this.isLoading = true;
            this.posts = [];
            this.isFollowing = false;
            this.isFollowed = JSON.parse(JSON.stringify(this.$props.profile.isFollowed));
            this.isLoggedInUser = JSON.parse(JSON.stringify(this.$props.profile.isLoggedInUser));

            try {
                const path = "/post";
                const myInit = {
                    headers: {
                        Authorization: this.$store.state.userProfile.data.idToken.jwtToken,
                    },
                    queryStringParameters: {
                        userId: this.$props.profile._id,
                        loadAmount: 5
                    }
                };
    
                this.posts = (await API.get(this.$store.state.apiName, path, myInit)).data;

                console.log("POSTS:", this.posts);
            }
            catch (err) {
                console.error(err);
            }
            finally {
                this.isLoading = false;
            }

        },

        handleFollow: function() {
            if (!this.isFollowing) {
                const batch = db.batch();
                this.isFollowing = true;

                if (!this.isFollowed) {
                    // First add to this users followers.
                    let payload = {
                        createdBy: {
                            username: this.$store.state.userProfile.docData.username,
                            id: this.$store.state.userProfile.data.uid,
                            profilePhoto: this.$store.state.userProfile.docData.profilePhoto
                        },
                        createdAt: new Date()
                    };
                    batch.set(
                        db
                            .collection("users")
                            .doc(this.profile.id)
                            .collection("followers")
                            .doc(this.$store.state.userProfile.data.uid),
                        payload
                    );

                    // Then add to logged in users following.
                    payload = {
                        followedUser: {
                            username: this.profile.username,
                            id: this.profile.id,
                            profilePhoto: this.profile.profilePhoto
                        },
                        createdAt: payload.createdAt
                    };
                    batch.set(
                        db
                            .collection("users")
                            .doc(this.$store.state.userProfile.data.uid)
                            .collection("following")
                            .doc(this.profile.id),
                        payload
                    );

                    // Increment follower count.
                    batch.update(db.collection("users").doc(this.profile.id), {
                        followerCount: fv.increment(1)
                    });

                    // Increment following count.
                    batch.update(
                        db.collection("users").doc(this.$store.state.userProfile.data.uid),
                        {
                            followingCount: fv.increment(1)
                        }
                    );

                    // Commit the batch.
                    batch
                        .commit()
                        .then(() => {
                            this.isFollowing = false;
                            this.isFollowed = true;
                            this.profile.followerCount++;
                            this.$store.state.userProfile.docData.followingCount++;
                        })
                        .catch(e => {
                            console.error("Error following this user.", e);
                        });
                } else {
                    // First delete from this users followers.
                    batch.delete(
                        db
                            .collection("users")
                            .doc(this.profile.id)
                            .collection("followers")
                            .doc(this.$store.state.userProfile.data.uid)
                    );

                    // Then delete this user from loggedin users following.
                    batch.delete(
                        db
                            .collection("users")
                            .doc(this.$store.state.userProfile.data.uid)
                            .collection("following")
                            .doc(this.profile.id)
                    );

                    // Decrement follower count.
                    batch.update(db.collection("users").doc(this.profile.id), {
                        followerCount: fv.increment(-1)
                    });

                    // Decrement following count.
                    batch.update(
                        db.collection("users").doc(this.$store.state.userProfile.data.uid),
                        {
                            followingCount: fv.increment(-1)
                        }
                    );

                    // Commit the batch.
                    batch
                        .commit()
                        .then(() => {
                            this.isFollowing = false;
                            this.isFollowed = false;
                            this.profile.followerCount--;
                            this.$store.state.userProfile.docData.followingCount--;
                        })
                        .catch(e => {
                            console.error("Error unfollowing the user.", e);
                        });
                }
            }
        }
    }
};
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
