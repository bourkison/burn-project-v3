<template>
    <div class="exercise-recorder">
        <div class="card-flip mt-2" ref="cardFlip" :style="'height:' + cardHeight">
            <div class="flipper">
                <div class="front" ref="frontCard">
                    <b-card no-body>
                        <div ref="frontCardBody" class="frontCardBody">
                            <b-card-body class="pb-2">
                                <div class="d-flex align-items">
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
                                        <b-dropdown variant="outline" size="sm" class="small-font small-dropdown">
                                            <b-dropdown-item class="small-dropdown-item" @click="commentExpanded = !commentExpanded"><b-icon-chat-left class="mr-1" /> Notes</b-dropdown-item>
                                            <b-dropdown-item class="small-dropdown-item" @click="flipCard" ><b-icon-gear class="mr-1" /> Exercise Settings</b-dropdown-item>
                                            <b-dropdown-item class="small-dropdown-item" @click="addChart"><b-icon-bar-chart class="mr-1"/> Show Chart</b-dropdown-item>
                                            <b-dropdown-item class="small-dropdown-item" :to="'/exercises/' + exercise.exerciseReference.exerciseId"><b-icon-box-arrow-up-right class="mr-1" /> Go To</b-dropdown-item>
                                            <b-dropdown-item class="small-dropdown-item" variant="danger" @click="removeExercise"><b-icon-trash class="mr-1" />Delete</b-dropdown-item>
                                        </b-dropdown>
                                    </div>
                                </div>
                            </b-card-body>

                            <b-collapse v-model="setsExpanded" @show="startExpanding" @hide="startExpanding" @hidden="stopExpanding" @shown="stopExpanding">
                                <b-collapse v-model="commentExpanded" @show="startExpanding" @hide="startExpanding" @hidden="stopExpanding" @shown="stopExpanding">
                                    <div class="pl-4 pr-4">
                                        <b-form-textarea
                                            v-model="exercise.notes"
                                            rows="2"
                                            no-resize
                                            :placeholder="notesPlaceholder"
                                            class="border-white"
                                        ></b-form-textarea>
                                    </div>
                                </b-collapse>

                                <b-list-group flush class="sortableContainer mt-2">
                                    <b-list-group-item>
                                        <b-row class="d-flex text-center" align-v="center">
                                            <b-col sm="5" style="font-weight:600;"><span>Previous</span></b-col>
                                            <b-col sm="3" style="font-weight:600;"><span>{{ exercise.options && exercise.options.weightUnit === "lb" ? 'lb' : 'kg' }}</span></b-col>
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
                                                        {{ previousExerciseStored.sets[index].weightAmount }}kg x
                                                        {{ previousExerciseStored.sets[index].measureAmount }}
                                                    </div>
                                                    <div v-else class="text-muted text-center">
                                                        -
                                                    </div>
                                                </b-col>
                                                <b-col sm="3" class="p-0">
                                                    <b-form-input
                                                        type="text"
                                                        :value="set.weightAmount"
                                                        @input="setSetValue(index, 'weightAmount', $event)"
                                                        size="sm"
                                                        placeholder="Kgs"
                                                        style="width:100%;"
                                                        class="text-center number-input"
                                                        lazy-formatter
                                                        :formatter="preventLetters"
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
                                                        class="text-center number-input"
                                                        lazy-formatter
                                                        :formatter="preventLetters"
                                                    ></b-form-input>
                                                </b-col>
                                                <b-col sm="1" class="pl-2">
                                                    <b-form-checkbox class="setCheck" button-variant="success"></b-form-checkbox>
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
                        </div>
                    </b-card>
                </div>

                <div class="back" ref="backCard">
                    <b-card no-body>
                        <div ref="backCardBody" class="back-body" :style="'height:' + cardBodyHeight">
                            <b-card-body>
                                <b-card-title title-tag="h6">Edit Exercise</b-card-title>

                                <div class="mt-3">
                                    <b-form @submit.prevent="updateExerciseSettings">
                                        <b-form-group label="Measure By">
                                            <b-form-select :options="measureByOptions" v-model="newExerciseOptions.measureBy" />
                                        </b-form-group>

                                        <b-form-group label="Weight Unit">
                                            <b-form-select :options="weightUnitOptions" v-model="newExerciseOptions.weightUnit" />
                                        </b-form-group>

                                        <div class="text-center">
                                            <b-button variant="danger" size="sm" @click="flipCard">Cancel</b-button>
                                            <b-button class="ml-1" variant="outline-dark" size="sm" type="submit">Update</b-button>
                                        </div>
                                    </b-form>
                                </div>
                            </b-card-body>
                        </div>
                    </b-card>
                </div>
            </div>
        </div>
    </div>
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
            commentExpanded: false,
            previousExerciseStored: {},

            newExerciseOptions: {},

            // Bootstrap
            measureByOptions: [
                { value: "repsWeight", text: "Reps and Weight" },
                { value: "reps", text: "Reps Only" },
                { value: "timeWeight", text: "Time and Weight" },
                { value: "time", text: "Time Only" },
            ],
            weightUnitOptions: [
                { value: "kg", text: "Kilograms (metric)" },
                { value: "lb", text: "Pounds (imperial)" }
            ],

            // Card Flip
            cardHeight: "229px",
            cardBodyHeight: "200px",
            expandingInterval: null,
        };
    },

    created: function() {
        // Store previous exercise so if order changed it isnt changed too (as its based off index).
        if (this.$props.previousExercise) {
            this.previousExerciseStored = JSON.parse(JSON.stringify(this.$props.previousExercise));
        }

        if (!this.$props.exercise.options) {
            this.$emit("updateExerciseOptions", this.$props.exercise.uid, { weightUnit: "kg", measureBy: "repsWeight" })
        } else if (!this.$props.exercise.options.weightUnit) {
            this.$emit("updateExerciseOptions", this.$props.exercise.uid, { weightUnit: "kg" })
        } else if (!this.$props.exercise.options.measureBy) {
            this.$emit("updateExerciseOptions", this.$props.exercise.uid, { measureBy: "repsWeight" })
        }

        this.newExerciseOptions = this.$props.exercise.options;
    },

    mounted: function() {
        // Set height of card.
        this.cardHeight = this.$refs.frontCard.offsetHeight + "px";
        this.cardBodyHeight = this.$refs.frontCardBody.offsetHeight + "px";

        this.$refs.cardFlip.addEventListener("transitionend", () => {
            if (this.$refs.cardFlip.classList.contains("flipped") && this.$el.querySelector(".frontCardBody")) {
                this.$el.querySelector(".frontCardBody").style.display = "none";
            }
        })
    },

    beforeRouteLeave: function(to, from, next) {
        if (this.expandingInterval) {
            window.clearInterval(this.expandingInterval);
        }

        next();
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
                d = { weightAmount: 0, measureAmount: 0 };
            }

            this.$emit("addSet", this.$props.exercise.uid, d);
            this.$nextTick(() => { 
                this.cardHeight = this.$refs.frontCard.offsetHeight + "px"; 
                this.cardBodyHeight = this.$refs.frontCardBody.offsetHeight + "px";
            })
        },

        removeSet: function() {
            this.$emit("removeSet", this.$props.exercise.uid);
            this.$nextTick(() => { 
                this.cardHeight = this.$refs.frontCard.offsetHeight + "px";
                this.cardBodyHeight = this.$refs.frontCardBody.offsetHeight + "px";
            })
        },

        setSetValue: function(index, key, e) {
            this.$emit("setSetValue", this.$props.exercise.uid, index, key, e);
        },

        removeExercise: function() {
            this.$bvModal.msgBoxConfirm("Are you sure you want to remove this exercise?", {
                title: "Remove Exercise?",
                buttonSize: "sm",
                okVariant: "danger",
                cancelVariant: "outline-dark",
                okTitle: "OK",
                cancelTitle: "Go Back",
                centered: true,
                size: "sm"
            })
            .then(value => {
                if (value) {
                    this.$emit("removeExercise", this.$props.exercise.uid);
                }
            })
        },

        flipCard: function() {
            if (this.$refs.cardFlip.classList.contains("flipped") && this.$el.querySelector(".frontCardBody")) {
                this.$el.querySelector(".frontCardBody").style.display = "block";
            }

            this.$refs.cardFlip.classList.toggle("flipped");
        },

        startExpanding: function() {
            this.expandingInterval = window.setInterval(() => {
                this.cardHeight = this.$refs.frontCard.offsetHeight + "px";
                this.cardBodyHeight = this.$refs.frontCardBody.offsetHeight + "px";
            }, 10)
        },

        stopExpanding: function() {
            window.clearInterval(this.expandingInterval);
        },

        updateExerciseSettings: function() {
            this.$emit("updateExerciseOptions", this.$props.exercise.uid, this.newExerciseOptions)
            this.flipCard();
        },

        addChart: function() {
            this.$emit("pushChart", this.$props.exercise.exerciseReference)
        },

        preventLetters: function(value) {
            return value.replace(/[^.\d]/g, '');
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

    .align-items {
        align-items: center !important;
    }

    .card-flip {
        -webkit-perspective: 1000px;
        -moz-perspective: 1000px;
        -o-perspective: 1000px;
        perspective: 1000px;
    }

    .card-flip.flipped .flipper {
        -webkit-transform: rotateY(180deg);
        -moz-transform: rotateY(180deg);
        -o-transform: rotateY(180deg);
        transform: rotateY(180deg);
    }

    .back-body {
        overflow-y: auto !important;
    }

    .flipper {
        -webkit-transition: 0.6s;
        -webkit-transform-style: preserve-3d;

        -moz-transition: 0.6s;
        -moz-transform-style: preserve-3d;

        -o-transition: 0.6s;
        -o-transform-style: preserve-3d;

        transition: 0.6s;
        transform-style: preserve-3d;

        position: relative;
    }

    .front,
    .back {
        -webkit-backface-visibility: hidden;
        -moz-backface-visibility: hidden;
        -o-backface-visibility: hidden;
        backface-visibility: hidden;

        position: absolute;
        width: 100%;
        top: 0;
        left: 0;
    }

    .front {
        z-index: 2;
        transform: rotateY(0deg);
    }

    .back {
        -webkit-transform: rotateY(180deg);
        -moz-transform: rotateY(180deg);
        -o-transform: rotateY(180deg);
        transform: rotateY(180deg);
    }

    /* Chrome, Safari, Edge, Opera */
    .number-input::-webkit-outer-spin-button,
    .number-input::-webkit-inner-spin-button {
        -webkit-appearance: none;
        margin: 0;
    }

    /* Firefox */
    .number-input[type=number] {
        -moz-appearance: textfield;
    }
</style>

<style>
    .small-dropdown-item a {
        font-size: 12px !important;
        padding-left: 0.75rem !important
    }

    .small-dropdown ul {
        min-width: 8rem !important;
    }

    .small-dropdown button {
        padding-left: 0.2rem !important;
        padding-right: 0.2 rem !important;
        box-shadow: none !important;
    }
    
    .exercise-recorder .custom-checkbox .custom-control-input:checked ~ .custom-control-label::before {
        background-color: #28a745;
        border-color: #28a745;
    }

    .exercise-recorder .custom-checkbox .custom-control-input:focus ~ .custom-control-label::before {
        box-shadow: none !important;
        border: #adb5bd solid 1px !important;
    }
</style>