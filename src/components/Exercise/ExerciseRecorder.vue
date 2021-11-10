<template>
    <b-card no-body class="mt-2">
        <b-card-body>
            <div class="d-flex">
                <h6>{{ exercise.exerciseReference.name }}</h6>
                <div class="ml-auto">
                    <b-icon-chevron-expand
                        v-if="!setsExpanded"
                        @click="setsExpanded = !setsExpanded"
                        class="mr-1 clickableIcon"
                    />
                    <b-icon-chevron-contract
                        v-else
                        @click="setsExpanded = !setsExpanded"
                        class="mr-1 clickableIcon"
                    />
                    <b-icon-grip-horizontal class="sortableIcon mr-1" />
                    <b-icon-trash @click="removeExercise" class="clickableIcon" />
                </div>
            </div>
        </b-card-body>

        <b-collapse v-model="setsExpanded">
            <div class="pl-4 pr-4">
                <b-form-textarea
                    v-model="exercise.notes"
                    rows="2"
                    no-resize
                    :placeholder="notesPlaceholder"
                ></b-form-textarea>
            </div>

            <b-list-group flush class="sortableContainer mt-2">
                <b-list-group-item>
                    <b-row class="d-flex text-center" align-v="center">
                        <b-col sm="5" style="font-weight:600;"><span>Previous</span></b-col>
                        <b-col sm="3" style="font-weight:600;"><span>Kg</span></b-col>
                        <b-col sm="3" style="font-weight:600;"><span>Reps</span></b-col>
                        <b-col sm="1"><span style="visibility:hidden;">x</span></b-col>
                    </b-row>
                </b-list-group-item>

                <b-list-group-item v-for="(set, index) in exercise.sets" :key="index">
                    <b-form inline>
                        <b-row class="d-flex" align-v="center">
                            <b-col sm="5">
                                <div
                                    v-if="
                                        previousExerciseStored &&
                                            previousExercise &&
                                            previousExerciseStored.sets[index]
                                    "
                                    class="text-muted text-center"
                                >
                                    {{ previousExerciseStored.sets[index].kg }}kg x
                                    {{ previousExerciseStored.sets[index].measureAmount }}
                                </div>
                                <div v-else class="text-muted text-center">
                                    -
                                </div>
                            </b-col>
                            <b-col sm="3" class="p-0">
                                <b-form-input
                                    type="text"
                                    :value="set.kg"
                                    @input="setSetValue(index, 'kg', $event)"
                                    size="sm"
                                    placeholder="Kgs"
                                    style="width:100%;"
                                    class="text-center"
                                ></b-form-input>
                            </b-col>
                            <b-col sm="3" class="p-0">
                                <b-form-input
                                    type="text"
                                    :value="set.measureAmount"
                                    @input="setSetValue(index, 'measureAmount', $event)"
                                    size="sm"
                                    placeholder="Reps"
                                    style="width:100%;"
                                    class="text-center"
                                ></b-form-input>
                            </b-col>
                            <b-col sm="1" class="pl-2">
                                <b-form-checkbox class="setCheck"></b-form-checkbox>
                            </b-col>
                        </b-row>
                    </b-form>
                </b-list-group-item>

                <b-list-group-item>
                    <b-row>
                        <div class="m-auto">
                            <b-button
                                class="mr-1"
                                @click="removeSet"
                                variant="outline-dark"
                                size="sm"
                                >Remove Set</b-button
                            >
                            <b-button
                                class="ml-1"
                                @click="addSet"
                                variant="outline-success"
                                size="sm"
                                >Add Set</b-button
                            >
                        </div>
                    </b-row>
                </b-list-group-item>
            </b-list-group>
        </b-collapse>
    </b-card>
</template>

<script>
export default {
    name: "ExerciseRecorder",
    props: {
        exercise: {
            type: Object,
            required: true
        },
        previousExercise: {
            type: Object,
            required: false
        }
    },
    data() {
        return {
            setsExpanded: true,
            previousExerciseStored: {}
        };
    },

    created: function() {
        // Store previous exercise so if order changed it isnt changed too (as its based off index).
        if (this.$props.previousExercise) {
            this.previousExerciseStored = JSON.parse(JSON.stringify(this.$props.previousExercise));
        }
    },

    computed: {
        notesPlaceholder: function() {
            if (this.$props.previousExercise) {
                if (this.$props.previousExercise.notes.length > 0) {
                    return this.$props.previousExercise.notes;
                }
            }

            return "Add exercise notes...";
        }
    },

    methods: {
        addSet: function() {
            let d;

            if (this.exercise.sets.length > 0) {
                d = JSON.parse(JSON.stringify(this.exercise.sets[this.exercise.sets.length - 1]));
            } else {
                d = { kg: 0, measureAmount: 0, measureBy: "Reps" };
            }

            this.$emit("addSet", this.$props.exercise.uid, d);
        },

        removeSet: function() {
            this.$emit("removeSet", this.$props.exercise.uid);
        },

        setSetValue: function(index, key, e) {
            console.log("EX REC", index, key, e);
            this.$emit("setSetValue", this.$props.exercise.uid, index, key, e);
        },

        removeExercise: function() {
            this.$emit("removeExercise", this.$props.exercise.uid);
        }
    }
};
</script>

<style scoped>
.clickableIcon:hover {
    cursor: pointer;
}

.sortableIcon:hover {
    cursor: pointer;
}

.setCheck .custom-control-input:checked ~ .custom-control-label::before {
    background-color: black;
}
</style>
