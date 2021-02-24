<template>
    <b-card no-body>
        <div v-if="!isLoading">
            <div v-if="imgUrls.length > 1">
                <b-carousel v-model="carouselModel" controls indicators :interval="0">
                    <b-aspect><b-carousel-slide v-for="img in imgUrls" :key="img" :img-src="img" /></b-aspect>
                </b-carousel>
            </div>
            <div v-else-if="imgUrls.length > 0">
                <img :src="imgUrls[0]" />
            </div>
            
            <b-card-body>
                <b-card-title @click="$router.push('/exercises/' + exerciseId)">{{ exerciseData.name }}</b-card-title>
                <b-card-text class="exerciseDescription" v-html="compiledMarkdown"></b-card-text>
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
import * as marked from 'marked'
import { db, storage } from '@/firebase'

export default {
    name: 'ViewExerciseMin',
    components: {},
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

    computed: {
        compiledMarkdown: function() {
            return marked(this.exerciseData.description);
        }
    },

    created: function() {
        console.log(this.$props.exerciseId);
        // Download Exercise Data
        db.collection("exercises").doc(this.$props.exerciseId).get()
        .then(exerciseDoc => {
            this.exerciseData = exerciseDoc.data();
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
            counterSnapshot.forEach(counter => {
                this.likeCount += counter.data().likeCount;
                this.commentCount += counter.data().commentCount;
                this.followCount += counter.data().followCount;
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
.exerciseDescription h1 {
    font-size: 1.5rem;
}

.exerciseDescription h2 {
    font-size: 1.4rem;
}

.exerciseDescription h3 {
    font-size: 1.3rem;
}

.exerciseDescription h4 {
    font-size: 1.2rem;
}

.exerciseDescription h5 {
    font-size: 1.1rem;
}

.exerciseDescription h6 {
    font-size: 1;
}

</style>