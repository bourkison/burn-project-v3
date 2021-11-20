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
                    <PostNew @uploadProgression="uploadProgression" @newPost="addPost" />
                </div>
            </b-card-body>
            <div v-if="amountUploaded">
                <b-progress :max="amountToUpload" height="0.5rem">
                    <b-progress-bar :value="amountUploaded" />
                </b-progress>
            </div>
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
            moreToLoad: true,

            // Post upload
            amountToUpload: 0,
            amountUploaded: 0,
        };
    },

    created: async function() {
        try {
            this.isLoading = true;
            this.isLoadingMore = true;
    
            const path = "/post";
            const myInit = {
                headers: {
                    Authorization: await this.$store.dispatch("fetchJwtToken")
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
        addPost: function(post) {
            this.posts.unshift(post);
            this.amountToUpload = 0;
            this.amountUploaded = 0;
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
                        Authorization: await this.$store.dispatch("fetchJwtToken")
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
            }
        },

        uploadProgression: function(uploaded, total) {
            this.amountUploaded = uploaded;
            this.amountToUpload = total;
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
