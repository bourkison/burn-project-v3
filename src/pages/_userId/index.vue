<template>
    <b-container class="profileCont">
        <b-row>
            <b-col cols="3">
                <div v-if="!profile.isLoggedInUser">
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
                                        <div v-if="profile.isLoggedInUser" class="ml-5 mr-5 pt-1">
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
                                                    <span v-else><b-spinner small /></span>
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
                                                    <span v-else><b-spinner small /></span>
                                                </b-button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </b-card-title>

                            <div class="mt-4" v-if="profile.isLoggedInUser">
                                <PostNew />
                            </div>
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
                                <span v-else><b-spinner small /></span>
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

<script lang="ts">
import Vue from "vue";
import { UserProfile } from "@/types/user";
import { PostReference } from "@/types/post";

import PostNew from "@/components/Post/PostNew.vue";
import PostFeed from "@/components/Post/PostFeed.vue";

import Chart from "@/components/Charts/Chart.vue";

interface ProfileViewData {
    isLoading: boolean;
    posts: PostReference[];
    profile: UserProfile | null;
    isFollowing: boolean;
    isLoadingMore: boolean;
    moreToLoad: boolean;
}

export default Vue.extend({
    components: { PostFeed, PostNew, Chart },
    data(): ProfileViewData {
        return {
            isLoading: true,
            posts: [],
            profile: null,
            isFollowing: false,

            // Lazy loading:
            isLoadingMore: true,
            moreToLoad: true,
        };
    },

    async asyncData({ app: { $accessor }, req, params, error }) {
        let profile: UserProfile;

        try {
            profile = await $accessor.api.getUserProfile({ req, userId: params.userId, init: { queryStringParameters: { view: "profile" }}});
            return { profile };
        } catch (err: any) {
            console.log("ERROR:", err);
            error({ message: err.message, statusCode: err.response && err.response.status });
        }
    },

    mounted() {
        this.downloadPosts();
    },

    methods: {
        async downloadPosts() {
            this.isLoading = true;
            this.moreToLoad = true;
            this.isLoadingMore = true;
            this.posts = [];
            this.isFollowing = false;

            try {
                const init = {
                    queryStringParameters: {
                        userId: this.profile?._id,
                        loadAmount: 5,
                    }
                };

                this.posts = await this.$accessor.api.queryPost({ init });

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

        async handleFollow() {
            if (this.profile && !this.isFollowing) {
                this.isFollowing = true;
                const init = {
                    queryStringParameters: {
                        docId: this.profile._id,
                        coll: "user",
                    }
                };

                if (!this.profile.isFollowed) {
                    try {
                        console.log("FOLLOWING...");
                        await this.$accessor.api.createFollow({ init });
                        this.profile.isFollowed = true;
                        this.profile.followerCount++;
                        console.log("FOLLOWED");
                    }
                    catch (err) {
                        this.profile.isFollowed = false;
                        console.error(err);
                    }
                    finally {
                        this.isFollowing = false;
                    }
                } else if (this.profile) {
                    try {
                        console.log("UNFOLLOWING...");
                        await this.$accessor.api.deleteFollow({ init });
                        this.profile.isFollowed = false;
                        this.profile.followerCount--;
                        console.log("UNFOLLOWED");
                    }
                    catch (err) {
                        this.profile.isFollowed = true;
                        console.error(err);
                    }
                    finally {
                        this.isFollowing = false;
                    }
                }
            }
        },

        async loadMorePosts() {
            if (!this.isLoadingMore && this.profile) {
                console.log("LOADING MORE!");
                this.isLoadingMore = true;

                const init = {
                    queryStringParameters: {
                        loadAmount: 5,
                        startAt: this.posts[this.posts.length - 1]._id,
                        userId: this.profile._id,
                    },
                };

                const postResult = await this.$accessor.api.queryPost({ init });

                postResult.forEach((post) => {
                    this.posts.push(post);
                });

                if (postResult.length < 5) {
                    this.moreToLoad = false;
                }

                this.isLoadingMore = false;
            }
        },
    },
});
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
