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

<script>
export default {
    name: "LoadingComponent",
    props: {
        skeletonAmount: {
            type: Number,
            required: true
        },
        skeletonWidth: {
            type: Array,
            required: true
        }
    }
};
</script>
