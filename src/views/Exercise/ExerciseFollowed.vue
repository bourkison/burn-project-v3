<template>
    <b-container>
        <div v-if="exercises.length > 0 && !isLoading" class="mb-4">
            <ExerciseFeed class="exerciseFeed" :exercises="exercises" />

            <div class="text-center" v-if="moreToLoad">
                <b-button @click="loadMoreExercises" variant="outline-dark" size="sm" v-b-visible.200="loadMoreExercises">
                    <span v-if="!isLoadingMore">Load More</span>
                    <span v-else><b-spinner small /></span>
                </b-button>
            </div>
        </div>
        <div v-else-if="isLoading">
            <b-spinner />
        </div>
        <div v-else>
            <em>Looks like you haven't followed or created any exercises.</em>
        </div>
    </b-container>
</template>

<script>
import { db } from '@/firebase'
import { API } from 'aws-amplify'
import ExerciseFeed from '@/components/Exercise/ExerciseFeed.vue'

export default {
    name: 'ExerciseFollowed',
    components: { ExerciseFeed },
    data() {
        return {
            isLoading: true,
            exercises: [], // Exercises from user doc.

            // Lazy loading:
            isLoadingMore: true,
            moreToLoad: true,
            lastLoadedExercise: null,
        }
    },

    created: async function() {
        const path = '/exercise';
        const myInit = {
            headers: {
                Authorization: this.$store.state.userProfile.data.signInUserSession.idToken.jwtToken
            },
            queryStringParameters: {
                loadAmount: 5
            }
        }

        const response = await API.get(this.$store.state.apiName, path, myInit);
        this.exercises = response.data;

        if (this.exercises.length > 0) {
            this.isLoading = false;
        }

        console.log("API RESPONSE", response);
    },

    methods: {
        loadMoreExercises: function() {
            if (!this.isLoadingMore) {
                db.collection("users").doc(this.$store.state.userProfile.data.uid).collection("exercises").orderBy("createdAt", "desc").startAfter(this.lastLoadedExercise).limit(5).get()
                .then(exerciseSnapshot => {
                    exerciseSnapshot.forEach(exercise => {
                        this.exercises.push(exercise.id);
                    })

                    if (exerciseSnapshot.size < 5) {
                        this.moreToLoad = false;
                    }

                    setTimeout(() => { this.isLoadingMore = false }, 500);
                    this.lastLoadedExercise = exerciseSnapshot.docs[exerciseSnapshot.size - 1];
                })
                .catch(e => {
                    console.error("Error downloading more exercises:", e);
                })
            }
        }
    }
}
</script>

<style scoped>
.exerciseFeed {
    margin-top: 40px;
}
</style>