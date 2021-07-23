<template>
    <div>
        <TemplateComponent class="template" v-for="template in templates" :templateId="template.templateId ? template.templateId : template._id" :key="template" />
    </div>
</template>

<script>
import TemplateComponent from '@/components/Template/TemplateComponent.vue'

export default {
    name: 'TemplateFeed',
    components: { TemplateComponent },
    props: {
        templates: {
            required: true,
            type: Array
        }
    }
}
</script>

<style scoped>
    .template {
        margin-bottom: 25px;
    }
</style>