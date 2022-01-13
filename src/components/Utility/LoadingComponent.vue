<template>
    <b-card no-body>
        <div>
            <b-card-body>
                    <b-skeleton
                        v-for="index in skeletonAmount"
                        :key="index"
                        animation="wave"
                        :width="skeletonWidth[index]"
                    ></b-skeleton>
            </b-card-body>
        </div>
    </b-card>
</template>

<script lang="ts">
import Vue, { PropType } from "vue";

export default Vue.extend({
    name: "LoadingComponent",
    props: {
        skeletonAmount: {
            type: Number as PropType<number>,
            required: true
        },
        skeletonWidth: {
            type: Array as PropType<string[]>,
            required: true
        }
    }
});
</script>
