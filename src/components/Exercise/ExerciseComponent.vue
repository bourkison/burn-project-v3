<template>
    <b-card no-body>
        <div v-if="!isLoading">
            <div v-if="imageUrls.length > 1">
                <b-carousel v-model="carouselModel" controls indicators :interval="0">
                    <b-aspect><b-carousel-slide v-for="img in imageUrls" :key="img" :img-src="img" /></b-aspect>
                </b-carousel>
            </div>
            <div v-else-if="imageUrls.length > 0">
                <b-img :src="imageUrls[0]" fluid-grow />
            </div>
            
            <b-card-body>
                <b-card-title><router-link :to="'/exercises/' + exerciseId">{{ exerciseData.name }}</router-link></b-card-title>
                <b-card-sub-title>{{ exerciseData.createdBy.username }}</b-card-sub-title>
                <Viewer :initialValue="exerciseData.description" />
            </b-card-body>
            <CommentSection :_id="exerciseData._id" coll="exercise" :followableComponent="true" />
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
// import { db, storage } from '@/firebase'
import { API, Storage } from 'aws-amplify'

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
            imageUrls: [],

            // Bootstrap:
            carouselModel: 0
        }
    },

    created: async function() {
        try {
            const path = '/exercise/' + this.$props.exerciseId;
            const myInit = {
                headers: {
                    Authorization: this.$store.state.userProfile.data.idToken.jwtToken
                }
            }
    
            const response = await API.get(this.$store.state.apiName, path, myInit);
            this.exerciseData = response.data;

            try {
                if (this.exerciseData.filePaths) {
                    let urlPromises = [];

                    this.exerciseData.filePaths.forEach(path => {
                        urlPromises.push(Storage.get(path))
                    })

                    const imageUrls = await Promise.all(urlPromises);

                    imageUrls.forEach(url => {
                        this.imageUrls.push(url);
                    })
                }
            }
            catch (err) {
                console.error("Error getting image URLs:", err);
            }
            finally {
                if (this.exerciseData) {
                    this.isLoading = false;
                }
            }

        }
        catch (err) {
            console.error("Error downloading exercise:", this.$props.exerciseId, err);
        }
    },
}
</script>

<style>
.componentLink:hover {
    cursor: pointer;
}

</style>