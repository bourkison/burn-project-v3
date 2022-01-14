<template>
    <div>
        <!-- 
            Here we input the images with visibility none so that we can grab the widths of them.
            As b-tabs sets to display none. 
        -->
        <b-card no-body no-title>
            <cropper 
                :src="inputImages[0] ? inputImages[0].url : null"
                ref="cropper"
                class="cropper"
                id="cropper-el"
                backgroundClass="cropperBackground"
                :stencil-props="{ aspectRatio: 0.9 }"
                :canvas="{ minHeight: 450, maxHeight: 450, minWidth: 0, maxWidth: 2048 }"
                @change="getCropperEvent"
            />
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
    images: {
        id: number;
        url: string;
        ratio: number;
        edit: boolean;
    }[];
    imageIncrementor: number;
    selectedImageIndex: number;
    MAX_CROPPER_HEIGHT: number;
}

export default Vue.extend({
    name: "ImageEditor",
    components: { Cropper },
    props: {
        imagesToAdd: {
            type: Array as PropType<{ file: File, id: string }[]>,
            default: []
        },
        imagesToEdit: {
            type: Array,
            required: false
        },
        initId: {
            type: Number,
            required: false
        },
        resetVariablesIncrementor: {
            type: Number,
            required: false
        }
    },
    data(): ImageEditorData {
        return {
            isLoading: false,
            inputImages: [],
            images: [],
            selectedImageIndex: 0,
            MAX_CROPPER_HEIGHT: 450,

            // Img incrementor:
            imageIncrementor: 0
        };
    },

    created() {
        if (this.initId) {
            this.imageIncrementor = this.initId;
        }
    },

    methods: {
        getCropperEvent(e: any): void {
            console.log("CROPPER:", e);
        },

        async loadImage(file: File): Promise<HTMLImageElement> {
            let image = new Image();
            image.src = URL.createObjectURL(file);

            return await new Promise(resolve => {
                image.onload = async () => {
                    resolve(image);
                }
            })
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
                        return (this.MAX_CROPPER_HEIGHT * ratio).toString() + "px";
                    }))
                })
    
                this.imagesToAdd.forEach(imageToAdd => {
                    console.log("Compressing image...");
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
        }
    },

    beforeDestroy() {
        this.inputImages.forEach(image => {
            URL.revokeObjectURL(image.url);
        })
    }
});
</script>

<style scoped>
.cropper {
    max-height: 450px;
    margin: 0 auto;
}

.buttons {
    margin-top: 15px;
}
.buttons button {
    margin: 0 2px;
}
</style>

<style>
.cropper .cropperBackground {
    background: transparent;
}
</style>
