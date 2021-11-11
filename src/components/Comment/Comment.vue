<template>
    <b-list-group-item class="d-flex p-2" style="border:none;">
        <b-avatar
            :to="'/' + comment.createdBy.username"
            class="mr-2 mt-2"
            size="2rem"
            :src="comment.createdBy.profilePhoto"
        />
        <div style="width: 100%" class="bg-light rounded p-2">
            <div>
                <router-link
                    :to="'/' + comment.createdBy.username"
                    class="text-dark font-weight-bold"
                    >{{ comment.createdBy.username }}</router-link
                >
                <b-dropdown class="float-right" variant="outline">
                    <span v-if="comment.createdBy.id === $store.state.userProfile.data.uid">
                        <b-dropdown-item>Edit</b-dropdown-item>
                        <b-dropdown-item variant="danger" @click="confirmDeleteComment"
                            >Delete</b-dropdown-item
                        >
                    </span>
                </b-dropdown>
            </div>
            <div class="content">{{ comment.content }}</div>
            <div class="like pl-1 pr-1 d-flex">
                <div align-v="center">
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
                </div>
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

<script>
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { API } from "aws-amplify";

import UserList from "@/components/User/UserList.vue";

export default {
    name: "Comment",
    components: { UserList },
    props: {
        comment: {
            type: Object,
            required: true
        },
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

    created: function() {
        dayjs.extend(relativeTime);
        this.createdAtText = dayjs(this.$props.comment.createdAt).fromNow();
        this.isLiked = this.$props.comment.isLiked;
        this.likeCount = this.$props.comment.likeCount;
    },

    methods: {
        toggleLike: async function() {
            if (!this.isLiking) {
                this.isLiking = true;

                const path = "/like";
                const myInit = {
                    headers: {
                        Authorization: this.$store.state.userProfile.data.idToken.jwtToken
                    },
                    queryStringParameters: {
                        docId: this.$props.docId,
                        coll: this.$props.coll + "/comment",
                        commentId: this.$props.comment._id
                    }
                };

                if (!this.isLiked) {
                    console.log("LIKING:", myInit);

                    this.likeCount++;
                    this.isLiked = true;

                    try {
                        const likeResponse = await API.post(
                            this.$store.state.apiName,
                            path,
                            myInit
                        );
                        console.log("LIKED:", likeResponse);
                    } catch (err) {
                        console.error("LIKING ERROR:", err);
                        this.likeCount--;
                        this.isLiked = false;
                    } finally {
                        this.isLiking = false;
                    }
                } else {
                    console.log("UNLIKING", myInit);
                    this.likeCount--;
                    this.isLiked = false;

                    try {
                        const likeResponse = await API.del(this.$store.state.apiName, path, myInit);
                        console.log("UNLIKED:", likeResponse);
                    } catch (err) {
                        this.likeCount++;
                        this.isLiked = true;
                        console.error("UNLIKING ERROR:", err);
                    } finally {
                        this.isLiking = false;
                    }
                }
            }
        },

        expandLikes: function() {
            // if (this.likeCount > 0) {
            //     if (this.likes.length == 0) {
            //         this.isLoadingLikes = true;
            //         console.log("Downloading likes");

            //         db.collection(this.$props.collection)
            //             .doc(this.$props.docId)
            //             .collection("comments")
            //             .doc(this.$props.comment.id)
            //             .collection("likes")
            //             .get()
            //             .then(likeSnapshot => {
            //                 likeSnapshot.forEach(like => {
            //                     this.likes.push(like.data());
            //                 });

            //                 this.isLoadingLikes = false;
            //                 console.log(this.likes);
            //                 this.$bvModal.show(this.$props.comment._id + "-commentLikeModal");
            //             });
            //     } else {
            //         this.$bvModal.show(this.$props.comment._id + "-commentLikeModal");
            //     }
            // }
        },

        confirmDeleteComment: function() {
            this.modalIsDeleting = true;
        },

        deleteComment: async function(e) {
            e.preventDefault();

            this.isDeleting = true;

            const path = "/comment";
            const myInit = {
                headers: {
                    Authorization: this.$store.state.userProfile.data.idToken.jwtToken
                },
                queryStringParameters: {
                    docId: this.$props.docId,
                    coll: this.$props.coll,
                    _id: this.$props.comment._id
                }
            };

            try {
                const delCommentResponse = await API.del(this.$store.state.apiName, path, myInit);
                console.log("DELETED:", delCommentResponse);
            } catch (err) {
                console.error("ERROR DELETING COMMENT:", err);
            } finally {
                this.isDeleting = false;
                this.modalIsDeleting = false;
            }
        }
    }
};
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
