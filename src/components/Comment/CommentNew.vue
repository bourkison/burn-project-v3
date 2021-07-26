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
        docId: {
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
                        docId: this.$props.docId,
                        coll: this.$props.coll
                    },
                    body: {
                        content: payload.content
                    }
                }

                await API.post(this.$store.state.apiName, path, myInit).then(commentResponse => {
                    payload._id = commentResponse.data._id;
                    payload.createdAt = new Date();
                    payload.likeCount = 0;
                    payload.likes = [];
                    payload.createdBy = {
                        username: this.$store.state.userProfile.docData.username,
                        _id: this.$store.state.userProfile.docData._id
                    }

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