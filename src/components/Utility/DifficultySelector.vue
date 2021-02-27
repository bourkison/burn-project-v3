<template>
    <div class="text-center">
        <b-icon class="star" :icon="stars[0].icon" :variant="stars[0].variant" @click="starClick(0)" @mouseover="starHover(true, 0)" @mouseleave="starHover(false, 0)" font-scale="2"></b-icon>
        <b-icon class="star" :icon="stars[1].icon" :variant="stars[1].variant" @click="starClick(1)" @mouseover="starHover(true, 1)" @mouseleave="starHover(false, 1)" font-scale="2"></b-icon>
        <b-icon class="star" :icon="stars[2].icon" :variant="stars[2].variant" @click="starClick(2)" @mouseover="starHover(true, 2)" @mouseleave="starHover(false, 2)" font-scale="2"></b-icon>
        <b-icon class="star" :icon="stars[3].icon" :variant="stars[3].variant" @click="starClick(3)" @mouseover="starHover(true, 3)" @mouseleave="starHover(false, 3)" font-scale="2"></b-icon>
        <b-icon class="star" :icon="stars[4].icon" :variant="stars[4].variant" @click="starClick(4)" @mouseover="starHover(true, 4)" @mouseleave="starHover(false, 4)" font-scale="2"></b-icon>
    </div>
</template>

<script>
export default {
    name: 'DifficultySelector',
    props: {
        initialDifficulty: {
            type: Number,
            required: false
        }
    },

    data() {
        return {
            stars: [
                {variant: "warning", icon: "star-fill", hover: false, clicked: true},
                {variant: "", icon: "star", hover: false, clicked: false},
                {variant: "", icon: "star", hover: false, clicked: false},
                {variant: "", icon: "star", hover: false, clicked: false},
                {variant: "", icon: "star", hover: false, clicked: false}
            ]
        }
    },

    created: function() {
        if (this.$props.initialDifficulty) {
            this.starClick(this.$props.initialDifficulty - 1);
        }
    },

    methods: {
        starHover (hover, star) {
            if (hover) {
                for (let i = 0; i <= star; i++) {
                    this.stars[i].icon = "star-fill";
                }
            } else {
                for (let i = 0; i <= star; i ++) {
                    if (!this.stars[i].clicked) {
                        this.stars[i].icon = "star";
                    }
                }
            }
        },

        starClick (star) {
            for (let i = 0; i <= star; i++) {
                this.stars[i].icon = "star-fill";
                this.stars[i].variant = "warning"
                this.stars[i].clicked = true;
            }

            for (let i = star + 1; i < 5; i ++) {
                this.stars[i].icon = "star";
                this.stars[i].variant = "";
                this.stars[i].clicked = false;
            }

            document.activeElement.blur();
            this.$emit("updateDifficult", star + 1)
        }
    }
}
</script>

<style scoped>
.star:hover {
    cursor: pointer;
}
</style>