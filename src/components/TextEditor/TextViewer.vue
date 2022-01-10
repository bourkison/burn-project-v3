<template>
    <div class="text-viewer">
        <vue-simple-markdown :source="value" />
    </div>
</template>

<script>
export default {
    name: "TextViewer",
    props: {
        value: {
            type: String,
            required: true
        }
    }
}
</script>

<style scoped>
    .text-viewer {
        margin-top: 0.5rem;
    }
</style>