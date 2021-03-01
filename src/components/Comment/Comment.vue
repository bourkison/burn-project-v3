<template>
    <b-list-group-item class="d-flex p-2" style="border:none;">
        <b-avatar class="mr-2 mt-2" size="2rem" :src="comment.createdBy.profilePhoto" />
        <div style="width: 100%" class="bg-light rounded p-2">
            <div>
                <span>{{ comment.createdBy.username }}</span>
                <b-dropdown class="float-right" variant="outline">
                    <span v-if="comment.createdBy.id === $store.state.userProfile.data.uid">
                        <b-dropdown-item>Edit</b-dropdown-item>
                        <b-dropdown-item variant="danger">Delete</b-dropdown-item>
                    </span>
                </b-dropdown>
            </div>
            <div class="content">{{ comment.content }}</div>
        </div>
    </b-list-group-item>
</template>

<script>
export default {
    name: 'Comment',
    props: {
        comment: {
            type: Object,
            required: true
        }
    }
}
</script>

<style scoped>
.username:hover {
    cursor: pointer;
}

.content {
    font-size: 15px;
}
</style>