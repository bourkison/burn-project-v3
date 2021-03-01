<template>
    <b-container class="commentSection border-light">
        <b-row>
            <b-col sm="12" align-v="center" class="d-flex">
                <span>
                    <b-icon-heart class="icon" font-scale="1.4" v-if="!isLiked" @click="toggleLike" /><b-icon-heart-fill class="icon" font-scale="1.4" variant="danger" v-else @click="toggleLike" />
                    <b-icon-chat class="icon" font-scale="1.4" @click="expandComments" />
                    <span v-if="isFollowable"><b-icon-plus-square class="icon" font-scale="1.4" v-if="!isFollowed" @click="toggleFollow" /><b-icon-plus-square-fill class="icon" font-scale="1.4" variant="success" v-else @click="toggleFollow" /></span>
                </span>
                <span class="ml-auto text-muted">
                    <span class="count" @click="expandLikes">{{ likeCount }}&nbsp;<span v-if="likeCount == 1">like</span><span v-else>likes</span></span>&nbsp;
                    <span class="count" @click="expandComments">{{ commentCount }}&nbsp;<span v-if="commentCount == 1">comment</span><span v-else>comments</span></span>&nbsp;
                    <span class="count" v-if="followableComponent">{{ followCount }}&nbsp;<span v-if="followCount == 1">follow</span><span v-else>follows</span></span>
                </span>
            </b-col>
        </b-row>
        <b-collapse v-model="commentsExpanded">
            <b-container>
                <div v-if="!isLoadingComments">
                    <b-list-group class="commentsContainer borderless" flush>
                        <Comment v-for="comment in comments" :key="comment.id" :comment="comment" />
                    </b-list-group>
                </div>
                <div v-else>
                    <b-list-group class="commentsContainer">
                        <b-list-group-item class="text-center">
                            <b-spinner small />
                        </b-list-group-item>
                    </b-list-group>
                </div>
                <CommentNew @addComment="addComment" :collection="collection" :docId="docId" />
            </b-container>
        </b-collapse>

        <b-modal :id="docId + '-likeModal'" centered ok-only>
            <template #modal-title>
                Likes
            </template>

            <div class="d-block">
                <div v-if="!isLoadingLikes">
                    <b-list-group>
                        <UserList v-for="like in likes" :key="like.createdBy.id" :userData="like.createdBy" />
                    </b-list-group>
                </div>
                <div v-else>
                    <b-spinner />
                </div>
            </div>
        </b-modal>
    </b-container>
</template>

<script>
import { db, fv } from '@/firebase'

import UserList from '@/components/User/UserList.vue'

import Comment from '@/components/Comment/Comment.vue'
import CommentNew from '@/components/Comment/CommentNew.vue'

