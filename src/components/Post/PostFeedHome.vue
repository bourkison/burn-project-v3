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
                variant="outline"
                size="sm"
                v-b-visible.200="loadMorePosts"
                :disabled="isLoadingMore"
            >
                <span v-if="!isLoadingMore">More</span>
                <span v-else><b-spinner small/></span>
            </b-button>
        </div>
    </div>
</template>

<script lang="ts">
import Vue from "vue";
import { PostReference } from "@/types/post";

import PostNew from "@/components/Post/PostNew.vue";
import PostFeed from "@/components/Post/PostFeed.vue";

export default Vue.extend({
    name: "PostFeedHome",
    components: { PostFeed, PostNew },
    data() {
        return {
            isLoading: true,
            posts: [] as PostReference[],

            // Lazy loading:
            isLoadingMore: true,
            moreToLoad: true,

            // Post upload
            amountToUpload: 0,
            amountUploaded: 0,
        };
    },

    async mounted() {
        try {
            this.isLoading = true;
            this.isLoadingMore = true;
    
            const init = {
                queryStringParameters: {
                    loadAmount: 5
                }
            };

            const postResult = await this.$accessor.api.queryPost({ init });
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
        catch (err: any) {
            console.error(err.message || JSON.stringify(err));
            this.moreToLoad = false;
        }
        finally {
            this.isLoading = false;
        }
    },

    methods: {
        addPost(post: PostReference): void {
            this.posts.unshift(post);
            this.amountToUpload = 0;
            this.amountUploaded = 0;
        },

        postLoaded(index: number): void {
            this.posts[index].loaded = true;
        },

        async loadMorePosts(): Promise<void> {
            if (!this.isLoadingMore && this.moreToLoad) {
                console.log("LOADING MORE!");
                this.isLoadingMore = true;

                const init = {
                    queryStringParameters: {
                        loadAmount: 5,
                        startAt: this.posts[this.posts.length - 1]._id
                    }
                }

                const postResult = await this.$accessor.api.queryPost({ init })

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

        uploadProgression(uploaded: number, total: number): void {
            this.amountUploaded = uploaded;
            this.amountToUpload = total;
        }
    }
});
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
