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

<script>
export default {
    name: "UsernameFilter",
    data() {
        return {
            inputText: "",
            selectedUsernames: [],
            suggestedUsernames: []
        };
    },

    created: function() {
        this.suggestedUsernames.push(
            this.$store.state.userProfile.docData.username
        );
    },

    methods: {
        usernameAdd: function() {
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
};
</script>
