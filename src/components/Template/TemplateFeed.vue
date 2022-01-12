<template>
    <div v-if="!isLoading">
        <TemplateComponent
            class="template"
            v-for="(template, index) in templates"
            :templateId="template.templateId ? template.templateId : template._id"
            :key="template._id"
            :skeletonAmount="skeleton[index][0]"
            :skeletonWidth="skeleton[index][1]"
        />
    </div>
    <div v-else>
        <LoadingComponent
            class="template"
            v-for="(s, i) in skeleton"
            :key="i"
            :skeletonAmount="s[0]"
            :skeletonWidth="s[1]"
        />
    </div>
</template>

<script>
import TemplateComponent from "@/components/Template/TemplateComponent.vue";
import LoadingComponent from "@/components/Utility/LoadingComponent.vue";

export default {
    name: "TemplateFeed",
    components: { TemplateComponent, LoadingComponent },
    props: {
        templates: {
            required: true,
            type: Array
        },
        isLoading: {
            required: true,
            type: Boolean
        }
    },
    data() {
        return {
            skeleton: [],
            loadAmount: 5
        };
    },

    computed: {
        templateLength() {
            return this.$props.templates.length
        }
    },

    created() {
        this.skeleton = JSON.parse(JSON.stringify(this.$store.state.templates.templateFeedSkeletons));
    },

    mounted() {
        this.$store.commit("templates/emptySkeletons");
    },

    watch: {
        templateLength(n, o) {
            for (let i = 0; i < n - o; i++) {
                let amount = Math.floor(Math.random() * 4) + 3;
                let widths = [];

                for (let j = 0; j < amount; j++) {
                    widths.push((Math.floor(Math.random() * 50) + 50).toString() + "%");
                }
                this.skeleton.push([amount, widths]);
            }
        }
    }
};
</script>

<style scoped>
.template {
    margin-bottom: 25px;
}
</style>
