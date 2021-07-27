<template>
    <div v-if="!isLoading">
        <b-container>
            <div v-if="createdExercises.length > 0">
                <h6>My Exercises</h6>
                <b-list-group class="exerciseLists">
                    <b-list-group-item
                        class="d-flex"
                        align-v="center"
                        v-for="exercise in createdExercises"
                        :key="exercise._id"
                        @click="addExercise(exercise)"
                        href="#"
                        :id="'exercise-' + exercise._id"
                    >
                        <span>{{ exercise.name }}</span>
                        <b-icon-plus font-scale="1.2" class="ml-auto" />
                    </b-list-group-item>
                </b-list-group>
            </div>
            <div v-if="followedExercises.length > 0">
                <h6>Followed Exercises</h6>
                <b-list-group class="exerciseLists">
                    <b-list-group-item
                        class="d-flex"
                        align-v="center"
                        v-for="exercise in followedExercises"
                        :key="exercise._id"
                        @click="addExercise(exercise)"
                        href="#"
                        :id="'exercise-' + exercise._id"
                    >
                        <span>{{ exercise.name }}</span>
                        <b-icon-plus font-scale="1.2" class="ml-auto" />
                    </b-list-group-item>
                </b-list-group>
            </div>
            <div v-if="selectedExercises.length > 0">
                <h6>Selected Exercises</h6>
                <b-list-group class="exerciseLists" id="selectedContainer">
                    <b-list-group-item
                        class="d-flex"
                        align-v="center"
                        v-for="exercise in selectedExercises"
                        :key="exercise._id"
                    >
                        <span>{{ exercise.name }}</span>
                        <span class="ml-auto" />
                        <b-icon-grip-horizontal
                            font-scale="1.2"
                            class="ml-auto sortableHandle clickableIcon"
                        />
                        <b-icon-x
                            font-scale="1.2"
                            variant="danger"
                            class="clickableIcon"
                            @click="removeExercise(exercise)"
                        />
                    </b-list-group-item>
                </b-list-group>
            </div>
        </b-container>
    </div>
    <div v-else>
        <b-spinner small />
    </div>
</template>

<script>
import { API } from "aws-amplify";
import Sortable from "sortablejs";

export default {
    name: "TemplateBuilder",
    props: {
        initExercises: {
            type: Array,
            required: false
        }
    },
    data() {
        return {
            isLoading: true,

            createdExercises: [],
            followedExercises: [],
            selectedExercises: [],

            sortable: null,
            sortableOptions: {
                handle: ".sortableHandle",
                animation: 300,
                onEnd: this.changeOrder
            }
        };
    },

    created: async function() {
        let exerciseDownloadPromises = [];

        let path = "/exercise";
        let myInit = {
            headers: {
                Authorization: this.$store.state.userProfile.data.idToken
                    .jwtToken
            },
            queryStringParameters: {
                loadAmount: 99
            }
        };

        const exerciseReferenceResponse = (
            await API.get(this.$store.state.apiName, path, myInit)
        ).data;

        exerciseReferenceResponse.forEach(exerciseReference => {
            path = "/exercise/" + exerciseReference.exerciseId;
            myInit = {
                headers: myInit.headers
            };

            console.log("EXERCISE REFERENCE:", exerciseReference);

            if (exerciseReference.isFollow) {
                exerciseDownloadPromises.push(
                    API.get(this.$store.state.apiName, path, myInit).then(
                        exerciseResponse => {
                            this.followedExercises.push(exerciseResponse.data);
                        }
                    )
                );
            } else {
                exerciseDownloadPromises.push(
                    API.get(this.$store.state.apiName, path, myInit).then(
                        exerciseResponse => {
                            this.createdExercises.push(exerciseResponse.data);
                        }
                    )
                );
            }
        });

        await Promise.all(exerciseDownloadPromises);

        // Once exercises are downloaded, check for initExercises.
        if (this.$props.initExercises) {
            let initExercisePromises = [];

            this.$props.initExercises.forEach(exercise => {
                // Check we haven't downloaded already (i.e. in followed or created exercises)
                let cIndex, fIndex;

                cIndex = this.createdExercises.findIndex(
                    x => x._id === exercise.exerciseId
                );

                if (cIndex < 0) {
                    fIndex = this.followedExercises.findIndex(
                        x => x._id === exercise.exerciseId
                    );
                }

                // If not, download.
                if (cIndex < 0 && fIndex < 0) {
                    path = "/exercise/" + exercise.exerciseId;
                    initExercisePromises.push(
                        API.get(this.$store.state.apiName, path, myInit).then(
                            result => {
                                return result.data;
                            }
                        )
                    );
                } else if (cIndex >= 0) {
                    initExercisePromises.push(
                        new Promise(resolve => {
                            resolve(this.createdExercises[cIndex]);
                        })
                    );
                } else {
                    initExercisePromises.push(
                        new Promise(resolve => {
                            resolve(this.followedExercises[fIndex]);
                        })
                    );
                }
            });

            const exercises = await Promise.all(initExercisePromises);

            if (exercises) {
                exercises.forEach(exercise => {
                    this.selectedExercises.push(exercise);
                    this.$nextTick(() => {
                        document
                            .querySelector("#exercise-" + exercise._id)
                            .classList.add("active");
                    });
                });
            }

            this.$nextTick(() => {
                this.sortable = new Sortable(
                    document.querySelector("#selectedContainer"),
                    this.sortableOptions
                );
                this.$props.initExercises.forEach(exercise => {
                    if (document.querySelector("#exercise-" + exercise._id)) {
                        document
                            .querySelector("#exercise-" + exercise._id)
                            .classList.add("active");
                    }
                });
            });
        }

        this.isLoading = false;
    },

    methods: {
        addExercise: function(exercise) {
            if (
                this.selectedExercises.findIndex(x => x._id === exercise._id) <
                0
            ) {
                document
                    .querySelector("#exercise-" + exercise._id)
                    .classList.add("active");
                this.selectedExercises.push(exercise);
            } else {
                this.removeExercise(exercise);
            }
        },

        removeExercise: function(exercise) {
            let index = this.selectedExercises.findIndex(
                x => x._id === exercise._id
            );
            this.selectedExercises.splice(index, 1);

            document
                .querySelector("#exercise-" + exercise._id)
                .classList.remove("active");
        },

        changeOrder: function(e) {
            console.log(e);
            if (e.newIndex !== e.oldIndex) {
                this.selectedExercises.splice(
                    e.newIndex,
                    0,
                    this.selectedExercises.splice(e.oldIndex, 1)[0]
                );
            }
        }
    },

    watch: {
        selectedExercises: function(n) {
            if (n.length > 0 && !this.sortable && !this.isLoading) {
                this.$nextTick(() => {
                    this.sortable = new Sortable(
                        document.querySelector("#selectedContainer"),
                        this.sortableOptions
                    );
                });
            } else if (n.length == 0 && this.sortable) {
                this.sortable = null;
            }

            this.$emit("updateExercises", this.selectedExercises);
        }
    }
};
</script>

<style scoped>
.exerciseLists {
    padding: 0 20px;
    margin: 15px 0;
}

.clickableIcon:hover {
    cursor: pointer;
}
</style>
