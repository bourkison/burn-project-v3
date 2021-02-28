<template>
    <b-card no-body>
        <div v-if="!isLoading">
            <div v-if="imgUrls.length > 1">
                <b-carousel v-model="carouselModel" controls indicators :interval="0">
                    <b-aspect><b-carousel-slide v-for="img in imgUrls" :key="img" :img-src="img" /></b-aspect>
                </b-carousel>
            </div>
            <div v-else-if="imgUrls.length > 0">
                <b-img :src="imgUrls[0]" fluid-grow />
            </div>
            
            <b-card-body>
                <b-card-title><div><a @click="$router.push('/exercises/' + exerciseId)" class="componentLink">{{ exerciseData.name }}</a></div></b-card-title>
                <b-card-sub-title>{{ exerciseData.createdBy.username }}</b-card-sub-title>
                <Viewer :initialValue="exerciseData.description" />
            </b-card-body>
        </div>
        <div v-else>
            <b-card-body>
                <b-skeleton v-for="(index) in (Math.floor(Math.random() * 4) + 3)" :key="index" animation="wave" :width="(Math.floor(Math.random() * 50) + 50).toString() + '%'"></b-skeleton>
            </b-card-body>
        </div>
    </b-card>
</template>

<script>
import '@toast-ui/editor/dist/toastui-editor-viewer.css';

import { Viewer } from '@toast-ui/vue-editor';
import { db, storage } from '@/firebase'

export default {
    name: 'ExerciseComponent',
    components: { Viewer },
    props: {
        exerciseId: {
            required: true,
            type: String
        }
    },

    data() {
        return {
            isLoading: true,
            exerciseData: {},
            imgUrls: [],

            // Counters:
            likeCount: 0,
            commentCount: 0,
            followCount: 0,

            // Bootstrap:
            carouselModel: 0
        }
    },

    created: function() {
        // Download Exercise Data
        db.collection("exercises").doc(this.$props.exerciseId).get()
        .then(exerciseDoc => {
            this.exerciseData = exerciseDoc.data();
            this.exerciseData.id = exerciseDoc.id
            let imageDownloadPromises = [];

            this.exerciseData.filePaths.forEach(filePath => {
                imageDownloadPromises.push(storage.ref(filePath).getDownloadURL());
            })
            
            return Promise.all(imageDownloadPromises);
        })
        .then(imgUrls => {
            imgUrls.forEach(url => {
                this.imgUrls.push(url);
            })

            // Pull like, comment and follow count.
            return db.collection("exercises").doc(this.$props.exerciseId).collection("counters").get()
        })
        .then(counterSnapshot => {
            counterSnapshot.forEach(counterDoc => {
                this.likeCount += counterDoc.data().likeCount;
                this.commentCount += counterDoc.data().commentCount;
                this.followCount += counterDoc.data().followCount;
            })

            return this.checkIfUserLiked()
        })
        .then(() => {
            this.isLoading = false;
        })
        .catch(e => {
            console.warn("Error downloading exercise data", e);
        })
    },

    methods: {
        checkIfUserLiked: function() {
            return db.collection("users").doc(this.$store.state.userProfile.data.uid).collection("likes").where("id", "==", this.$props.exerciseId).get().then(likeSnapshot => {
                likeSnapshot.forEach(like => {
                    if (like.exists) {
                        this.isLiked = like.id;
                    }
                })
            })
        },
    },
}
</script>

<style>
.componentLink:hover {
    cursor: pointer;
}

</style>