export default {
    name: 'CommentSection',
    components: { UserList, Comment, CommentNew },
    props: {
        docId: {
            type: String,
            required: true
        },
        collection: {
            type: String,
            required: true
        },
        followableComponent: {
            type: Boolean,
            required: true
        }
    },
    data() {
        return {
            isLoading: true,
            isLiking: false,
            isFollowing: false,
            isLoadingLikes: false,
            isLoadingComments: false,
            isLoadingFollows: false,

            isLiked: '',
            isFollowed: '',
            isFollowable: false,

            likeCount: 0,
            commentCount: 0,
            followCount: 0,
            numShards: 10,

            commentsExpanded: false,

            likes: [],
            comments: [],
            follows: [],
        }
    },

    created: function() {
        let promises = [];
        promises.push(this.checkIfUserLiked());

        if (this.$props.followableComponent) {
            promises.push(this.checkIfUserFollowed());
        }

        promises.push(this.downloadCounters());

        Promise.all(promises)
        .then(() => {
            this.isLoading = false;
        })
        .catch(e => {
            console.error("Error pulling comment data:", e);
        })
    },

    methods: {
        toggleLike: function() {
            // Check we're not already in the process of liking.
            if (!this.isLiking) {
                this.isLiking = true;
                const batch = db.batch();
                const timestamp = new Date();

                // Check to see if we like or unlike.
                if (!this.isLiked) {
                    // Add like.           
                    const likeId = this.generateId(16);
                    this.isLiked = likeId;

                    // First add to relevant collection/document.
                    batch.set(db.collection(this.$props.collection).doc(this.$props.docId).collection("likes").doc(likeId), {
                        createdBy: { 
                            username: this.$store.state.userProfile.docData.username,
                            id: this.$store.state.userProfile.data.uid,
                            profilePhoto: this.$store.state.userProfile.docData.profilePhoto 
                        }, 
                        createdAt: timestamp
                    });

                    // Create the like in the user document.
                    batch.set(db.collection("users").doc(this.$store.state.userProfile.data.uid).collection("likes").doc(likeId), {
                        type: this.$props.collection,
                        id: this.$props.docId,
                        createdAt: timestamp
                    });

                    // Increment one of the like counters.
                    batch.update(db.collection(this.$props.collection).doc(this.$props.docId).collection("counters").doc((Math.floor(Math.random() * this.numShards)).toString()), {
                        likeCount: fv.increment(1)
                    });

                    // Set last activity on this document.
                    batch.update(db.collection(this.$props.collection).doc(this.docId), {
                        lastActivity: timestamp
                    });

                    // Commit the batch
                    batch.commit()
                    .then(() => {
                        this.isLiking = false;
                        this.likeCount ++;

                        if (this.likes.length > 0) {
                            this.likes.push({
                                createdBy: { 
                                    username: this.$store.state.userProfile.docData.username,
                                    id: this.$store.state.userProfile.data.uid,
                                    profilePhoto: this.$store.state.userProfile.docData.profilePhoto 
                                }
                            })
                        }
                    })
                    .catch(e => {
                        console.error("Error liking", this.docId, e);
                        this.isLiked = '';
                        this.isLiking = false;
                    })
                } else {
                    // First delete like from relevant collection.
                    batch.delete(db.collection(this.$props.collection).doc(this.$props.docId).collection("likes").doc(this.isLiked));

                    // Then delete from user document.
                    batch.delete(db.collection("users").doc(this.$store.state.userProfile.data.uid).collection("likes").doc(this.isLiked));

                    // Decrement one of the like counters.
                    batch.update(db.collection(this.$props.collection).doc(this.$props.docId).collection("counters").doc((Math.floor(Math.random() * this.numShards)).toString()), {
                        likeCount: fv.increment(-1)
                    });

                    // Delete like.
                    this.isLiked = '';

                    // Commit the batch.
                    batch.commit()
                    .then(() => {
                        this.isLiking = false;
                        this.isLiked = '';
                        this.likeCount --;
                    })
                    .catch(e => {
                        console.error("Error unliking", this.$props.docId, e);
                        this.isLiking = false;
                        this.isLiked = this.$props.docId;
                    })
                }
            }
        },

        toggleFollow: function() {
            if (this.isFollowable && !this.isFollowing) {
                this.isFollowing = true;
                const batch = db.batch();
                const timestamp = new Date();

                // Following is basically the same as a like.
                // Though instead of adding to a "likes" collection in the user doc, we just add to the relevant collection.
                // That way we differ between created and followed by the createdBy value.
                // In the relevant collection, follow IDs will be the User ID.
                // In the User collection, follows will be the document ID.
                if (!this.isFollowed) {
                    this.isFollowed = this.$props.docId;

                    // First add to the relevant document.
                    batch.set(db.collection(this.$props.collection).doc(this.$props.docId).collection("follows").doc(this.$store.state.userProfile.data.uid), {
                        createdBy: { 
                            username: this.$store.state.userProfile.docData.username,
                            id: this.$store.state.userProfile.data.uid,
                            profilePhoto: this.$store.state.userProfile.docData.profilePhoto 
                        }, 
                        createdAt: timestamp
                    })

                    // Then add to the user document.
                    batch.set(db.collection("users").doc(this.$store.state.userProfile.data.uid).collection(this.$props.collection).doc(this.$props.docId), {
                        createdAt: timestamp,
                        isFollow: true,
                    })

                    // Increment the follow counter.
                    batch.update(db.collection(this.$props.collection).doc(this.$props.docId).collection("counters").doc((Math.floor(Math.random() * this.numShards)).toString()), {
                        followCount: fv.increment(1)
                    })

                    // Update lastActivity
                    batch.update(db.collection(this.$props.collection).doc(this.$props.docId), {
                        lastActivity: timestamp
                    });

                    // Commit the batch.
                    batch.commit()
                    .then(() => {
                        this.followCount ++;
                        this.isFollowed = this.$props.docId;
                        this.isFollowing = false;
                    })
                    .catch(e => {
                        console.error("Error creating follow:", e);
                        this.isFollowed = '';
                    })
                } else {
                    // Unfollow.
                    this.isFollowed = '';

                    // First delete from relevant collection.
                    batch.delete(db.collection(this.$props.collection).doc(this.$props.docId).collection("follows").doc(this.$store.state.userProfile.data.uid));

                    // Then delete from users collection.
                    batch.delete(db.collection("users").doc(this.$store.state.userProfile.data.uid).collection(this.$props.collection).doc(this.$props.docId));

                    // Decrement the follow counter.
                    batch.update(db.collection(this.$props.collection).doc(this.$props.docId).collection("counters").doc((Math.floor(Math.random() * this.numShards)).toString()), {
                        followCount: fv.increment(-1)
                    });

                    // Commit the batch.
                    batch.commit()
                    .then(() => {
                        this.isFollowed = '';
                        this.followCount --;
                        this.isFollowing = false;
                    })
                    .catch(e => {
                        console.error("Error deleting follow:", e);
                        this.isFollowing = false;
                        this.isFollowed = this.$props.docId;
                    });
                }    
                document.activeElement.blur();
            }
        },

        expandLikes: function() {
            if (this.likeCount > 0) {
                if (this.likes.length == 0) {
                    this.isLoadingLikes = true;
                    console.log("Downloading likes");

                    db.collection(this.$props.collection).doc(this.$props.docId).collection("likes").get()
                    .then(likeSnapshot => {
                        likeSnapshot.forEach(like => {
                            this.likes.push(like.data());
                        })

                        this.isLoadingLikes = false;
                        console.log(this.likes);
                        this.$bvModal.show(this.$props.docId + '-likeModal');
                    })
                } else {
                    this.$bvModal.show(this.$props.docId + '-likeModal');
                }   
            }
        },

        expandComments: function() {
            this.commentsExpanded = !this.commentsExpanded;

            if (this.commentsExpanded && this.comments.length == 0 && this.commentCount > 0) {
                this.isLoadingComments = true;

                db.collection(this.$props.collection).doc(this.$props.docId).collection("comments").orderBy("createdAt", "desc").limit(5).get()
                .then(commentSnapshot => {
                    commentSnapshot.forEach(comment => {
                        let data = comment.data();
                        data.id = comment.id;
                        this.comments.push(data);
                    })

                    this.isLoadingComments = false;
                })
            }
        },

        addComment: function(comment) {
            this.comments.unshift(comment);
            this.commentCount ++;
        },

        checkIfUserLiked: function() {
            return db.collection("users").doc(this.$store.state.userProfile.data.uid).collection("likes").where("id", "==", this.$props.docId).get()
            .then(likeSnapshot => {
                likeSnapshot.forEach(like => {
                    if (like.exists) {
                        this.isLiked = like.id;
                    }
                })
            })
        },

        checkIfUserFollowed: function() {
            return db.collection("users").doc(this.$store.state.userProfile.data.uid).collection(this.$props.collection).doc(this.$props.docId).get()
            .then(docRef => {
                if (docRef.exists) {
                    if (!docRef.data().isFollow) {
                        this.isFollowable = false;
                    } else {
                        this.isFollowable = true;
                    }
                    this.isFollowed = docRef.id; // Collection document ID.
                } else {
                    this.isFollowable = true;
                    this.isFollowed = '';
                }
            })
        },

        downloadCounters: function() {
            return db.collection(this.$props.collection).doc(this.$props.docId).collection("counters").get()
            .then(counterSnapshot => {
                counterSnapshot.forEach(counterDoc => {
                    this.likeCount += counterDoc.data().likeCount;
                    this.commentCount += counterDoc.data().commentCount;
                    if (this.$props.followableComponent) {
                        this.followCount += counterDoc.data().followCount;
                    }
                })
            })
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
    .commentSection {
        padding: 10px;
        border-top: 2px solid;
    }

    .commentsContainer {
        padding: 10px;
    }

    .icon {
        margin: 0 5px;
    }

    .icon:hover {
        cursor: pointer;
    }

    .count:hover {
        cursor: pointer;
        text-decoration: underline;
    }
</style>