<template>
    <b-card no-body>
        <div v-if="!isLoading">
            <b-card-body>
                <b-card-title><a @click="$router.push('/workouts/' + workoutId)" class="componentLink">{{ workoutData.name }}</a></b-card-title>
                <b-card-sub-title>{{ workoutData.createdBy.username }}</b-card-sub-title>
                <b-card-text>
                    <div :id="workoutData.id + 'accordion'" class="accordion exerciseExpandableCont" role="tablist">
                        <ExerciseExpandable v-for="(exercise, index) in workoutData.exercises" :exercise="exercise" :accordionIndex="index" :workoutId="workoutData.id" :key="exercise.id" :lazy="true" />
                    </div>
                </b-card-text>
                <Viewer :initialValue="workoutData.description"/>
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

import { Viewer } from '@toast-ui/vue-editor'
import { db } from '@/firebase'

import ExerciseExpandable from '@/components/Exercise/ExerciseExpandable.vue'

export default {
    name: 'WorkoutComponent',
    components: { Viewer, ExerciseExpandable },
    props: {
        workoutId: {
            required: true,
            type: String
        }
    },

    data() {
        return {
            isLoading: true,
            workoutData: {},

            likeCount: 0,
            commentCount: 0,
            followCount: 0,
            isLiked: ''
        }
    },

    created: function() {
        db.collection("workouts").doc(this.$props.workoutId).get()
        .then(workoutDoc => {
            this.workoutData = workoutDoc.data();
            this.workoutData.id = workoutDoc.id;

            // Pull like, comment and follow count.
            return db.collection("workouts").doc(this.$props.workoutId).collection("counters").get()
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
            console.error("Error downloading workout data", e);
        })
    },

    methods: {
        checkIfUserLiked: function() {
            return db.collection("users").doc(this.$store.state.userProfile.data.uid).collection("likes").where("id", "==", this.$props.workoutId).get().then(likeSnapshot => {
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

<style scoped>
.exerciseExpandableCont {
    padding: 20px;
}

.componentLink:hover {
    cursor: pointer;
}
</style>