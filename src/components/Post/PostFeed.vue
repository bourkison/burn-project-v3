<template>
    <div class="postFeed">
        <b-row v-for="post in posts" :key="post">
            <b-col sm="12">
                <PostComponent :postId="post" class="post" />
            </b-col>
        </b-row>
    </div>
</template>

<script>
import PostComponent from "@/components/Post/PostComponent.vue";

export default {
    name: "Feed",
    components: { PostComponent },
    props: {
        posts: {
            type: Array,
            required: true
        }
    },

    methods: {
        addPost: function(p) {
            this.$emit("addPost", p.id);
        }
    }
};
</script>

<style scoped>
.post {
    margin-bottom: 25px;
}
</style>
