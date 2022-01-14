<template>
    <div class="imageSorterCont">
        <b-row v-if="imagesProp.length > 0" class="sortableCont" id="image-sort-cont" align-h="center">
            <b-col v-for="(img, i) in imagesProp" :key="i" sm="4" class="sortableItem">
                <b-card :img-src="img.url" img-top>
                    <div class="text-center">
                        <b-icon-pencil-square
                            v-if="img.editable"
                            class="imgIcon"
                            font-scale="1.3"
                            @click="editImage(img.id)"
                        />
                        <b-icon-trash
                            class="imgIcon"
                            font-scale="1.3"
                            @click="deleteImage(img.id)"
                        />
                    </div>
                </b-card>
            </b-col>
        </b-row>
    </div>
</template>

<script lang="ts">
import Vue, { PropType } from "vue";
import Sortable, { SortableEvent } from "sortablejs";

type TImage = {
    id: string;
    file: File;
    url: string;
    editable: boolean;
    path: string | null;
}

export default Vue.extend({
    name: "ImageSorter",
    props: {
        imagesProp: {
            type: Array as PropType<TImage[]>,
            required: true
        }
    },
    data() {
        return {
            sortedImages: [] as TImage[],
            sortable: null as Sortable | null
        };
    },

    mounted() {
        this.imagesProp.forEach(img => {
            this.sortedImages.push(img);
        });

        if (this.imagesProp.length > 0) {
            const sortableOptions = {
                animation: 300,
                onEnd: this.changeOrder
            };

            this.$nextTick(() => {
                const cont = document.getElementById("image-sort-cont");
                if (cont) {
                    this.sortable = new Sortable(cont, sortableOptions)
                }
            })
        }
    },

    methods: {
        changeOrder(e: SortableEvent) {
            if (e.newIndex !== e.oldIndex && e.newIndex && e.oldIndex) {
                this.sortedImages.splice(e.newIndex, 0, this.sortedImages.splice(e.oldIndex, 1)[0]);
                console.log("sort", e.oldIndex, "-->", e.newIndex);
                this.$emit("sort", this.sortedImages);
            }
        },

        editImage(id: string) {
            this.$emit("editImage", id);
        },

        deleteImage(id: string) {
            this.$emit("deleteImage", id);
        }
    },

    watch: {
        imagesProp(n: TImage[]) {
            if (n.length > this.sortedImages.length) {
                for (let i = n.length - this.sortedImages.length; i > 0; i--) {
                    this.sortedImages.push(n[n.length - i]);
                }
            }

            if (n.length > 0 && !this.sortable) {
                const sortableOptions = {
                    animation: 300,
                    onEnd: this.changeOrder
                };

                this.$nextTick(() => {
                const cont = document.getElementById("image-sort-cont");
                    if (cont) {
                        this.sortable = new Sortable(cont, sortableOptions)
                    }
                });
            } else if (n.length == 0) {
                this.sortable = null;
            }
        }
    }
});
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
