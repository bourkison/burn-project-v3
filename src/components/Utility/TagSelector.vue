<template>
    <div>
        <div>
            <b-badge
                v-for="tag in selectedTags"
                class="tagBadge"
                variant="dark"
                :key="tag"
                @click="pillRemove(tag)"
                >{{ tag }}</b-badge
            >
        </div>

        <div class="dataListCont">
            <b-form-input
                list="tagList"
                id="inputWithList"
                placeholder="Add up to 5 tags..."
                autocomplete="off"
                v-model="inputText"
                @select="dataListAdd"
                @keydown="detectEnter"
                size="sm"
            ></b-form-input>
            <b-form-datalist id="tagList" :options="tagOptions"></b-form-datalist>
        </div>
    </div>
</template>

<script lang="ts">
import Vue, { PropType } from "vue"
import { HTMLElementEvent } from "@/types";

interface TagSelectorData {
    inputText: string;
    selectedTags: string[];
    tagOptions: string[];
}

export default Vue.extend({
    name: "TagSelector",
    props: {
        initTags: {
            type: Array as PropType<string[]>,
            required: false
        }
    },
    data(): TagSelectorData {
        return {
            inputText: "",
            selectedTags: [],
            tagOptions: ["Cardio", "Strength", "No Equipment"]
        };
    },

    created() {
        if (this.initTags) {
            this.initTags.forEach(tag => {
                this.selectedTags.push(tag);

                // Remove from available (if it's there).
                this.tagOptions = this.tagOptions.filter(x => x !== tag);
            });
        }
    },

    methods: {
        dataListAdd(e: HTMLElementEvent<HTMLTextAreaElement>): void {
            if (this.inputText.trim() !== "" && this.selectedTags.length < 5) {
                // Add selected to selectedTags
                this.selectedTags.push(e.target.value);

                // Remove from available.
                this.tagOptions = this.tagOptions.filter(x => x !== e.target.value);

                // Reset input text.
                this.inputText = "";
            }
        },

        detectEnter(e: KeyboardEvent): void {
            if (e.key === "Enter" && this.inputText.trim() !== "" && this.selectedTags.length < 5) {
                // Check its not already selected.
                if (!this.selectedTags.includes(this.inputText)) {
                    // Push input text to selectedTags
                    this.selectedTags.push(this.inputText.toLowerCase());

                    // Remove from available (if it's there).
                    this.tagOptions = this.tagOptions.filter(x => x !== this.inputText);
                }

                this.inputText = "";
            }
        },

        pillRemove(tag: string): void {
            this.selectedTags = this.selectedTags.filter(x => x !== tag);
            this.tagOptions.push(tag);
        }
    },

    watch: {
        selectedTags() {
            this.$emit("updateTags", this.selectedTags);
        }
    }
});
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
