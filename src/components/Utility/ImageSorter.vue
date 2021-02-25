<template>
    <div class="imageSorterCont">
        <b-row v-if="imagesProp.length > 0" class="sortableCont" align-h="center">
            <b-col v-for="(img, i) in imagesProp" :key="i" sm="4" class="sortableItem">
                <b-card :img-src="img.url" img-top>
                    <b-card-text class="text-center">
                        <b-icon-pencil-square class="imgIcon" font-scale="1.3" @click="editImage(img.id)" />
                        <b-icon-trash class="imgIcon" font-scale="1.3" />
                    </b-card-text>
                </b-card>
            </b-col>
        </b-row>
    </div>
</template>

<script>
import Sortable from 'sortablejs'

export default {
    name: 'ImageSorter',
    props: {
        imagesProp: {
            type: Array,
            required: true
        }
    },
    data() {
        return {
            temp: [1, 2, 3],
            sortedImages: [],
            sortable: null
        }
    },

    mounted: function() {
        this.$props.imagesProp.forEach(img => {
            this.sortedImages.push(img);
        })
    },

    methods: {
        changeOrder: function(e) {
            if (e.newIndex !== e.oldIndex) {
                this.sortedImages.splice(e.newIndex, 0, this.sortedImages.splice(e.oldIndex, 1)[0]);
                console.log("sort", e.oldIndex, "-->", e.newIndex);
                this.$emit("sort", this.sortedImages);
            }
        },

        editImage: function(id) {
            console.log("Editing:", id);
        }
    },

    watch: {
        imagesProp: function(n) {
            if (n.length > this.sortedImages.length) {
                // console.log("Change back")
                // this.images = [];
                // this.$props.imagesProp.forEach(img => {
                //     this.images.push(img);
                // })

                for (let i = n.length - this.sortedImages.length; i > 0; i --) {
                    this.sortedImages.push(n[n.length - i]);
                }
            }

            if (n.length > 0 && !this.sortable) {
                const sortableOptions = {
                    animation: 300,
                    onEnd: this.changeOrder
                }

                this.$nextTick(() => this.sortable = new Sortable(document.querySelector(".sortableCont"), sortableOptions));
            } else if (n.length == 0) {
                this.sortable = null;
            }
        }
    }
}
</script>

<style scoped>
.imgIcon {
    margin: 0 2px;
}

.sortableItem {
    margin: 10px 0;
}

.sortableItem:hover {
    cursor: pointer;
}

.imageSorterCont {
    padding: 15px;
}
</style>