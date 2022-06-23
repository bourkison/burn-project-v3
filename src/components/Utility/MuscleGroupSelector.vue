<template>
    <div>
        <MuscleGroup
            v-bind:editable="true"
            v-bind:selectedGroups="selectedMuscleGroups"
            @mgClick="muscleGroupClickHandler"
        ></MuscleGroup>

        <div>
            <b-badge
                v-for="muscleGroup in selectedMuscleGroups"
                class="mgBadge"
                @click="pillRemove(muscleGroup)"
                variant="dark"
                :key="muscleGroup"
                >{{ muscleGroup }}</b-badge
            >
        </div>

        <div class="datalistCont">
            <b-form-input
                list="muscleGroupList"
                id="inputWithList"
                placeholder="Select muscle groups..."
                autocomplete="off"
                size="sm"
                v-model="inputText"
                @select="datalistAdd"
            ></b-form-input>
            <b-form-datalist
                id="muscleGroupList"
                :options="availableMuscleGroups"
            ></b-form-datalist>
        </div>
    </div>
</template>

<script lang="ts">
import Vue, { PropType } from "vue";
import { HTMLElementEvent } from "@/types";

import MuscleGroup from "@/components/Utility/MuscleGroup.vue";

interface MuscleGroupSelectData {
    inputText: string;
    allMuscleGroups: string[];
    availableMuscleGroups: string[];
    selectedMuscleGroups: string[];
}

export default Vue.extend({
    name: "MuscleGroupSelect",
    components: { MuscleGroup },
    props: {
        initMgs: {
            type: Array as PropType<string[]>,
            required: false
        }
    },
    data(): MuscleGroupSelectData {
        return {
            inputText: "",
            // Selected Muscle Groups is all selected.
            // All is all possible.
            // Available is non selected.
            allMuscleGroups: [
                "Trapezius",
                "Deltoids",
                "Forearms",
                "Lats",
                "Abs",
                "Obliques",
                "Pectorals",
                "Adductors",
                "Calves",
                "Hamstrings",
                "Glutes",
                "Quads",
                "Triceps",
                "Biceps"
            ],
            availableMuscleGroups: [],
            selectedMuscleGroups: []
        };
    },

    mounted: function() {
        this.availableMuscleGroups = this.allMuscleGroups;

        if (this.initMgs) {
            this.selectedMuscleGroups = this.initMgs;

            this.initMgs.forEach(mg => {
                // Remove from available.
                this.availableMuscleGroups = this.availableMuscleGroups.filter(x => x !== mg);
            });
        }
    },

    methods: {
        datalistAdd: function(e: HTMLElementEvent<HTMLTextAreaElement>): void {
            if (
                this.inputText.trim() !== "" &&
                this.availableMuscleGroups.includes(this.inputText)
            ) {
                // Add selected to selectedMuscleGroups.
                this.selectedMuscleGroups.push(e.target.value);

                // Remove from available.
                this.availableMuscleGroups = this.availableMuscleGroups.filter(
                    x => x !== e.target.value
                );

                // Emit updated.
                this.$emit("updateMuscleGroups", this.selectedMuscleGroups);
            }

            this.inputText = "";
        },

        pillRemove: function(mg: string): void {
            this.selectedMuscleGroups = this.selectedMuscleGroups.filter(x => x !== mg);
            this.availableMuscleGroups.push(mg);

            this.$emit("updateMuscleGroups", this.selectedMuscleGroups);
        },

        muscleGroupClickHandler: function(id: string): void {
            if (!this.selectedMuscleGroups.includes(id)) {
                // Add to selected.
                this.selectedMuscleGroups.push(id);

                // Remove from available.
                this.availableMuscleGroups = this.availableMuscleGroups.filter(x => x !== id);
            } else {
                // Remove from selected.
                this.selectedMuscleGroups = this.selectedMuscleGroups.filter(x => x !== id);

                // Add to available.
                this.availableMuscleGroups.push(id);
            }

            // Emit updated.
            this.$emit("updateMuscleGroups", this.selectedMuscleGroups);
        }
    }
});
</script>

<style scoped>
.datalistCont {
    margin-top: 15px;
}

.muscleGroupsCont {
    margin-top: 10px;
    padding-top: 10px;
}

.mgBadge {
    margin: 0 2px;
}

.mgBadge:hover {
    cursor: pointer;
}
</style>
