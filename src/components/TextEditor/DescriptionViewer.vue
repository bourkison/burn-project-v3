<template>
    <div class="description-viewer" v-html="value"></div>
</template>

<script>
export default {
    name: "DescriptionViewer",
    props: {
        value: {
            type: String,
            required: true
        }
    }
}
</script>

<style scoped>
    .description-viewer {
        margin-top: 0.5rem;
    }
</style>

<style>
    .description-viewer h1 {
        font-size: 2rem;
    }

    .description-viewer h2 {
        font-size: 1.5rem;
    }

    .description-viewer blockquote {
        border-left: 3px solid rgba(0, 0, 0, 0.1);
        color: rgba(0, 0, 0, 0.8);
        padding-left: 0.8rem;
        font-style: italic;
    }

    .description-viewer blockquote p {
        margin: 0;
    }
</style>