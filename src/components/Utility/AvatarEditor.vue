<template>
    <div id="avatarEditCont">
        <div v-if="image">
            <div id="imgCont">
                <img id="cropperImg" style="visibility:hidden;" :src="image.url" />
            </div>

            <div class="buttons mt-3 mb-1">
                <b-button variant="outline-danger" class="mr-1" size="sm" @click="cancelEdit">Cancel</b-button>
                <b-button variant="outline-dark" class="ml-1" size="sm" @click="addImage">Add Image</b-button>
            </div>
        </div>
        <div v-else class="text-center">
            <b-spinner small />
        </div>
    </div>
</template>

<script>
import Cropper from 'cropperjs'
import imageCompression from 'browser-image-compression'

export default {
    name: 'AvatarEditor',
    props: {
        inputImage: {
            type: File,
            required: true
        }
    },
    data() {
        return {
            isLoading: false,
            initImage: null,
            image: null,

            // Cropper.js:
            cropper: null,
        }
    },

    created: function() {
        if (this.$props.inputImage) {
            this.initEditor();
        }

        console.log("CREATED");
    },

    methods: {
        initEditor: function() {
            this.isLoading = true;

            let image;

            // First compress the image.
            imageCompression(this.$props.inputImage, {maxSizeMB: 1, maxWidthOrHeight: 1920 })
            .then(file => {
                return this.readFileAsDataURL(file)
            })
            // Once compressed, put into an image se we can read the ratio.
            .then(url => {
                image = new Image();
                image.src = url;
                this.inputURL = url;
                this.loadImage(image);
            })
            // Once image is loaded, read the ratio.
            .then(() => {
                console.log(this.$refs);
                let width = document.querySelector("#avatarEditCont").clientWidth;
                const ratio = image.width / image.height;

                // Initial image and doesnt get changed from here so we can edit later.
                this.initImage = { url: image.src, ratio: ratio };
                // This is referenced in template.
                this.image = { url: image.src, ratio: ratio }

                this.$nextTick(() => {
                    const imgEl = document.querySelector("#cropperImg");
                    const imgCont = document.querySelector("#imgCont");

                    let height = width / ratio;

                    if (height > 450) {
                        height = 450;
                        width = height * ratio;
                        imgCont.style.height = "450px";
                        imgCont.style.width = width + "px";
                    }

                    setTimeout(() => {
                        this.cropper = new Cropper(imgEl, {
                            scalable: false,
                            viewMode: 3,
                            aspectRatio: 1,
                            minContainerWidth: width,
                            minContainerHeight: height,
                            ready: (() => {
                                imgEl.style.visibility = "visible";
                                this.isLoading = false;
                            })
                        })
                    })
                })
            })
        },

        cancelEdit: function() {
            console.log("Cancel");
            this.$emit("cancelEdit");
        },

        addImage: function() {
            const canvas = this.cropper.getCroppedCanvas();
            const url = canvas.toDataURL('png', 1.0);

            this.$emit("addImage", url);
        },

        readFileAsDataURL: async file => {
            return new Promise((resolve) => {
                let fileReader = new FileReader();
                fileReader.onload = () => resolve(fileReader.result);
                fileReader.readAsDataURL(file);
            });
        },

        loadImage: async img => {
            return new Promise((resolve) => {
                img.onload = async () => {
                    resolve(true);
                };
            });
        },
    },

    watch: {
        inputImage: function() {
            console.log("CHANGE");
            this.image = null;
            this.initImage = null;
            this.cropper = null;

            this.$nextTick(() => { this.initEditor(); });
        }
    }
}
</script>

<style scoped>
#cropperImg {
    width: 100% !important;
    height: auto !important;
}
#imgCont {
    margin: 0 auto;
    width: 100%;
    height: auto;
    visibility: visible;
}
</style>

<style>
#imgCont .cropper-crop-box, 
#imgCont .cropper-view-box {
    border-radius: 50%;
}

#imgCont .cropper-view-box {
    box-shadow: 0 0 0 1px #39f;
    outline: 0;
}
</style>