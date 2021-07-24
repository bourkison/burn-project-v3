<template>
    <b-form @submit.prevent="addComment">
        <b-form-group>
            <b-form-input @keyup.enter="addComment" size="sm" v-model="commentForm.content" placeholder="Add a comment..." />
        </b-form-group>
    </b-form>
</template>

<script>
import { API } from 'aws-amplify'

export default {
    name: 'CommentNew',
    props: {
        coll: {
            type: String,
            required: true
        },
        _id: {
            type: String,
            required: true
        }
    },
    data() {
        return {
            commentForm: {
                content: ''
            },

            numShards: 10
        }
    },

    methods: {
        addComment: async function() {
            if (this.commentForm.content.trim() !== "") {
                let payload = this.commentForm;
                this.commentForm = { content: '' };

                const path = '/comment';
                const myInit = {
                    headers: {
                        Authorization: this.$store.state.userProfile.data.idToken.jwtToken
                    },
                    queryStringParameters: {
                        _id: this.$props._id,
                        coll: this.$props.coll
                    },
                    body: {
                        content: payload.content
                    }
                }

                await API.post(this.$store.state.apiName, path, myInit).then(commentResponse => {
                    console.log("SUCCESSFUL COMMENT:", commentResponse);
                    payload = commentResponse.data;
                    payload.createdAt = new Date();

                    this.$emit("addComment", payload);
                })
                .catch(err => {
                    console.error("Error adding comment", err);
                });
            }
        }
    }
}
</script>