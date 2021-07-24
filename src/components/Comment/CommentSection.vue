<template>
    <b-container class="commentSection border-light">
        <b-row>
            <b-col sm="12" align-v="center" class="d-flex">
                <span>
                    <b-icon-heart class="ml-1 mr-1 icon" font-scale="1.4" v-if="!isLiked" @click="toggleLike" /><b-icon-heart-fill class="ml-1 mr-1 icon" font-scale="1.4" variant="danger" v-else @click="toggleLike" />
                    <b-icon-chat class="ml-1 mr-1 icon" font-scale="1.4" @click="expandComments" />
                    <span v-if="isFollowable"><b-icon-plus-square class="ml-1 mr-1 icon" font-scale="1.4" v-if="!isFollowed" @click="toggleFollow" /><b-icon-plus-square-fill class="ml-1 mr-1 icon" font-scale="1.4" variant="success" v-else @click="toggleFollow" /></span>
                </span>
                <span class="ml-auto text-muted">
                    <span class="count" @click="expandLikes"><span v-if="!isLoading">{{ likeCount }}</span><span v-else>...</span>&nbsp;<span v-if="likeCount == 1">like</span><span v-else>likes</span></span>&nbsp;
                    <span class="count" @click="expandComments"><span v-if="!isLoading">{{ commentCount }}</span><span v-else>...</span>&nbsp;<span v-if="commentCount == 1">comment</span><span v-else>comments</span></span>&nbsp;
                    <span class="count" @click="expandFollows" v-if="followableComponent"><span v-if="!isLoading">{{ followCount }}</span><span v-else>...</span>&nbsp;<span v-if="followCount == 1">follow</span><span v-else>follows</span></span>
                </span>
            </b-col>
        </b-row>
        <b-collapse v-model="commentsExpanded">
            <b-container>
                <div v-if="!isLoadingComments">
                    <b-list-group class="commentsContainer borderless" flush>
                        <Comment v-for="comment in comments" :key="comment.id" :comment="comment" :collection="coll" :docId="_id" />
                    </b-list-group>
                    <div class="text-center">
                        <b-button v-if="commentCount > comments.length" @click="loadMoreComments" :disabled="isLoadingMoreComments" variant="outline" class="mb-2">
                            <span v-if="isLoadingMoreComments"><b-spinner small /></span>
                            <span v-else>More</span>
                        </b-button>
                    </div>
                </div>
                <div v-else>
                    <b-list-group class="commentsContainer borderless" flush>
                        <b-list-group-item class="text-center">
                            <b-spinner small />
                        </b-list-group-item>
                    </b-list-group>
                </div>
                <CommentNew @addComment="addComment" :collection="coll" :docId="_id" />
            </b-container>
        </b-collapse>

        <b-modal :id="_id + '-likeModal'" centered ok-only button-size="sm">
            <template #modal-title>
                Likes
            </template>

            <div class="d-block">
                <div v-if="!isLoadingLikes">
                    <b-list-group>
                        <UserList v-for="like in likes" :key="like.createdBy._id" :userData="like.createdBy" />
                    </b-list-group>
                </div>
                <div v-else>
                    <b-spinner />
                </div>
            </div>
        </b-modal>

        <b-modal :id="_id + '-followModal'" centered ok-only button-size="sm">
            <template #modal-title>
                Follows
            </template>

            <div class="d-block">
                <div v-if="!isLoadingFollows">
                    <b-list-group>
                        <UserList v-for="follow in follows" :key="follow.createdBy.id" :userData="follow.createdBy" />
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
import { API } from 'aws-amplify'

import UserList from '@/components/User/UserList.vue'

import Comment from '@/components/Comment/Comment.vue'
import CommentNew from '@/components/Comment/CommentNew.vue'

