<template>
    <b-container>
        <b-card no-body class="mb-1 exerciseExpandableItem">
            <b-card-header header-tag="header" class="p-1" role="tab">
                <b-button
                    block
                    variant="outlined"
                    class="d-flex"
                    size="sm"
                    @click="isVisible = !isVisible"
                >
                    <span v-if="!isLoading">{{ exercise.name }}</span>
                    <span v-else><b-spinner small/></span>
                    <strong v-if="isVisible" aria-hidden="true" class="ml-auto"
                        >-</strong
                    >
                    <strong v-else aria-hidden="true" class="ml-auto">+</strong>
                </b-button>
            </b-card-header>

            <b-collapse v-model="isVisible">
                <b-card-body>
                    <div v-if="!isLoading">
                        <Viewer :initialValue="exercise.description" />
                    </div>
                    <div v-else class="text-center">
                        <b-spinner small />
                    </div>
                </b-card-body>
            </b-collapse>
        </b-card>
    </b-container>
</template>

<script>
import { Viewer } from "@toast-ui/vue-editor";
import { API } from 'aws-amplify'

export default {
    name: "ExerciseShare",
    components: { Viewer },
    props: {
        exerciseId: {
            type: String,
            required: true
        }
    },
    data() {
        return {
            isLoading: true,
            exercise: {},

            // Bootstrap:
            isVisible: false
        };
    },

    created: function() {
        this.downloadExercise();
    },

    methods: {
        downloadExercise: async function() {
            this.isLoading = true;

            const path = "/exercise/" + this.$props.exerciseId;
            const myInit = {
                headers: {
                    Authorization: this.$store.state.userProfile.data.idToken.jwtToken
                }
            }

            try {
                this.exercise = (await API.get(this.$store.state.apiName, path, myInit)).data;
            }
            catch(err) {
                console.error(err);
            }
            finally {
                this.isLoading = false;
            }
        }
    },

    watch: {
        exerciseId: function() {
            this.downloadExercise();
        }
    }
};
</script>
