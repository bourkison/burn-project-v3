<template>
    <div class="postFeed">
        <PostNew v-if="newPost" class="postNew" />

        <b-row v-for="post in posts" :key="post">
            <b-col sm="12">
                <PostComponent :postId="post" class="post"/>
            </b-col>
        </b-row>
    </div>
</template>

<script>
import PostNew from '@/components/Post/PostNew.vue'
import PostComponent from '@/components/Post/PostComponent.vue'

export default {
    name: 'Feed',
    components: { PostComponent, PostNew },
    props: {
        posts: {
            type: Array,
            required: true
        },
        newPost: {
            type: Boolean,
            required: true
        }
    },

    methods: {
        addPost: function(p) {
            this.$emit("addPost", p.id);
        }
    }
}
</script>

<style scoped>
    .postFeed {
        margin-top: 40px;
    }

    .post,
    .postNew {
        margin-bottom: 25px;
    }
</style>