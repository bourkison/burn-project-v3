<template>
    <b-container class="commentSection border-light">
        <b-row>
            <b-col sm="12" align-v="center" class="d-flex">
                <span>
                    <b-icon-heart
                        class="ml-1 mr-1 icon"
                        font-scale="1.4"
                        v-if="!isLiked"
                        @click="toggleLike"
                    /><b-icon-heart-fill
                        class="ml-1 mr-1 icon"
                        font-scale="1.4"
                        variant="danger"
                        v-else
                        @click="toggleLike"
                    />
                    <b-icon-chat class="ml-1 mr-1 icon" font-scale="1.4" @click="expandComments" />
                    <span v-if="isFollowable"
                        ><b-icon-plus-square
                            class="ml-1 mr-1 icon"
                            font-scale="1.4"
                            v-if="!isFollowed"
                            @click="toggleFollow"/><b-icon-plus-square-fill
                            class="ml-1 mr-1 icon"
                            font-scale="1.4"
                            variant="success"
                            v-else
                            @click="toggleFollow"
                    /></span>
                </span>
                <span class="ml-auto text-muted">
                    <span class="count" @click="expandLikes">
                        <span>{{ likeCount }}</span
                        >&nbsp;<span v-if="likeCount == 1">like</span
                        ><span v-else>likes</span> </span
                    >&nbsp;
                    <span class="count" @click="expandComments">
                        <span>{{ commentCount }}</span
                        >&nbsp;<span v-if="commentCount == 1">comment</span
                        ><span v-else>comments</span> </span
                    >&nbsp;
                    <span class="count" @click="expandFollows" v-if="followableComponent"
                        ><span v-if="!isLoading">{{ followCount }}</span
                        ><span v-else>...</span>&nbsp;<span v-if="followCount == 1">follow</span
                        ><span v-else>follows</span></span
                    >
                </span>
            </b-col>
        </b-row>
        <b-collapse v-model="commentsExpanded">
            <b-container>
                <div v-if="!isLoadingComments">
                    <b-list-group class="commentsContainer borderless" flush>
                        <Comment
                            v-for="comment in comments"
                            :key="comment._id"
                            :comment="comment"
                            :coll="coll"
                            :docId="docId"
                        />
                    </b-list-group>
                    <div class="text-center">
                        <b-button
                            v-if="commentCount > comments.length"
                            @click="loadMoreComments"
                            :disabled="isLoadingMoreComments"
                            variant="outline"
                            class="mb-2"
                        >
                            <span v-if="isLoadingMoreComments"><b-spinner small/></span>
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
                <CommentNew @addComment="addComment" :coll="coll" :docId="docId" />
            </b-container>
        </b-collapse>

        <b-modal :id="docId + '-likeModal'" centered ok-only button-size="sm" hide-footer>
            <template #modal-title>
                Likes
            </template>

            <div class="d-block">
                <div v-if="!isLoadingLikes">
                    <b-list-group>
                        <UserList
                            v-for="like in likes"
                            :key="like.createdBy._id"
                            :userData="like.createdBy"
                        />
                    </b-list-group>
                </div>
                <div v-else>
                    <div class="text-center "><b-spinner small /></div>
                </div>
            </div>
        </b-modal>

        <b-modal :id="docId + '-followModal'" centered ok-only button-size="sm" hide-footer>
            <template #modal-title>
                Follows
            </template>

            <div class="d-block">
                <div v-if="!isLoadingFollows">
                    <b-list-group>
                        <UserList v-for="follow in follows" :key="follow._id" :userData="follow" />
                    </b-list-group>
                </div>
                <div v-else>
                    <div class="text-center"><b-spinner small /></div>
                </div>
            </div>
        </b-modal>
    </b-container>
</template>

<script>
import { API } from "aws-amplify";

import UserList from "@/components/User/UserList.vue";

import Comment from "@/components/Comment/Comment.vue";
import CommentNew from "@/components/Comment/CommentNew.vue";

