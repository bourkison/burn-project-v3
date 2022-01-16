<template>
    <b-list-group-item class="d-flex p-2" style="border:none;">
        <b-avatar
            :to="'/' + comment.createdBy.username"
            class="mr-2 mt-2"
            size="2rem"
            :src="comment.createdBy.profilePhoto"
        />
        <div style="width: 100%" class="bg-light rounded p-2">
            <div class="d-flex align-items-center">
                <router-link
                    :to="'/' + comment.createdBy.username"
                    class="text-dark font-weight-bold pl-1"
                    >{{ comment.createdBy.username }}</router-link
                >
                <b-dropdown class="ml-auto mr-2 comment-dropdown font-small" size="sm" variant="outline">
                    <span v-if="comment.createdBy.username === $store.state.userProfile.docData.username">
                        <b-dropdown-item class="comment-dropdown-item"><b-icon-pencil class="mr-1" /> Edit</b-dropdown-item>
                        <b-dropdown-item class="comment-dropdown-item" variant="danger" @click="confirmDeleteComment"
                            ><b-icon-trash class="mr-1" /> Delete</b-dropdown-item
                        >
                    </span>
                    <span v-else>
                        <b-dropdown-item class="comment-dropdown-item" @click="replyComment"><b-icon-reply class="mr-1" /> Reply</b-dropdown-item>
                        <b-dropdown-item class="comment-dropdown-item" variant="danger"><b-icon-exclamation class="mr-1" /> Report</b-dropdown-item>
                    </span>
                </b-dropdown>
            </div>
            <div class="content">{{ comment.content }}</div>
            <div class="like pl-1 pr-1 mt-2 mb-1 d-flex align-items-center">
                <b-icon-heart
                    v-if="!isLiked"
                    class="icon"
                    @click="toggleLike"
                    font-scale=".8"
                />
                <b-icon-heart-fill
                    v-else
                    variant="danger"
                    class="icon"
                    @click="toggleLike"
                    font-scale=".8"
                />
                <span class="ml-1 text-muted count" style="font-size:12px;" @click="expandLikes"
                    ><span v-if="!isLoading">{{ likeCount }}</span
                    ><span v-else>...</span>&nbsp;<span v-if="likeCount == 1">like</span
                    ><span v-else>likes</span></span
                >
                <span class="ml-auto text-muted" style="font-size: 12px;">
                    {{ createdAtText }}
                </span>
            </div>
        </div>

        <b-modal :id="comment._id + '-commentLikeModal'" centered ok-only>
            <template #modal-title>
                Likes
            </template>

            <div class="d-block">
                <div v-if="!isLoadingLikes">
                    <b-list-group>
                        <UserList
                            v-for="like in likes"
                            :key="like.createdBy.id"
                            :userData="like.createdBy"
                        />
                    </b-list-group>
                </div>
                <div v-else>
                    <b-spinner />
                </div>
            </div>
        </b-modal>

        <b-modal
            v-model="modalIsDeleting"
            title="Please confirm"
            @ok="deleteComment"
            ok-variant="danger"
            centered
            button-size="sm"
            :ok-title-html="isDeleting ? '<b-spinner />' : 'Ok'"
        >
            <div>
                Are you sure you want to delete this comment? This can not be undone.
            </div>

            <template #modal-footer="{ ok, cancel }">
                <b-button size="sm" @click="cancel">
                    <div>Cancel</div>
                </b-button>

                <b-button size="sm" variant="danger" @click="ok" :disabled="isDeleting">
                    <div v-if="!isDeleting">Ok</div>
                    <div v-else><b-spinner small /></div>
                </b-button>
            </template>
        </b-modal>
    </b-list-group-item>
</template>

<script lang="ts">
import Vue, { PropType } from "vue";
import { Comment } from "@/types/comment";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

import UserList from "@/components/User/UserList.vue";

export default Vue.extend({
    name: "Comment",
    components: { UserList },
    props: {
        comment: {
            type: Object as PropType<Comment>,
            required: true
        },
        coll: {
            type: String as PropType<string>,
            required: true
        },
        docId: {
            type: String as PropType<string>,
            required: true
        }
    },
    data() {
        return {
            isLoading: false,
            isLoadingLikes: false,
            isLiking: false,
            isLiked: false,
            likeCount: 0,

            isDeleting: false,

            likes: [],
            createdAtText: "...",

            // Bootstrap:
            modalIsDeleting: false
        };
    },

    created() {
        dayjs.extend(relativeTime);
        this.createdAtText = dayjs(this.comment.createdAt).fromNow();
        this.isLiked = this.comment.isLiked;
        this.likeCount = this.comment.likeCount;
    },

    methods: {
        async toggleLike() {
            if (!this.isLiking) {
                this.isLiking = true;

                const init = {
                    queryStringParameters: {
                        docId: this.docId,
                        coll: this.coll + "/comment",
                        commentId: this.comment._id
                    }
                };

                if (!this.isLiked) {
                    this.likeCount++;
                    this.isLiked = true;

                    try {
                        await this.$accessor.api.createLike({ init })
                        console.log("LIKED.");
                    }
                    catch (err) {
                        console.error("LIKING ERROR:", err);
                        this.likeCount--;
                        this.isLiked = false;
                    }
                    finally {
                        this.isLiking = false;
                    }
                } else {
                    this.likeCount--;
                    this.isLiked = false;

                    try {
                        await this.$accessor.api.deleteLike({ init })
                        console.log("UNLIKED.");
                    }
                    catch (err) {
                        this.likeCount++;
                        this.isLiked = true;
                        console.error("UNLIKING ERROR:", err);
                    }
                    finally {
                        this.isLiking = false;
                    }
                }
            }
        },

        expandLikes() {
            // if (this.likeCount > 0) {
            //     if (this.likes.length == 0) {
            //         this.isLoadingLikes = true;
            //         console.log("Downloading likes");

            //         db.collection(this.collection)
            //             .doc(this.docId)
            //             .collection("comments")
            //             .doc(this.comment.id)
            //             .collection("likes")
            //             .get()
            //             .then(likeSnapshot => {
            //                 likeSnapshot.forEach(like => {
            //                     this.likes.push(like.data());
            //                 });

            //                 this.isLoadingLikes = false;
            //                 console.log(this.likes);
            //                 this.$bvModal.show(this.comment._id + "-commentLikeModal");
            //             });
            //     } else {
            //         this.$bvModal.show(this.comment._id + "-commentLikeModal");
            //     }
            // }
        },

        confirmDeleteComment() {
            this.modalIsDeleting = true;
        },

        async deleteComment(e: any) {
            e.preventDefault();

            this.isDeleting = true;
            const init = {
                queryStringParameters: {
                    docId: this.docId,
                    coll: this.coll,
                    _id: this.comment._id
                }
            };

            try {
                await this.$accessor.api.deleteComment({ init });
                console.log("DELETED.");
            } catch (err) {
                console.error("ERROR DELETING COMMENT:", err);
            } finally {
                this.isDeleting = false;
                this.modalIsDeleting = false;
            }
        },

        replyComment() {
            this.$emit("replyComment", this.comment.createdBy.username);
        }
    }
});
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

.count:hover,
.reply:hover {
    text-decoration: underline;
    cursor: pointer;
}
</style>

<style>
.comment-dropdown-item a {
    font-size: 12px !important;
    padding-left: 0.75rem !important
}

.comment-dropdown button {
    box-shadow: none !important;
    padding: 0 !important;
}
</style>