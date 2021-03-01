<template>
    <b-form @submit.prevent="addComment">
        <b-form-group>
            <b-form-input size="sm" v-model="commentForm.content" placeholder="Add a comment..." />
        </b-form-group>
    </b-form>
</template>

<script>
import { db, fv } from '@/firebase'

export default {
    name: 'CommentNew',
    props: {
        collection: {
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
        addComment: function() {
            if (this.commentForm.content.trim() !== "") {
                let payload = this.commentForm;
                this.commentForm = { content: '' };
                payload.createdBy = { id: this.$store.state.userProfile.data.uid, username: this.$store.state.userProfile.docData.username, profilePhoto: this.$store.state.userProfile.docData.profilePhoto }
                payload.createdAt = new Date();

                const commentId = this.generateId(16);
                const batch = db.batch();

                // First add comment to relevant collection.
                batch.set(db.collection(this.$props.collection).doc(this.$props.docId).collection("comments").doc(commentId), payload);

                // Then add comment to user document.
                batch.set(db.collection("users").doc(this.$store.state.userProfile.data.uid).collection("comments").doc(commentId), {
                    type: this.$props.collection,
                    docId: this.$props.docId,
                    createdAt: payload.createdAt
                });

                // Increment comment count.
                batch.update(db.collection(this.$props.collection).doc(this.$props.docId).collection("counters").doc((Math.floor(Math.random() * this.numShards).toString())), {
                    commentCount: fv.increment(1)
                });

                // Update last activity.
                batch.update(db.collection(this.$props.collection).doc(this.$props.docId), {
                    lastActivity: payload.createdAt
                });

                // Set up counters for comments.
                for (let i = 0; i < (this.numShards / 2); i ++) {
                    const shardRef = db.collection(this.$props.collection).doc(this.$props.docId).collection("comments").doc(commentId).collection("counters").doc(i.toString());
                    batch.set(shardRef, { likeCount: 0 });
                }

                // Commit the batch.
                batch.commit()
                .then(() => {
                    payload.id = commentId;
                    this.$emit("addComment", payload);
                })
                .catch(e => {
                    console.error("Error adding comment:", e);
                })
            }
        },

        generateId: function(n) {
            let randomChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
            let id = '';
            // 7 random characters
            for (let i = 0; i < n; i++) {
                id += randomChars.charAt(Math.floor(Math.random() * randomChars.length));
            }
            return id;
        },
    }
}
</script>