export default {
    name: "CommentSection",
    components: { UserList, Comment, CommentNew },
    props: {
        docId: {
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
        },
        likeCount: {
            type: Number,
            required: true
        },
        commentCount: {
            type: Number,
            required: true
        },
        isLiked: {
            type: Boolean,
            required: true
        },
        followCount: {
            type: Number,
            required: false
        },
        isFollowed: {
            type: Boolean,
            required: false
        },
        isFollowable: {
            type: Boolean,
            required: false
        }
    },
    data() {
        return {
            isLoading: false,
            isLiking: false,
            isFollowing: false,
            isLoadingLikes: false,
            isLoadingComments: false,
            isLoadingFollows: false,
            isLoadingMoreComments: false,

            commentsExpanded: false,

            likes: [],
            comments: [],
            follows: [],

            lastLoadedComment: null
        };
    },

    created: async function() {
        // Get most recent comments and comment count.
        this.isLoadingComments = true;
        const path = "/comment/" + this.$props.docId;

        let myInit = {
            headers: {
                Authorization: await this.$store.dispatch("fetchJwtToken")
            },
            queryStringParameters: {
                coll: this.$props.coll,
                loadAmount: 5
            }
        };

        const commentResponse = await API.get(this.$store.state.apiName, path, myInit);
        this.comments = commentResponse.data.comments;
        this.isLoadingComments = false;
    },

    methods: {
        toggleLike: async function() {
            // Check we're not already in the process of liking.
            if (!this.isLiking) {
                this.isLiking = true;
                const path = "/like";
                const myInit = {
                    headers: {
                        Authorization: await this.$store.dispatch("fetchJwtToken")
                    },
                    queryStringParameters: {
                        docId: this.$props.docId,
                        coll: this.$props.coll
                    }
                };

                // Check to see if we like or unlike.
                if (!this.isLiked) {
                    // Add like.
                    console.log("LIKING...");
                    this.$emit("like");

                    try {
                        const likeResponse = await API.post(
                            this.$store.state.apiName,
                            path,
                            myInit
                        );
                        console.log("LIKED:", likeResponse);
                    } catch (err) {
                        console.error("Liking error", err);
                        this.$emit("unlike");
                    } finally {
                        this.isLiking = false;
                    }
                } else {
                    console.log("UNLIKING...");
                    this.$emit("unlike");

                    try {
                        const likeResponse = await API.del(this.$store.state.apiName, path, myInit);
                        console.log("UNLIKED:", likeResponse);
                    } catch (err) {
                        console.error("Unliking error", err);
                        this.$emit("like");
                    } finally {
                        this.isLiking = false;
                    }
                }
            }
        },

        toggleFollow: async function() {
            if (this.isFollowable && !this.isFollowing) {
                this.isFollowing = true;
                const path = "/follow";
                const myInit = {
                    headers: {
                        Authorization: await this.$store.dispatch("fetchJwtToken")
                    },
                    queryStringParameters: {
                        docId: this.$props.docId,
                        coll: this.$props.coll
                    }
                };

                if (!this.isFollowed) {
                    this.$emit("follow");

                    try {
                        const followResponse = await API.post(
                            this.$store.state.apiName,
                            path,
                            myInit
                        );
                        console.log("FOLLOWED:", followResponse);
                    } catch (err) {
                        console.error("Following error", err);
                        this.$emit("unfollow");
                    } finally {
                        this.isFollowing = false;
                    }
                } else {
                    // Unfollow.
                    this.$emit("unfollow");

                    try {
                        const followResponse = await API.del(
                            this.$store.state.apiName,
                            path,
                            myInit
                        );
                        console.log("UNFOLLOWED:", followResponse);
                    } catch (err) {
                        this.$emit("follow");
                        console.error("Unfollowing error", err);
                    } finally {
                        this.isFollowing = false;
                    }

                    console.log("UNFOLLOW");
                }
                document.activeElement.blur();
            }
        },

        expandLikes: async function() {
            if (this.likeCount > 0 && !this.isLoadingLikes) {
                if (this.likes.length == 0) {
                    this.isLoadingLikes = true;
                    this.$bvModal.show(this.$props.docId + "-likeModal");
                    console.log("Downloading likes");

                    const path = "/like/" + this.$props.docId;
                    const myInit = {
                        headers: {
                            Authorization: await this.$store.dispatch("fetchJwtToken")
                        },
                        queryStringParameters: {
                            loadAmount: 15,
                            coll: this.$props.coll
                        }
                    };

                    this.likes = (
                        await API.get(this.$store.state.apiName, path, myInit)
                    ).data.likes;

                    this.isLoadingLikes = false;
                } else {
                    this.$bvModal.show(this.$props.docId + "-likeModal");
                }
            }
        },

        expandComments: function() {
            this.commentsExpanded = !this.commentsExpanded;
        },

        expandFollows: async function() {
            if (this.followCount > 0 && !this.isLoadingFollows) {
                if (this.follows.length == 0) {
                    this.isLoadingFollows = true;
                    this.$bvModal.show(this.$props.docId + "-followModal");
                    console.log("Downloading follows");

                    const path = "/follow/" + this.$props.docId;
                    const myInit = {
                        headers: {
                            Authorization: await this.$store.dispatch("fetchJwtToken")
                        },
                        queryStringParameters: {
                            coll: this.$props.coll,
                            loadAmount: 15
                        }
                    };

                    this.follows = (
                        await API.get(this.$store.state.apiName, path, myInit)
                    ).data.follows;
                    this.isLoadingFollows = false;
                } else {
                    this.$bvModal.show(this.$props.docId + "-followModal");
                }
            }
        },

        addComment: function(comment) {
            this.comments.unshift(comment);
            this.commentCount++;
        },

        loadMoreComments: function() {
            // this.isLoadingMoreComments = true;

            // db.collection(this.$props.collection)
            //     .doc(this.$props.docId)
            //     .collection("comments")
            //     .orderBy("createdAt", "desc")
            //     .startAfter(this.lastLoadedComment)
            //     .limit(5)
            //     .get()
            //     .then(commentSnapshot => {
            //         commentSnapshot.forEach(comment => {
            //             let data = comment.data();
            //             data.id = comment.id;
            //             this.comments.push(data);
            //         });

            //         this.isLoadingMoreComments = false;
            //         this.lastLoadedComment = commentSnapshot.docs[commentSnapshot.size - 1];
            //     });
        }
    }
};
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

.align-center {
    align-self: center;
}
</style>
