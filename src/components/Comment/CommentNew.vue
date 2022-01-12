<template>
    <b-form @submit.prevent="addComment">
        <b-form-group>
            <CommentEditor ref="editor" v-model="commentForm.content" @addComment="addComment" :replyingTo="replyingTo" />
        </b-form-group>
    </b-form>
</template>

<script>
import { API } from "aws-amplify";
import CommentEditor from "@/components/TextEditor/CommentEditor.vue";

export default {
    name: "CommentNew",
    components: { CommentEditor },
    props: {
        coll: {
            type: String,
            required: true
        },
        docId: {
            type: String,
            required: true
        },
        replyingTo: {
            type: String,
            required: false
        }
    },
    data() {
        return {
            commentForm: {
                content: ""
            },

            numShards: 10
        };
    },

    methods: {
        addComment: async function() {
            if (this.commentForm.content.trim() !== "") {
                let payload = this.commentForm;
                this.commentForm = { content: "" };

                const path = "/comment";
                const myInit = {
                    headers: {
                        Authorization: await this.$store.dispatch("fetchJwtToken")
                    },
                    queryStringParameters: {
                        docId: this.$props.docId,
                        coll: this.$props.coll
                    },
                    body: {
                        content: payload.content
                    }
                };

                await API.post(this.$store.state.apiName, path, myInit)
                    .then(commentResponse => {
                        payload._id = commentResponse.data._id;
                        payload.createdAt = new Date();
                        payload.likeCount = 0;
                        payload.likes = [];
                        payload.createdBy = {
                            username: this.$store.state.userProfile.docData.username,
                            _id: this.$store.state.userProfile.docData._id
                        };

                        this.$emit("addComment", payload);
                    })
                    .catch(err => {
                        console.error("Error adding comment", err);
                    });
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
};
</script>
