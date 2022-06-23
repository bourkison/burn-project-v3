<template>
    <b-list-group-item :to="'/' + userData.username">
        <b-avatar class="mr-3" :src="userData.profilePhoto" />
        {{ userData.username }}
    </b-list-group-item>
</template>

<script lang="ts">
import Vue, { PropType } from "vue";
import { UserReference } from "@/types/user"

export default Vue.extend({
    name: "UserList",
    props: {
        userData: {
            type: Object as PropType<UserReference>,
            required: true
        }
    }
});
</script>
