<template>
    <b-list-group-item>
        <b-avatar class="mr-3" :src="userData.profilePhoto" />
        {{ userData.username }}
    </b-list-group-item>
</template>

<script>
export default {
    name: 'UserList',
    props: {
        userData: {
            type: Object,
            required: true
        }
    }
}
</script>