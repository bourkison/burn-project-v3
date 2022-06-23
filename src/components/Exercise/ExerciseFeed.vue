<template>
    <div v-if="!isLoading">
        <ExerciseComponent
            class="exercise"
            v-for="(exercise, index) in exercises"
            :exerciseId="exercise.exerciseId ? exercise.exerciseId : exercise._id"
            :key="exercise._id"
            :skeletonAmount="skeleton[index][0]"
            :skeletonWidth="skeleton[index][1]"
        />
    </div>
    <div v-else>
        <LoadingComponent
            class="exercise"
            v-for="(s, i) in skeleton"
            :key="i"
            :skeletonAmount="s[0]"
            :skeletonWidth="s[1]"
        />
    </div>
</template>

<script lang="ts">
import Vue, { PropType } from "vue"
import { ExerciseReference } from "@/types/exercise";

import ExerciseComponent from "@/components/Exercise/ExerciseComponent.vue";
import LoadingComponent from "@/components/Utility/LoadingComponent.vue";

type ExerciseFeedData = {
    skeleton: [number, string[]][]
}

export default Vue.extend({
    name: "ExerciseFeed",
    components: { ExerciseComponent, LoadingComponent },
    props: {
        exercises: {
            type: Array as PropType<ExerciseReference[]>,
            required: true
        },
        isLoading: {
            type: Boolean as PropType<boolean>,
            required: true
        }
    },
    data(): ExerciseFeedData {
        return {
            skeleton: []
        };
    },

    computed: {
        exerciseLength(): number {
            return this.exercises.length;
        }
    },

    created() {
        this.skeleton = JSON.parse(JSON.stringify(this.$store.state.exercises.exerciseSkeletons));
    },

    mounted() {
        this.$store.commit("exercises/emptySkeletons");
    },

    watch: {
        exerciseLength(n) {
            let len = this.skeleton.length;

            for (let i = 0; i < n - len; i++) {
                let amount = Math.floor(Math.random() * 4) + 3;
                let widths = [];

                for (let j = 0; j < amount; j++) {
                    widths.push((Math.floor(Math.random() * 50) + 50).toString() + "%");
                }
                this.skeleton.push([amount, widths]);
            }
        }
    }
});
</script>

<style scoped>
.exercise {
    margin-bottom: 25px;
}
</style>
