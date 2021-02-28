<template>
    <div>            
        <MuscleGroup v-bind:editable="true" v-bind:selectedGroups="selectedMuscleGroups" @mgClick="muscleGroupClickHandler"></MuscleGroup>

        <div>
            <b-badge v-for="muscleGroup in selectedMuscleGroups" class="mgBadge" @click="pillRemove(muscleGroup)" variant="dark" :key="muscleGroup">{{ muscleGroup }}</b-badge>
        </div>

        <div class="datalistCont">
            <b-form-input list="muscleGroupList" id="inputWithList" :placeholder="selectedMuscleGroups.length > 0 ? '' : 'Select muscle groups...'" autocomplete="off" v-model="inputText" @select="datalistAdd"></b-form-input>
            <b-form-datalist id="muscleGroupList" :options="availableMuscleGroups"></b-form-datalist>
        </div>

        
    </div>
</template>

<script>
import MuscleGroup from '@/components/Utility/MuscleGroup.vue'

export default {
    name: "MuscleGroupSelect",
    components: { MuscleGroup },
    props: {
        initMgs: {
            type: Array,
            required: false
        }
    },
    data() { 
        return {
            inputText: '',
            // Selected Muscle Groups is all selected.
            // All is all possible.
            // Available is non selected.
            allMuscleGroups: ["Trapezius","Deltoids","Forearms","Lats","Abs","Obliques","Pectorals","Adductors","Calves","Hamstrings","Glutes","Quads","Triceps","Biceps"],
            availableMuscleGroups: [],
            selectedMuscleGroups: []
        }
    },

    mounted: function() {
        this.availableMuscleGroups = this.allMuscleGroups;

        if (this.$props.initMgs) {
            this.selectedMuscleGroups = this.$props.initMgs;

            this.$props.initMgs.forEach(mg => {
                // Remove from available.
                this.availableMuscleGroups = this.availableMuscleGroups.filter(x => x !== mg);
            })
        }

    },

    methods: {
        datalistAdd: function(e) {
            if (this.inputText.trim() !== '') {
                // Add selected to selectedMuscleGroups.
                this.selectedMuscleGroups.push(e.target.value);
                
                // Remove from available.
                this.availableMuscleGroups = this.availableMuscleGroups.filter(x => x !== e.target.value);
            }

            this.inputText = '';
            // document.activeElement.blur();
        },

        pillRemove: function(mg) {
            this.selectedMuscleGroups = this.selectedMuscleGroups.filter(x => x !== mg);
            this.availableMuscleGroups.push(mg)
        },

        muscleGroupClickHandler: function(id) {
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
        },
    },

    watch: {
        selectedMuscleGroups: function() {
            this.$emit("updateMuscleGroups", this.selectedMuscleGroups);
        }
    }
}
</script>

<style scoped>
    .datalistCont {
        margin-top: 15px;
    }

    .muscleGroupsCont {
        margin-top: 10px;
        padding-top:10px
    }

    .mgBadge {
        margin: 0 2px;
    }

    .mgBadge:hover {
        cursor: pointer;
    }
</style>