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
                        :key="exercise.exerciseId"
                        @click="addExercise(exercise)"
                        href="#"
                        :id="'exercise-' + exercise.exerciseId"
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
                        :key="exercise.exerciseId"
                        @click="addExercise(exercise)"
                        href="#"
                        :id="'exercise-' + exercise.exerciseId"
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
                        :key="exercise.exerciseId"
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

<script lang="ts">
import Vue, { PropType } from "vue";
import { IExerciseReference } from "@/types";

import Sortable, { SortableOptions, SortableEvent } from "sortablejs";

interface TemplateBuilderData {
    isLoading: boolean;
    createdExercises: IExerciseReference[];
    followedExercises: IExerciseReference[];
    selectedExercises: IExerciseReference[];
    sortable: Sortable | undefined;
    sortableOptions: SortableOptions | undefined;
}

export default Vue.extend({
    name: "TemplateBuilder",
    props: {
        initExercises: {
            type: Array as PropType<IExerciseReference[]>,
            required: false
        }
    },
    data(): TemplateBuilderData {
        return {
            isLoading: true,

            createdExercises: [],
            followedExercises: [],
            selectedExercises: [],

            sortable: undefined,
            sortableOptions: {
                handle: ".sortableHandle",
                animation: 300,
            }
        };
    },

    async mounted() {
        this.sortableOptions.onEnd = (e: SortableEvent): void => {
            console.log(e);
            if (e.newIndex !== e.oldIndex) {
                if (this !== undefined) {
                    this.selectedExercises.splice(
                        e.newIndex,
                        0,
                        this.selectedExercises.splice(e.oldIndex, 1)[0]
                    );
                }   
            }
        }

        const exerciseReferenceResponse: IExerciseReference[] = await this.$accessor.api.queryExercise({ init: { queryStringParameters: { loadAmount: 99, user: true }}})

        exerciseReferenceResponse.forEach(exerciseReference => {
            if (exerciseReference.isFollow) {
                this.followedExercises.push(exerciseReference);
            } else {
                this.createdExercises.push(exerciseReference);
            }
        });

        // Once exercises are downloaded, check for initExercises.
        if (this.initExercises) {
            let initExercisePromises: Promise<IExerciseReference>[] = [];

            this.initExercises.forEach(exercise => {
                // Check we haven't downloaded already (i.e. in followed or created exercises)
                let cIndex: number, fIndex: number;

                cIndex = this.createdExercises.findIndex(x => x.exerciseId === exercise.exerciseId);

                if (cIndex < 0) {
                    fIndex = this.followedExercises.findIndex(x => x.exerciseId === exercise.exerciseId);
                } else {
                    fIndex = -1;
                }

                // If not, download.
                if (cIndex < 0 && fIndex < 0) {
                    initExercisePromises.push(new Promise(async (resolve) => {
                        const e = await this.$accessor.api.getExercise({ exerciseId: exercise.exerciseId, init: {} });
                        resolve({
                            exerciseId: e._id,
                            name: e.name,
                            muscleGroups: e.muscleGroups,
                            tags: e.tags,
                            createdBy: e.createdBy,
                            createdAt: e.createdAt
                        })
                    }));
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
                        const exerciseEl = document.getElementById("exercise-" + exercise.exerciseId);
                        if (exerciseEl) exerciseEl.classList.add("active")
                    });
                });
            }

            this.$nextTick(() => {
                const cont = document.getElementById("selectedContainer");
                if (cont && this.sortableOptions) {
                    this.sortable = new Sortable(
                        cont,
                        this.sortableOptions
                    );
                    this.initExercises.forEach(exercise => {
                        const exerciseEl = document.getElementById("exercise-" + exercise.exerciseId);
                        if (exerciseEl) exerciseEl.classList.add("active");
                    });
                }
            });
        }

        this.isLoading = false;
    },

    methods: {
        addExercise(exercise: IExerciseReference): void {
            if (this.selectedExercises.findIndex(x => x.exerciseId === exercise.exerciseId) < 0) {
                const exerciseEl = document.getElementById("exercise-" + exercise.exerciseId);
                console.log("ADDED:", exerciseEl);
                if (exerciseEl) exerciseEl.classList.add("active");
                this.selectedExercises.push(exercise);
            } else {
                this.removeExercise(exercise);
            }
        },

        removeExercise(exercise: IExerciseReference): void {
            let index = this.selectedExercises.findIndex(x => x.exerciseId === exercise.exerciseId);
            if (index) {
                this.selectedExercises.splice(index, 1);
                const exerciseEl = document.getElementById("exercise-" + exercise.exerciseId);
                if (exerciseEl) exerciseEl.classList.remove("active");
            } else {
                console.warn("Exercise index not found");
            }
        },
    },

    watch: {
        selectedExercises(n: IExerciseReference[]) {
            if (n.length > 0 && !this.sortable && !this.isLoading) {
                this.$nextTick(() => {
                    const cont = document.getElementById("selectedContainer");
                    if (cont && this.sortableOptions) {
                        this.sortable = new Sortable(
                            cont,
                            this.sortableOptions
                        );
                    }
                });
            } else if (n.length == 0 && this.sortable) {
                this.sortable = undefined;
            }

            this.$emit("updateExercises", this.selectedExercises);
        }
    }
});
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