export default {
    name: 'CommentSection',
    components: { UserList, Comment, CommentNew },
    props: {
        _id: {
            type: String,
            required: true
        },
        coll: {
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
            isLoadingMoreComments: false,

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

            lastLoadedComment: null,
        }
    },

    created: async function() {
        // let promises = [];
        // promises.push(this.checkIfUserLiked());

        // if (this.$props.followableComponent) {
        //     promises.push(this.checkIfUserFollowed());
        // }

        // promises.push(this.downloadCounters());

        // Promise.all(promises)
        // .then(() => {
        //     this.isLoading = false;
        // })
        // .catch(e => {
        //     console.error("Error pulling comment data:", e);
        // })

        const path = '/like';
        const myInit = {
            headers: {
                Authorization: this.$store.state.userProfile.data.idToken.jwtToken
            },
            queryStringParameters: {
                _id: this.$props._id,
                coll: this.$props.coll,
                loadAmount: 5
            }
        }

        const likeResponse = (await API.get(this.$store.state.apiName, path, myInit)).data;

        this.isLiked = likeResponse.isLiked;
        this.likeCount = likeResponse.likeCount;
        this.likes = likeResponse.likes;

        this.isLoading = false;

        console.log("LIKE RESPONSE", likeResponse);
    },

    methods: {
        toggleLike: async function() {
            // Check we're not already in the process of liking.
            if (!this.isLiking) {
                this.isLiking = true;
                const path = '/like'
                const myInit = {
                    headers: {
                        Authorization: this.$store.state.userProfile.data.idToken.jwtToken
                    },
                    queryStringParameters: {
                        _id: this.$props._id,
                        coll: this.$props.coll
                    }
                }

                // Check to see if we like or unlike.
                if (!this.isLiked) {
                    // Add like.
                    console.log("LIKING...");
                    this.likeCount ++;
                    this.isLiked = true;

                    try {
                        const likeResponse = await API.post(this.$store.state.apiName, path, myInit);
                        console.log("LIKED:", likeResponse);
                    }
                    catch (err) {
                        console.error("Liking error", err);
                        this.likeCount --;
                        this.isLiked = false;
                    }
                    finally {
                        this.isLiking = false;
                    }
                } else {
                    console.log("UNLIKING...");
                    this.likeCount --;
                    this.isLiked = false;

                    try {
                        const likeResponse = await API.del(this.$store.state.apiName, path, myInit);
                        console.log("UNLIKED:", likeResponse);
                    }
                    catch (err) {
                        console.error("Unliking error", err);
                        this.likeCount ++;
                        this.isLiked = true;
                    }
                    finally {
                        this.isLiking = false;
                    }
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
            if (this.likeCount > 0 && !this.isLoadingLikes) {
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
                    this.lastLoadedComment = commentSnapshot.docs[commentSnapshot.size - 1];
                })
            }
        },

        expandFollows: function() {
            if (this.followCount > 0 && !this.isLoadingFollows) {
                if (this.follows.length == 0) {
                    this.isLoadingFollows = true;
                    console.log("Downloading follows");

                    db.collection(this.$props.collection).doc(this.$props.docId).collection("follows").get()
                    .then(followSnapshot => {
                        followSnapshot.forEach(follow => {
                            this.follows.push(follow.data());
                        })

                        this.isLoadingFollows = false;
                        console.log(this.follows);
                        this.$bvModal.show(this.$props.docId + '-followModal');
                    })
                } else {
                    this.$bvModal.show(this.$props.docId + '-followModal');
                }   
            }
        },

        addComment: function(comment) {
            this.comments.unshift(comment);
            this.commentCount ++;
        },

        loadMoreComments: function() {
            this.isLoadingMoreComments = true;
            
            db.collection(this.$props.collection).doc(this.$props.docId).collection("comments").orderBy("createdAt", "desc").startAfter(this.lastLoadedComment).limit(5).get()
            .then(commentSnapshot => {
                commentSnapshot.forEach(comment => {
                    let data = comment.data();
                    data.id = comment.id;
                    this.comments.push(data);
                })

                this.isLoadingMoreComments = false;
                this.lastLoadedComment = commentSnapshot.docs[commentSnapshot.size - 1];
            })
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

    .icon:hover {
        cursor: pointer;
    }

    .count:hover {
        cursor: pointer;
        text-decoration: underline;
    }
</style>