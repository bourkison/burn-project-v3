<template>
    <div>
        <!-- 
            Here we input the images with visibility none so that we can grab the widths of them.
            As b-tabs sets to display none. 
        -->
        <b-card no-body no-title>
            <div class="cropper-cont">
                <cropper 
                    :src="inputImages[selectedImageIndex] ? inputImages[selectedImageIndex].url : null"
                    ref="cropper"
                    class="cropper"
                    id="cropper-el"
                    backgroundClass="cropperBackground"
                    :stencil-props="{ aspectRatio: 0.9 }"
                    :canvas="{ maxHeight: maxCropperHeight }"
                    @ready="cropperReadyEvent"
                />
                <div class="crop-button-cont" v-if="!cropperLoading">
                    <b-button @click="cancelImage" variant="danger" class="crop-button crop-cancel-button">Cancel</b-button>
                    <b-button @click="addImage" class="crop-button crop-add-button">Add</b-button>
                </div>
            </div>
            <div class="image-selector-cont d-flex">
                <div class="image-selector-item" :class="{ 'is-active': selectedImageIndex === index }" v-for="(image, index) in inputImages" :key="image.id">
                    <img @click="selectImage(index)" :src="image.url" />
                </div>
            </div>
        </b-card>
    </div>
</template>

<script lang="ts">
import Vue, { PropType } from "vue"
import { Cropper } from "vue-advanced-cropper";
import 'vue-advanced-cropper/dist/style.css';

import imageCompression from "browser-image-compression";

type ImageEditorData = {
    isLoading: boolean;
    inputImages: {
        id: string;
        file: File;
        url: string;
        cropperHeight: string;
    }[];
    editableImages: {
        id: string;
        file: File;
        url: string;
        cropperHeight: string;
    }[];
    selectedImageIndex: number;
    cropperLoading: boolean
}

