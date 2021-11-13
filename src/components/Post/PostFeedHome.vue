<template>
    <div class="mb-4">
        <b-card no-body class="newPost">
            <b-card-body>
                <b-card-title>
                    <div class="d-flex align-items">
                        <b-avatar :src="$store.state.userProfile.docData.profilePhoto" />
                        <div class="ml-2">
                            Welcome,
                            {{ $store.state.userProfile.docData.firstName }}
                        </div>
                    </div>
                </b-card-title>

                <div class="mt-4">
                    <PostNew />
                </div>
            </b-card-body>
        </b-card>
        <PostFeed @addPost="addPost" :posts="posts" :isLoading="isLoading" @postLoaded="postLoaded" />

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
</template>

<script>
import { API } from "aws-amplify";

import PostNew from "@/components/Post/PostNew.vue";
import PostFeed from "@/components/Post/PostFeed.vue";

export default {
    name: "PostFeedHome",
    components: { PostFeed, PostNew },
    data() {
        return {
            isLoading: true,
            posts: [],

            // Lazy loading:
            isLoadingMore: true,
            moreToLoad: true
        };
    },

    created: async function() {
        try {
            this.isLoading = true;
            this.isLoadingMore = true;
    
            const path = "/post";
            const myInit = {
                headers: {
                    Authorization: this.$store.state.userProfile.data.idToken.jwtToken
                },
                queryStringParameters: {
                    loadAmount: 5
                }
            };
    
            const postResult = (await API.get(this.$store.state.apiName, path, myInit)).data;
    
            postResult.forEach(post => {
                let temp = post;
                temp.loaded = false;
                this.posts.push(temp);
            });
    
            if (postResult.length < 5) {
                this.moreToLoad = false;
            }
    
            this.isLoading = false;
            this.isLoadingMore = false;
        }
        catch (err) {
            console.error(err)
            this.moreToLoad = false;
        }
        finally {
            this.isLoading = false;
        }
    },

    methods: {
        addPost: function(id) {
            this.posts.unshift({
                _id: id,
                createdAt: new Date(),
                updatedAt: new Date(),
                createdBy: {
                    userId: this.$store.state.userProfile.docData._id,
                    username: this.$store.state.userProfile.docData.username
                }
            });
        },

        postLoaded: function(index) {
            this.posts[index].loaded = true;
        },

        loadMorePosts: async function() {
            if (!this.isLoadingMore && this.moreToLoad) {
                console.log("LOADING MORE!");
                this.isLoadingMore = true;

                const path = "/post";
                const myInit = {
                    headers: {
                        Authorization: this.$store.state.userProfile.data.idToken.jwtToken
                    },
                    queryStringParameters: {
                        loadAmount: 5,
                        startAt: this.posts[this.posts.length - 1]._id
                    }
                }

                const postResult = (await API.get(this.$store.state.apiName, path, myInit)).data;

                postResult.forEach(post => {
                    let temp = post;
                    temp.loaded = false;
                    this.posts.push(temp);
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
.newPost {
    margin-top: 25px;
    margin-bottom: 25px;
}

.align-items {
    align-items: center !important;
}
</style>
