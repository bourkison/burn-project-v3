<template>
    <b-container class="profileCont">
        <b-row>
            <b-col cols="3">
                <RecentWorkoutsChart :username="profile.username" />
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
                        <PostFeed :posts="posts" :newPost="false" :isLoading="isLoading" />
                    </div>

                    <div v-else></div>
                </b-container>
            </b-col>

            <b-col cols="6"> </b-col>
        </b-row>
    </b-container>
</template>

<script>
import { API } from "aws-amplify";

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
                        Authorization: this.$store.state.userProfile.data.idToken.jwtToken
                    },
                    queryStringParameters: {
                        userId: this.$props.profile._id,
                        loadAmount: 5
                    }
                };

                this.posts = (await API.get(this.$store.state.apiName, path, myInit)).data;

                console.log("POSTS:", this.posts);
            } catch (err) {
                console.error(err);
            } finally {
                this.isLoading = false;
            }
        },

        handleFollow: async function() {
            if (!this.isFollowing) {
                this.isFollowing = true;
                const path = "/follow";
                const myInit = {
                    headers: {
                        Authorization: this.$store.state.userProfile.data.idToken.jwtToken
                    },
                    queryStringParameters: {
                        docId: this.profile._id,
                        coll: "user"
                    }
                };

                if (!this.isFollowed) {
                    try {
                        console.log("FOLLOWING");
                        const followResponse = await API.post(
                            this.$store.state.apiName,
                            path,
                            myInit
                        );
                        this.isFollowed = true;
                        this.$emit("follow");
                        console.log("FOLLOWED:", followResponse);
                    } catch (err) {
                        this.isFollowed = false;
                        console.error(err);
                    } finally {
                        this.isFollowing = false;
                    }
                } else {
                    try {
                        console.log("UNFOLLOWING");
                        const unfollowResponse = await API.del(
                            this.$store.state.apiName,
                            path,
                            myInit
                        );
                        this.isFollowed = false;
                        this.$emit("unfollow");
                        console.log("UNFOLLOWED:", unfollowResponse);
                    } catch (err) {
                        this.isFollowed = true;
                        console.error(err);
                    } finally {
                        this.isFollowing = false;
                    }
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
