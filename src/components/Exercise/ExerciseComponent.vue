<template>
    <b-card no-body>
        <div v-if="!isLoading">
            <div v-if="exerciseData.filePaths.length > 1">
                <b-carousel v-model="carouselModel" controls indicators :interval="0">
                    <b-aspect><b-carousel-slide v-for="img in exerciseData.filePaths" :key="img" :img-src="img" /></b-aspect>
                </b-carousel>
            </div>
            <div v-else-if="exerciseData.filePaths.length > 0">
                <b-img :src="exerciseData.filePaths[0]" fluid-grow />
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
// import { db, storage } from '@/firebase'
import { API } from 'aws-amplify'

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

            // Bootstrap:
            carouselModel: 0
        }
    },

    created: async function() {
        const path = '/exercise/' + this.$props.exerciseId;
        const myInit = {
            headers: {
                Authorization: this.$store.state.userProfile.data.signInUserSession.idToken.jwtToken
            }
        }

        const response = await API.get(this.$store.state.apiName, path, myInit);
        this.exerciseData = response.data;

        if (this.exerciseData) {
            this.isLoading = false;
        }
    },
}
</script>

<style>
.componentLink:hover {
    cursor: pointer;
}

</style>