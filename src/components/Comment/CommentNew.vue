<template>
    <b-form @submit.prevent="addComment">
        <b-form-group>
            <CommentEditor ref="editor" v-model="commentForm.content" @addComment="addComment" :replyingTo="replyingTo" />
        </b-form-group>
    </b-form>
</template>

<script lang="ts">
import Vue, { PropType } from "vue"
import CommentEditor from "@/components/TextEditor/CommentEditor.vue";

export default Vue.extend({
    name: "CommentNew",
    components: { CommentEditor },
    props: {
        coll: {
            type: String as PropType<string>,
            required: true
        },
        docId: {
            type: String as PropType<string>,
            required: true
        },
        replyingTo: {
            type: String as PropType<string>,
            required: false
        }
    },
    data() {
        return {
            commentForm: {
                content: ""
            },
        };
    },

    methods: {
        async addComment() {
            if (this.commentForm.content.trim() !== "") {
                try {
                    let payload = this.commentForm;
                    this.commentForm = { content: "" };
    
                    const init = {
                        queryStringParameters: {
                            docId: this.$props.docId,
                            coll: this.$props.coll
                        },
                        body: {
                            content: payload.content
                        }
                    };
    
                    const commentResponse = await this.$accessor.api.createComment({ init });
                    this.$emit("addComment", commentResponse);
                }
                catch (err) {
                    console.error("Error adding comment:", err);
                }
            }
        }
    },

    watch: {
        replyingTo(n) {
            if (n !== "") {
                const reply = `<span data-type="mention" class="user-mention" data-id="${n}">@${n}</span>`;
                if (this.commentForm.content.substr(0, 3) === "<p>") {
                    this.commentForm.content = "<p>" + reply + " " + this.commentForm.content.substr(3);
                } else {
                    this.commentForm.content = "<p>" + reply + "</p>";
                }

                this.$nextTick(() => { this.$emit("replied") });
            }
        }
    }
});
</script>
