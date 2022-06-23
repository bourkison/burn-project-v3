<template>
    <div>
        <b-form-input
            type="text"
            list="usernameList"
            placeholder="Search username..."
            autocomplete="off"
            v-model="inputText"
            @select="usernameAdd"
            size="sm"
        />
        <b-form-datalist id="usernameList" :options="suggestedUsernames" />

        <div class="mt-2">
            <b-badge
                class="mr-1"
                variant="primary"
                v-for="username in selectedUsernames"
                :key="username"
                pill
                >{{ username }}</b-badge
            >
        </div>
    </div>
</template>

<script lang="ts">
import Vue from "vue"

interface UsernameFilterData {
    inputText: string;
    selectedUsernames: string[];
    suggestedUsernames: string[]
}

export default Vue.extend({
    name: "UsernameFilter",
    data(): UsernameFilterData {
        return {
            inputText: "",
            selectedUsernames: [],
            suggestedUsernames: []
        };
    },

    created: function() {
        this.suggestedUsernames.push(this.$store.state.userProfile.docData.username);
    },

    methods: {
        usernameAdd: function(): void {
            console.log("Test");

            if (
                this.inputText.trim() !== "" &&
                !this.selectedUsernames.includes(this.inputText.trim())
            ) {
                this.selectedUsernames.push(this.inputText);
                this.inputText = "";
            }
        }
    }
});
</script>
