<template>
    <PostFeed v-if="!isLoading" @addPost="addPost" :posts="posts" :newPost="true"></PostFeed>
    <div v-else class="text-center"><b-spinner /></div>
</template>

<script>
import { db } from '@/firebase'
import PostFeed from '@/components/Post/PostFeed.vue'

export default {
    name: 'PostFeedHome',
    components: { PostFeed },
    data() {
        return {
            isLoading: true,
            posts: [],
        }
    },

    created: function() {
        db.collection("users").doc(this.$store.state.userProfile.data.uid).collection("feed").orderBy("createdAt", "desc").get()
        .then(postSnapshots => {
            postSnapshots.forEach(post => {
                this.posts.push(post.id);
            })

            this.isLoading = false;
        })
    },

    methods: {
        addPost: function(id) {
            this.posts.unshift(id);
        }
    }
}
</script>