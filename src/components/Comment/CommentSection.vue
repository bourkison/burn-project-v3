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
                <span class="ml-auto text-muted no-select">
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
                             @replyComment="replyComment"
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
                <CommentNew @addComment="addComment" :coll="coll" :docId="docId" :replyingTo="replyingTo" @replied="replyComment('')" />
            </b-container>
        </b-collapse>

        <b-modal v-model="likeModal" centered ok-only button-size="sm" hide-footer>
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

        <b-modal v-model="followModal" centered ok-only button-size="sm" hide-footer>
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

<script lang="ts">
import Vue, { PropType } from "vue";
import { Like, Follow } from "@/types";
import { Comment as TComment } from "@/types/comment";

import UserList from "@/components/User/UserList.vue";

import Comment from "@/components/Comment/Comment.vue";
import CommentNew from "@/components/Comment/CommentNew.vue";

export default Vue.extend({
    name: "CommentSection",
    components: { UserList, Comment, CommentNew },
    props: {
        docId: {
            type: String as PropType<string>,
            required: true
        },
        coll: {
            type: String as PropType<string>,
            required: true
        },
        followableComponent: {
            type: Boolean as PropType<boolean>,
            required: true
        },
        likeCount: {
            type: Number as PropType<number>,
            required: true
        },
        commentCount: {
            type: Number as PropType<number>,
            required: true
        },
        isLiked: {
            type: Boolean as PropType<boolean>,
            required: true
        },
        followCount: {
            type: Number as PropType<number>,
            required: false
        },
        isFollowed: {
            type: Boolean as PropType<boolean>,
            required: false
        },
        isFollowable: {
            type: Boolean as PropType<boolean>,
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

            likes: [] as Like[],
            comments: [] as TComment[],
            follows: [] as Follow[],

            lastLoadedComment: null,

            replyingTo: "",
            likeModal: false,
            followModal: false
        };
    },

    async mounted() {
        // Get most recent comments and comment count.
        this.isLoadingComments = true;

        let init = {
            queryStringParameters: {
                coll: this.coll,
                loadAmount: 5
            }
        };

        this.comments = await this.$accessor.api.queryComment({ docId: this.docId, init })
        this.isLoadingComments = false;
    },

    methods: {
        async toggleLike() {
            // Check we're not already in the process of liking.
            if (!this.isLiking) {
                this.isLiking = true;
                const init = {
                    queryStringParameters: {
                        docId: this.docId,
                        coll: this.coll
                    }
                };

                // Check to see if we like or unlike.
                if (!this.isLiked) {
                    // Add like.
                    console.log("LIKING...");
                    this.$emit("like");

                    try {
                        await this.$accessor.api.createLike({ init })
                        console.log("LIKED.");
                    }
                    catch (err) {
                        console.error("Liking error", err);
                        this.$emit("unlike");
                    }
                    finally {
                        this.isLiking = false;
                    }
                } else {
                    console.log("UNLIKING...");
                    this.$emit("unlike");

                    try {
                        this.$accessor.api.deleteLike({ init });
                        console.log("UNLIKED.");
                    }
                    catch (err) {
                        console.error("Unliking error", err);
                        this.$emit("like");
                    }
                    finally {
                        this.isLiking = false;
                    }
                }
            }
        },

        async toggleFollow() {
            if (this.isFollowable && !this.isFollowing) {
                this.isFollowing = true;
                const init = {
                    queryStringParameters: {
                        docId: this.docId,
                        coll: this.$props.coll
                    }
                };

                if (!this.isFollowed) {
                    this.$emit("follow");

                    try {
                        await this.$accessor.api.createFollow({ init });
                        console.log("FOLLOWED.");
                    }
                    catch (err) {
                        console.error("Following error", err);
                        this.$emit("unfollow");
                    }
                    finally {
                        this.isFollowing = false;
                    }
                } else {
                    // Unfollow.
                    this.$emit("unfollow");

                    try {
                        this.$accessor.api.deleteFollow({ init });
                        console.log("UNFOLLOWED.");
                    }
                    catch (err) {
                        this.$emit("follow");
                        console.error("Unfollowing error", err);
                    }
                    finally {
                        this.isFollowing = false;
                    }

                    console.log("UNFOLLOW");
                }
                // document.activeElement.blur();
            }
        },

        async expandLikes() {
            if (this.likeCount > 0 && !this.isLoadingLikes) {
                if (this.likes.length === 0) {
                    this.isLoadingLikes = true;
                    this.likeModal = true;
                    console.log("Downloading likes");

                    const init = {
                        queryStringParameters: {
                            loadAmount: 15,
                            coll: this.$props.coll
                        }
                    };

                    this.likes = await this.$accessor.api.queryLike({ docId: this.docId, init });

                    this.isLoadingLikes = false;
                } else {
                    this.likeModal = true;
                }
            }
        },

        expandComments() {
            this.commentsExpanded = !this.commentsExpanded;
        },

        async expandFollows() {
            if (this.followCount > 0 && !this.isLoadingFollows) {
                if (this.follows.length == 0) {
                    this.isLoadingFollows = true;
                    this.followModal = true;
                    console.log("Downloading follows");

                    const init = {
                        queryStringParameters: {
                            coll: this.$props.coll,
                            loadAmount: 15
                        }
                    };

                    this.follows = await this.$accessor.api.queryFollow({ docId: this.docId, init });
                    this.isLoadingFollows = false;
                } else {
                    this.followModal = true;
                }
            }
        },

        addComment(comment: TComment) {
            this.comments.unshift(comment);
            this.$emit("addComment")
        },

        loadMoreComments() {
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
        },

        replyComment(username: string) {
            console.log("REPLY:", username);
            this.replyingTo = username;
        }
    }
});
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

.no-select {
  -webkit-touch-callout: none; /* iOS Safari */
    -webkit-user-select: none; /* Safari */
     -khtml-user-select: none; /* Konqueror HTML */
       -moz-user-select: none; /* Old versions of Firefox */
        -ms-user-select: none; /* Internet Explorer/Edge */
            user-select: none; /* Non-prefixed version, currently
                                  supported by Chrome, Edge, Opera and Firefox */
}
</style>
