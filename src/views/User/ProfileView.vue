<template>
    <b-container class="profileCont">
        <b-row>
            <b-col cols="3">
                <div v-if="!isLoggedInUser">
                    <div v-for="(chart, index) in profile.charts.leftRail" :key="index">
                        <Chart
                            :username="profile.username"
                            :options="chart"
                            :index="index"
                            position="profileLeftRail"
                            :editable="false"
                            :saveable="false"
                            :persistent="false"
                        />
                    </div>
                </div>
                <div v-else>
                    <div
                        v-for="(chart, index) in $store.state.userProfile.docData.options.charts
                            .profile.leftRail"
                        :key="index"
                    >
                        <Chart
                            :username="$store.state.userProfile.docData.username"
                            :options="chart"
                            :index="index"
                            position="profileLeftRail"
                            :editable="true"
                            :saveable="true"
                            :persistent="true"
                        />
                    </div>
                </div>
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

                        <div class="text-center" v-if="moreToLoad">
                            <b-button
                                @click="loadMorePosts"
                                variant="outline-dark"
                                size="sm"
                                v-b-visible.200="loadMorePosts"
                            >
                                <span v-if="!isLoadingMore">More</span>
                                <span v-else><b-spinner small/></span>
                            </b-button>
                        </div>
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

import Chart from "@/components/Charts/Chart.vue";

export default {
    name: "ProfileView",
    components: { PostFeed, PostNew, Chart },
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
            isLoggedInUser: false,

            // Lazy loading:
            isLoadingMore: true,
            moreToLoad: true
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
            this.moreToLoad = true;
            this.isLoadingMore = true;
            this.posts = [];
            this.isFollowing = false;
            console.log(this.$props.profile, "FOLLOWEd");
            this.isFollowed = this.$props.profile.isFollowed;
            this.isLoggedInUser = this.$props.profile.isLoggedInUser;

            try {
                const path = "/post";
                const myInit = {
                    headers: {
                        Authorization: await this.$store.dispatch("fetchJwtToken")
                    },
                    queryStringParameters: {
                        userId: this.$props.profile._id,
                        loadAmount: 5
                    }
                };

                this.posts = (await API.get(this.$store.state.apiName, path, myInit)).data;

                if (this.posts.length < 5) {
                    this.moreToLoad = false;
                }
            } catch (err) {
                console.error(err);
                this.moreToLoad = false;
            } finally {
                this.isLoading = false;
                this.isLoadingMore = false;
            }
        },

        handleFollow: async function() {
            if (!this.isFollowing) {
                this.isFollowing = true;
                const path = "/follow";
                const myInit = {
                    headers: {
                        Authorization: await this.$store.dispatch("fetchJwtToken")
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
        },

        loadMorePosts: async function() {
            if (!this.isLoadingMore) {
                console.log("LOADING MORE!");
                this.isLoadingMore = true;

                const path = "/post";
                const myInit = {
                    headers: {
                        Authorization: await this.$store.dispatch("fetchJwtToken")
                    },
                    queryStringParameters: {
                        loadAmount: 5,
                        startAt: this.posts[this.posts.length - 1]._id,
                        userId: this.$props.profile._id
                    }
                };

                const postResult = (await API.get(this.$store.state.apiName, path, myInit)).data;

                postResult.forEach(post => {
                    this.posts.push(post);
                });

                if (postResult.length < 5) {
                    this.moreToLoad = false;
                }

                this.isLoadingMore = false;

                console.log("POST RESULT:", postResult);
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
