<template>
    <div v-if="!isLoading" class="mb-4">
        <PostNew class="newPost" />
        <PostFeed @addPost="addPost" :posts="posts" />

        <div class="text-center" v-if="moreToLoad">
            <b-button @click="loadMorePosts" variant="outline-dark" size="sm" v-b-visible.200="loadMorePosts">
                <span v-if="!isLoadingMore">Load More</span>
                <span v-else><b-spinner small /></span>
            </b-button>
        </div>
    </div>
    <div v-else class="text-center"><b-spinner /></div>
</template>

<script>
import { db } from '@/firebase'

import PostNew from '@/components/Post/PostNew.vue'
import PostFeed from '@/components/Post/PostFeed.vue'

export default {
    name: 'PostFeedHome',
    components: { PostFeed, PostNew },
    data() {
        return {
            isLoading: true,
            posts: [],

            // Lazy loading:
            isLoadingMore: true,
            lastLoadedPost: null,
            moreToLoad: true,
        }
    },

    created: function() {
        db.collection("users").doc(this.$store.state.userProfile.data.uid).collection("feed").orderBy("createdAt", "desc").limit(5).get()
        .then(postSnapshot => {
            postSnapshot.forEach(post => {
                this.posts.push(post.id);
            })

            if (postSnapshot.size < 5) {
                this.moreToLoad = false;
            }

            this.isLoading = false;
            setTimeout(() => { this.isLoadingMore = false }, 500);
            this.lastLoadedPost = postSnapshot.docs[postSnapshot.size - 1];
        })
        .catch(e => {
            console.error("Error loading initial posts:", e);
        })
    },

    methods: {
        addPost: function(id) {
            this.posts.unshift(id);
        },

        loadMorePosts: function() {
            if (!this.isLoadingMore) {
                console.log("LOADING MORE!");
                this.isLoadingMore = true;
    
                db.collection("users").doc(this.$store.state.userProfile.data.uid).collection("feed").orderBy("createdAt", "desc").startAfter(this.lastLoadedPost).limit(5).get()
                .then(postSnapshot => {
                    postSnapshot.forEach(post => {
                        this.posts.push(post.id);
                    })
    
                    if (postSnapshot.size < 5) {
                        this.moreToLoad = false;
                    }
    
                    setTimeout(() => { this.isLoadingMore = false }, 500);
                    this.lastLoadedPost = postSnapshot.docs[postSnapshot.size - 1];
                })
                .catch(e => {
                    console.error("Error loading more posts", e);
                })
            }
        }
    }
}
</script>

<style scoped>
    .newPost {
        margin-top: 40px;
        margin-bottom: 25px;
    }
</style>