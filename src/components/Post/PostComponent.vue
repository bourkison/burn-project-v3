<template>
    <b-card no-body header-bg-variant="transparent">
        <!-- Header -->
        <template #header>
            <div v-if="!isLoading" class="d-flex alignHeader" align-v="center">
                <b-avatar :to="'/' + postData.createdBy.username" size="1.5rem" class="mr-1 disableAvatarHover" :src="postData.createdBy.profilePhoto" />
                <span><router-link :to="'/' + postData.createdBy.username" class="text-dark username">{{ postData.createdBy.username }}</router-link>&#32;&nbsp; </span>
                <span class="ml-1" v-if="postData.share.type">
                    <span v-if="postData.share.type == 'exercise'">&nbsp;shared an <router-link :to="'/exercises/'+ postData.share.id">exercise</router-link>.</span>
                    <span v-if="postData.share.type == 'workout'">&nbsp;shared a <router-link :to="'/workouts/'+ postData.share.id">workout</router-link>.</span>
                    <span v-if="postData.share.type == 'burn'">&nbsp;shared a burn.</span>
                </span>
            </div>
            <div v-else>
                Loading...
            </div>
        </template>


        <!-- Content -->
        <div v-if="!isLoading">
            <div v-if="imgUrls.length > 1">
                <b-carousel v-model="carouselModel" controls indicators :interval="0">
                    <b-aspect><b-carousel-slide v-for="img in imgUrls" :key="img" :img-src="img"/></b-aspect>
                </b-carousel>
            </div>
            <div v-else-if="imgUrls.length > 0">
                <img :src="imgUrls[0]" />
            </div>

            <b-card-body>
                <b-card-text>
                    <div v-if="postData.share.type" class="mb-3">
                        <div v-if="postData.share.type == 'exercise'">
                            <ExerciseShare :exerciseId="postData.share.id" />
                        </div>

                        <div v-else-if="postData.share.type == 'workout'">
                            <WorkoutShare :workoutId="postData.share.id" />
                        </div>
                    </div>
                    {{ postData.content }}
                </b-card-text>
            </b-card-body>
            <CommentSection :docId="postData.id" collection="posts" :followableComponent="false" />
        </div>
        <div v-else>
            <b-card-body>
                <b-skeleton v-for="(index) in (Math.floor(Math.random() * 4) + 3)" :key="index" animation="wave" :width="(Math.floor(Math.random() * 50) + 50).toString() + '%'"></b-skeleton>
            </b-card-body>
        </div>
    </b-card>
</template>

<script>
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'

import CommentSection from '@/components/Comment/CommentSection.vue'

import ExerciseShare from '@/components/Exercise/ExerciseShare.vue'
import WorkoutShare from '@/components/Workout/WorkoutShare.vue'

import { db, storage } from '@/firebase'

export default {
    name: 'PostComponent',
    components: { CommentSection, ExerciseShare, WorkoutShare },
    props: {
        postId: {
            required: true,
            type: String
        }
    },

    data() {
        return {
            isLoading: true,
            postData: {},
            imgUrls: [],

            // Bootstrap:
            carouselModel: 0
        }
    },

    created: function() {
        dayjs.extend(relativeTime);
    },

    mounted: function() {
        db.collection("posts").doc(this.$props.postId).get()
        .then(postDoc => {
            this.postData = postDoc.data();
            this.postData.id = postDoc.id;

            if (this.postData.filePaths.length > 0) {
                let imageDownloadPromises = [];
                
                this.postData.filePaths.forEach(imgPath => {
                    imageDownloadPromises.push(storage.ref(imgPath).getDownloadURL());
                })

                return Promise.all(imageDownloadPromises).then(imgUrls => {
                    imgUrls.forEach(url => {
                        this.imgUrls.push(url);
                    })
                })
            }
        })
        .then(() => {
            this.isLoading = false;
            this.createdAtText = dayjs(dayjs.unix(this.postData.createdAt.seconds)).fromNow();
        })
        .catch(e => {
            console.error("Error downloading post:", e);
            this.isLoading = false;
        })
    }
}
</script>

<style scoped>
.username {
    font-weight: 600;
}

.alignHeader {
    margin-left: -5px;
}
</style>

<style>
.disableAvatarHover img {
    transform: none !important;
}
</style>