export default Vue.extend({
    name: "ImageEditor",
    components: { Cropper },
    props: {
        imagesToAdd: {
            type: Array as PropType<{ file: File, id: string }[]>,
            default() { return [] }
        },
        imagesToEdit: {
            type: Array as PropType<string[]>,
            default() { return [] }
        },
        maxCropperHeight: {
            type: Number as PropType<number>,
            required: true
        }
    },
    data(): ImageEditorData {
        return {
            isLoading: false,
            inputImages: [],
            editableImages: [],
            selectedImageIndex: 0,
            cropperLoading: true,
        };
    },

    methods: {
        cropperReadyEvent(): void {
            this.cropperLoading = false;
        },

        async loadImage(file: File): Promise<HTMLImageElement> {
            let image = new Image();
            image.src = URL.createObjectURL(file);

            return await new Promise(resolve => {
                image.onload = () => {
                    URL.revokeObjectURL(image.src);
                    resolve(image);
                }
            })
        },

        addImage(): void {
            if (this.$refs.cropper) {
                const { canvas } = (this.$refs.cropper as Cropper).getResult();
                if (canvas) {
                    canvas.toBlob((blob) => {
                        this.$emit("addImage", {
                            file: blob,
                            id: this.inputImages[this.selectedImageIndex].id,
                            url: URL.createObjectURL(blob),
                            editable: true,
                            path: null
                        });

                        this.editableImages.push(this.inputImages[this.selectedImageIndex]);
                        this.inputImages.splice(this.selectedImageIndex, 1);

                        if (this.inputImages.length === 0) {
                            this.selectedImageIndex = 0;
                        } else if (this.selectedImageIndex >= this.inputImages.length) {
                            this.selectedImageIndex = this.inputImages.length - 1;
                        } else {
                            this.setMaxWidth();
                        }
                    }, this.inputImages[this.selectedImageIndex].file.type);
                }
            }
        },

        cancelImage(): void {
            URL.revokeObjectURL(this.inputImages[this.selectedImageIndex].url);
            this.inputImages.splice(this.selectedImageIndex, 1);

            if (this.inputImages.length === 0) {
                this.selectedImageIndex = 0;
            } else if (this.selectedImageIndex >= this.inputImages.length) {
                this.selectedImageIndex = this.inputImages.length - 1;
            } else {
                this.setMaxWidth();
            }

            this.$emit("cancelEdit");
        },

        selectImage(i: number): void {
            this.selectedImageIndex = i;
        },

        setMaxWidth(): void {
            this.cropperLoading = true;
            const cropperEl = document.getElementById("cropper-el");
            if (cropperEl) cropperEl.style.maxWidth = this.inputImages[this.selectedImageIndex].cropperHeight;
        }
    },

    watch: {
        async imagesToAdd(): Promise<void> {
            if (this.imagesToAdd.length) {
                let compressionPromises: Promise<File>[] = [];
                let cropperWidthPromises: Promise<string>[] = [];

                // First read the max ratio.
                this.imagesToAdd.forEach(imageToAdd => {
                    cropperWidthPromises.push(this.loadImage(imageToAdd.file).then(image => {
                        const ratio = image.width / image.height;
                        return (this.maxCropperHeight * ratio).toString() + "px";
                    }))
                })
    
                this.imagesToAdd.forEach(imageToAdd => {
                    compressionPromises.push(
                        imageCompression(imageToAdd.file, {
                            maxSizeMB: 1,
                            maxWidthOrHeight: 1920
                        })
                    )
                })
    
                const cropperHeights = await Promise.all(cropperWidthPromises);
                const compressedFiles = await Promise.all(compressionPromises);
                compressedFiles.forEach((compressedFile, index) => {
                    if (this.inputImages.length === 0 && index === 0) {
                        const cropperEl = document.getElementById("cropper-el");
                        if (cropperEl) cropperEl.style.maxWidth = cropperHeights[0];
                    }

                    this.inputImages.push({
                        id: this.imagesToAdd[index].id,
                        file: compressedFile,
                        url: URL.createObjectURL(compressedFile),
                        cropperHeight: cropperHeights[index]
                    })
                })
            }
        },

        selectedImageIndex(): void {
            this.setMaxWidth();
        },

        imagesToEdit(): void {
            this.imagesToEdit.forEach(id => {
                const index = this.editableImages.findIndex(x => x.id === id);

                if (index > -1) {
                    this.inputImages.push(this.editableImages[index]);
                    this.editableImages.splice(index, 1);
                    this.selectedImageIndex = this.inputImages.length - 1;
                    this.$emit("imageAddedFromEdit");
                }
            })
        }
    },



    beforeDestroy() {
        this.inputImages.forEach(image => {
            URL.revokeObjectURL(image.url);
        })

        this.editableImages.forEach(image => {
            URL.revokeObjectURL(image.url);
        })
    }
});
</script>

<style scoped>
.cropper-cont {
    position: relative;
}

.cropper {
    max-height: 450px;
    margin: 0 auto;
}

.crop-button-cont {
    display: flex;
    justify-items: center;
    position: absolute;
    bottom: 5px;
    left: 50%;
    transform: translateX(-50%);
    text-align: center;
}

.crop-button {
    display: flex;
    justify-content: center;
    padding: 3px 15px;
    transition: background .5s;
    font-size: 13px;
    cursor: pointer;
    margin: 0 2px;
}

.crop-add-button {
    color: #fff;
    background: rgba(0, 0, 0, 0.8);
}

.crop-button:hover {
    background: #000;
}

.crop-cancel-button {
    background: #dc3545;
    color: #fff;
    border-color: #dc3545;
}

.crop-cancel-button:hover {
    background: #c82333;
    border-color: #bd2130;
}

.image-selector-cont {
    margin: 0 auto;
    flex-wrap: wrap;
    justify-content: center;
}

.image-selector-item {
    height: 64px;
    width: 64px;
    overflow: hidden;
    margin: 0 4px;
    display: flex;
    align-items: center;
    background: rgba(0, 0, 0, 0.9);
    margin-top: 10px;
}

.image-selector-item img {
    width: 100%;
    height: auto;
    cursor: pointer;
}

.image-selector-item.is-active {
    border-color: #80bdff;
    box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25);
}
</style>

<style>
.cropper .cropperBackground {
    background: transparent;
}
</style>
