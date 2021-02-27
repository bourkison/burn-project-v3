<template>
    <div>
        <div>
            <b-badge v-for="tag in selectedTags" class="tagBadge" variant="dark" :key="tag" @click="pillRemove(tag)">{{ tag }}</b-badge>
        </div>

        <div class="dataListCont">
            <b-form-input list="tagList" id="inputWithList" placeholder="Add up to 5 tags..." autocomplete="off" v-model="inputText" @select="dataListAdd" @keydown="detectEnter"></b-form-input>
            <b-form-datalist id="tagList" :options="tagOptions"></b-form-datalist>
        </div>
    </div>
</template>

<script>
export default {
    name: 'TagSelector',
    data() {
        return {
            inputText: '',
            selectedTags: [],
            tagOptions: ["Cardio", "Strength", "No Equipment"]
        }
    },

    methods: {
        dataListAdd: function(e) {
            if (this.inputText.trim() !== '' && this.selectedTags.length < 5) {
                // Add selected to selectedTags
                this.selectedTags.push(e.target.value);

                // Remove from available.
                this.tagOptions = this.tagOptions.filter(x => x !== e.target.value);

                // Reset input text.
                this.inputText = '';
            }
        },

        detectEnter: function(e) {
            if (e.key === 'Enter' && this.inputText.trim() !== '' && this.selectedTags.length < 5) {
                // Check its not already selected.
                if (!this.selectedTags.includes(this.inputText)) {
                    // Push input text to selectedTags
                    this.selectedTags.push(this.inputText);

                    // Remove from available (if it's there).
                    this.tagOptions = this.tagOptions.filter(x => x !== this.inputText);
                }

                this.inputText = '';
            }
        },

        pillRemove: function(tag) {
            this.selectedTags = this.selectedTags.filter(x => x !== tag);
            this.tagOptions.push(tag);
        }
    },

    watch: {
        selectedTags: function() {
            this.$emit("updateTags", this.selectedTags);
        }
    }
}
</script>

<style scoped>
.tagBadge {
    margin: 0 2px;
}

.tagBadge:hover {
    cursor: pointer;
}

.dataListCont {
    margin-top: 15px;
}
</style>