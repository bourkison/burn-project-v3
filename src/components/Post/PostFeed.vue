<template>
    <div class="postFeed" v-if="!isLoading">
        <PostComponent
            v-for="(post, index) in posts"
            :key="post._id"
            :postId="post._id"
            class="post"
            :skeletonAmount="skeleton[index][0]"
            :skeletonWidth="skeleton[index][1]"
            @postLoaded="postLoaded(index)"
        />
    </div>
    <div v-else>
        <LoadingComponent
            class="post"
            v-for="(s, i) in skeleton"
            :key="i"
            :skeletonAmount="s[0]"
            :skeletonWidth="s[1]"
        />
    </div>
</template>

<script>
import PostComponent from "@/components/Post/PostComponent.vue";
import LoadingComponent from "@/components/Utility/LoadingComponent.vue";

export default {
    name: "Feed",
    components: { PostComponent, LoadingComponent },
    props: {
        posts: {
            type: Array,
            required: true
        },
        isLoading: {
            type: Boolean,
            required: true
        }
    },
    data() {
        return {
            skeleton: [],
            loadAmount: 5
        };
    },

    computed: {
        postLength: function() {
            return this.$props.posts.length;
        }
    },

    created: function() {
        for (let i = 0; i < this.loadAmount; i++) {
            let amount = Math.floor(Math.random() * 4) + 3;
            let widths = [];

            for (let j = 0; j < amount; j++) {
                widths.push((Math.floor(Math.random() * 50) + 50).toString() + "%");
            }
            this.skeleton.push([amount, widths]);
        }
    },

    methods: {
        addPost: function(p) {
            this.$emit("addPost", p.id);
        },

        postLoaded: function(index) {
            this.$emit("postLoaded", index);
        }
    },

    watch: {
        postLength: function(n) {
            let len = this.skeleton.length;

            for (let i = 0; i < n - len; i ++) {
                let amount = Math.floor(Math.random() * 4) + 3;
                let widths = [];

                for (let j = 0; j < amount; j++) {
                    widths.push((Math.floor(Math.random() * 50) + 50).toString() + "%");
                }
                this.skeleton.push([amount, widths]);
            }
        }
    }
};
</script>

<style scoped>
.post {
    margin-bottom: 25px;
}
</style>
