<template>
    <div v-if="!isLoading">
        <ExerciseComponent class="exercise" v-for="(exercise, index) in exercises" :exerciseId="exercise.exerciseId ? exercise.exerciseId : exercise._id" :key="exercise._id" :skeletonAmount="skeleton[index][0]" :skeletonWidth="skeleton[index][1]" />
    </div>
    <div v-else>
        <LoadingComponent class="exercise" v-for="(s, i) in skeleton" :key="i" :skeletonAmount="s[0]" :skeletonWidth="s[1]" />
    </div>
</template>

<script>
import ExerciseComponent from '@/components/Exercise/ExerciseComponent.vue'
import LoadingComponent from '@/components/Utility/LoadingComponent.vue'

export default {
    name: 'ExerciseFeed',
    components: { ExerciseComponent, LoadingComponent },
    props: {
        exercises: {
            required: true,
            type: Array
        },
        isLoading: {
            required: true,
            type: Boolean
        }
    },
    data() {
        return {
            skeleton: [],
            loadAmount: 5
        }
    },

    created: function() {
        for (let i = 0; i < this.loadAmount; i ++) {
            let amount = (Math.floor(Math.random() * 4) + 3);
            let widths = [];

            for (let j = 0; j < amount; j ++) {
                widths.push((Math.floor(Math.random() * 50) + 50).toString() + '%');
            }
            this.skeleton.push([amount, widths]);
        }
    }


}
</script>

<style scoped>
    .exercise {
        margin-bottom: 25px;
    }
</style>