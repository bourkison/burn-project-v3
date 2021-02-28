<template>
    <b-card no-body class="mb-1 exerciseExpandableItem">
        <b-card-header header-tag="header" class="p-1" role="tab">
            <b-button block v-b-toggle="workoutId + '_' + accordionIndex + '_accordion'" variant="outlined" class="d-flex" size="sm">
                {{ exercise.name }}
                <strong v-if="isVisible" aria-hidden="true" class="ml-auto">-</strong>
                <strong v-else aria-hidden="true" class="ml-auto">+</strong>
            </b-button>
        </b-card-header>

        <b-collapse :id="workoutId + '_' + accordionIndex + '_accordion'" accordion="my-accordion" role="tabpanel" v-model="isVisible">
            <b-card-body>
                <div v-if="!isLoading">
                    <Viewer :initialValue="exerciseData.description" />
                </div>
                <div v-else class="text-center">
                    <b-spinner small />
                </div>
            </b-card-body>
        </b-collapse>
    </b-card>
</template>

<script>
import { Viewer } from '@toast-ui/vue-editor'
import { db } from '@/firebase'

export default {
    name: 'ExerciseExpandable',
    components: { Viewer },
    props: {
        exercise: {
            type: Object,
            required: true
        },
        accordionIndex: {
            type: Number,
            required: true
        },
        workoutId: {
            type: String,
            required: true
        },
        lazy: {
            type: Boolean,
            required: true
        }
    },

    data() {
        return {
            exerciseData: {},
            isLoading: true,

            isVisible: false
        }
    },

    created: function() {
        if (!this.$props.lazy) {
            this.downloadData();
        }
    },

    methods: {
        downloadData: function() {
            db.collection("exercises").doc(this.$props.exercise.id).get()
            .then(exerciseDoc => {
                this.exerciseData = exerciseDoc.data();
                this.exerciseData.id = exerciseDoc.id;

                this.isLoading = false;
            })
        }
    },

    watch: {
        isVisible: function() {
            // Download data if we havent already and user has expanded.
            if (this.isVisible && this.isLoading) {
                this.downloadData();
            }
        }
    }
}
</script>

<style scoped>
.exerciseExpandableItem {
    margin-bottom: 0 !important;
}
</style>