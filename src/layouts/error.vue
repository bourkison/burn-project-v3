<template>
    <div v-if="error.statusCode === 404">
        Not found.
    </div>
    <div v-else>
        Internal server error.
    </div>
</template>

<script>
export default {
    props: ["error"],
    created() {
        console.log(this.$props.error);
    }
}
</script>