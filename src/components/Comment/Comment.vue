<template>
    <b-list-group-item class="d-flex p-2" style="border:none;">
        <b-avatar class="mr-2 mt-2" size="2rem" :src="comment.createdBy.profilePhoto" />
        <div style="width: 100%" class="bg-light rounded p-2">
            <div>
                <span>{{ comment.createdBy.username }}</span>
                <b-dropdown class="float-right" variant="outline">
                    <span v-if="comment.createdBy.id === $store.state.userProfile.data.uid">
                        <b-dropdown-item>Edit</b-dropdown-item>
                        <b-dropdown-item variant="danger">Delete</b-dropdown-item>
                    </span>
                </b-dropdown>
            </div>
            <div class="content">{{ comment.content }}</div>
            <div class="like pl-1 d-flex">
                <div align-v="center">
                    <b-icon-heart v-if="!isLiked" class="icon" @click="toggleLike" font-scale=".8" />
                    <b-icon-heart-fill v-else variant="danger" class="icon" @click="toggleLike" font-scale=".8" />
                    <span class="ml-1 text-muted count" style="font-size:12px;">{{ likeCount }}&nbsp;<span v-if="likeCount == 1">like</span><span v-else>likes</span></span>
                </div>
            </div>
        </div>
    </b-list-group-item>
</template>

<script>
import { db, fv } from '@/firebase'

export default {
    name: 'Comment',
    props: {
        comment: {
            type: Object,
            required: true
        },
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
            isLiking: false,
            isLiked: '',
            likeCount: 0,

            numShards: 10,
        }
    },

    created: function() {
        // Download likes.
        db.collection(this.$props.collection).doc(this.$props.docId).collection("comments").doc(this.$props.comment.id).collection("counters").get()
        .then(counterSnapshot => {
            counterSnapshot.forEach(counter => {
                this.likeCount += counter.data().likeCount;
            })
        })

        // Check if liked.
        db.collection("users").doc(this.$store.state.userProfile.data.uid).collection("likes").where("id", "==", this.$props.comment.id).get()
        .then(likeSnapshot => {
            likeSnapshot.forEach(like => {
                if (like.exists) {
                    this.isLiked = like.id;
                }
            })
        })
    },

    methods: {
        toggleLike: function() {
            if (!this.isLiking) {
                this.isLiking = true;
                const batch = db.batch();
                const timestamp = new Date();

                if (!this.isLiked) {
                    const likeId = this.generateId(16);
                    this.isLiked = likeId;

                    // First add to comment.
                    batch.set(db.collection(this.$props.collection).doc(this.$props.docId).collection("comments").doc(this.$props.comment.id).collection("likes").doc(likeId), {
                        createdBy: { 
                            username: this.$store.state.userProfile.docData.username,
                            id: this.$store.state.userProfile.data.uid,
                            profilePhoto: this.$store.state.userProfile.docData.profilePhoto 
                        }, 
                        createdAt: timestamp
                    });

                    // Create the like in the user document.
                    batch.set(db.collection("users").doc(this.$store.state.userProfile.data.uid).collection("likes").doc(likeId), {
                        type: "comments",
                        id: this.$props.comment.id,
                        createdAt: timestamp
                    });

                    // Increment one of the like counters.
                    batch.set(db.collection(this.$props.collection).doc(this.$props.docId).collection("comments").doc(this.$props.comment.id).collection("counters").doc((Math.floor(Math.random() * (this.numShards / 2))).toString()), {
                        likeCount: fv.increment(1)
                    });

                    // Set last activity on this document
                    batch.update(db.collection(this.$props.collection).doc(this.$props.docId), {
                        lastActivity: timestamp
                    });

                    // Commit the batch
                    batch.commit()
                    .then(() => {
                        this.isLiking = false;
                        this.likeCount ++;
                    })
                    .catch(e => {
                        console.error("Error liking:", this.$props.docId, this.$props.comment.id, e);
                        this.isLiked = '';
                        this.isLiking = false;
                    })
                } else {
                    // First delete like from comments collection.
                    batch.delete(db.collection(this.$props.collection).doc(this.$props.docId).collection("comments").doc(this.$props.comment.id).collection("likes").doc(this.isLiked));

                    // Then delete from user document.
                    batch.delete(db.collection("users").doc(this.$store.state.userProfile.data.uid).collection("likes").doc(this.isLiked));

                    // Decrement one of the like counters
                    batch.update(db.collection(this.$props.collection).doc(this.$props.docId).collection("comments").doc(this.$props.comment.id).collection("counters").doc((Math.floor(Math.random() * (this.numShards / 2))).toString()), {
                        likeCount: fv.increment(-1)
                    });

                    // Delete like
                    const temp = this.isLiked;
                    this.isLiked = '';

                    // Commit the batch.
                    batch.commit()
                    .then(() => {
                        this.isLiking = false;
                        this.likeCount --;
                    })
                    .catch(e => {
                        console.error("Error unliking:", this.$props.docId, this.$props.comment.id, e);
                        this.isLiking = false;
                        this.isLiked = temp;
                    })
                }
            }
        },

        generateId: function(n) {
            let randomChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
            let id = '';
            for (let i = 0; i < n; i++) {
                id += randomChars.charAt(Math.floor(Math.random() * randomChars.length));
            }
            return id;
        }
    }
}
</script>

<style scoped>
.username:hover {
    cursor: pointer;
}

.icon:hover {
    cursor: pointer;
}

.content {
    font-size: 15px;
}

.count:hover {
    text-decoration: underline;
    cursor: pointer;
}
</style>