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

<script lang="ts">
import Vue, { PropType } from "vue";
import { PostReference } from "@/types/post";

import PostComponent from "@/components/Post/PostComponent.vue";
import LoadingComponent from "@/components/Utility/LoadingComponent.vue";

export default Vue.extend({
    name: "Feed",
    components: { PostComponent, LoadingComponent },
    props: {
        posts: {
            type: Array as PropType<PostReference[]>,
            required: true
        },
        isLoading: {
            type: Boolean as PropType<boolean>,
            required: true
        }
    },
    data() {
        return {
            skeleton: [] as [number, string[]][],
            loadAmount: 5,
        };
    },

    created() {
        this.skeleton = this.$accessor.posts.postFeedSkeletons;
    },

    mounted() {
        this.$accessor.posts.EMPTY_SKELETONS();
    },

    computed: {
        postLength(): number {
            return this.posts.length;
        }
    },

    methods: {
        addPost(p: PostReference) {
            this.$emit("addPost", p);
        },

        postLoaded(index: number) {
            this.$emit("postLoaded", index);
        }
    },

    watch: {
        postLength(n) {
            let len = this.skeleton.length;
            for (let i = 0; i < n - len; i++) {
                let amount = Math.floor(Math.random() * 4) + 3;
                let widths = [];

                for (let j = 0; j < amount; j++) {
                    widths.push((Math.floor(Math.random() * 50) + 50).toString() + "%");
                }

                this.skeleton.push([amount, widths]);
            }
        }
    }
});
</script>

<style scoped>
.post {
    margin-bottom: 25px;
}
</style>
