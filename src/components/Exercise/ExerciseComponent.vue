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
                <b-card-title><router-link :to="'/exercises/' + exerciseId">{{ exerciseData.name }}</router-link></b-card-title>
                <b-card-sub-title>{{ exerciseData.createdBy.username }}</b-card-sub-title>
                <Viewer :initialValue="exerciseData.description" />
            </b-card-body>
            <CommentSection :docId="exerciseData.id" collection="exercises" :followableComponent="true" />
        </div>
        <div v-else>
            <b-card-body>
                <b-skeleton v-for="(index) in (Math.floor(Math.random() * 4) + 3)" :key="index" animation="wave" :width="(Math.floor(Math.random() * 50) + 50).toString() + '%'"></b-skeleton>
            </b-card-body>
        </div>
    </b-card>
</template>

<script>
import '@toast-ui/editor/dist/toastui-editor-viewer.css'

import { Viewer } from '@toast-ui/vue-editor'
import { db, storage } from '@/firebase'

import CommentSection from '@/components/Comment/CommentSection.vue'

export default {
    name: 'ExerciseComponent',
    components: { CommentSection, Viewer },
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

            this.isLoading = false;
        })
        .catch(e => {
            console.warn("Error downloading exercise data", e);
        })
    },
}
</script>

<style>
.componentLink:hover {
    cursor: pointer;
}

</style>