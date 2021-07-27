<template>
    <div>
        <!-- 
            Here we input the images with visibility none so that we can grab the widths of them.
            As b-tabs sets to display none. 
        -->
        <b-card no-body no-title>
            <b-tabs ref="tabs" card fill>
                <b-tab
                    v-for="(image, index) in images"
                    :title="`${(index + 1).toString()}`"
                    :key="image.id"
                >
                    <div class="text-center" v-if="isLoadingArr[index]">
                        <b-spinner />
                    </div>
                    <div :id="'imgCont' + index" class="imgCont">
                        <img
                            class="cropperImg"
                            style="visibility:hidden;"
                            :id="'cropper' + index"
                            :src="image.url"
                        />
                    </div>
                    <div class="text-center buttons">
                        <b-btn
                            size="sm"
                            variant="outline-danger"
                            @click="cancelImage(index, image.id)"
                            >Cancel</b-btn
                        >
                        <b-btn
                            v-if="!image.edit"
                            size="sm"
                            variant="outline-dark"
                            @click="addImage(index)"
                            >Add Image</b-btn
                        >
                        <b-btn
                            v-else
                            size="sm"
                            variant="outline-dark"
                            @click="addImage(index)"
                            >Edit Image</b-btn
                        >
                    </div>
                </b-tab>
            </b-tabs>
        </b-card>
    </div>
</template>

<script>
import Cropper from "cropperjs";
import imageCompression from "browser-image-compression";

export default {
    name: "ImageEditor",
    props: {
        imagesToAdd: {
            type: Array,
            required: false
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
    data() {
        return {
            isLoadingArr: [],
            inputURLs: [],
            cropper: [],
            isLoading: false,
            inputImages: [],
            images: [],

            // Img incrementor:
            imageIncrementor: 0
        };
    },

    created: function() {
        if (this.$props.initId) {
            this.imageIncrementor = this.$props.initId;
        }
    },

    methods: {
        setCropper: function(el, i, w, h) {
            setTimeout(() => {
                // Element is set to hidden as default so loader can show without
                // not rendering the element due to v-if
                this.cropper.push(
                    new Cropper(el, {
                        scalable: false,
                        viewMode: 3,
                        aspectRatio: 0.9,
                        minContainerWidth: w,
                        minContainerHeight: h,
                        ready: () => {
                            el.style.visibility = "visible";
                            this.isLoading = false;
                            this.cropperSet++;
                            console.log(
                                "Cropper ready!",
                                this.isLoadingArr,
                                i,
                                el
                            );
                            this.$set(this.isLoadingArr, i, false);
                        }
                    })
                );
            }, 100);
        },

        addImage: function(index) {
            const canvas = this.cropper[index].getCroppedCanvas();
            const url = canvas.toDataURL("png", 1.0);
            // IMAGES: { id, url, editable, path }
            this.images[index].url = url;
            this.images[index].editable = true;
            this.images[index].path = null;
            this.$emit("addImage", this.images[index]);
            console.log("IMAGE ADD:", this.images[index]);

            this.images.splice(index, 1);

            this.rebuildCroppers();
        },

        cancelImage: function(index, id) {
            this.images.splice(index, 1);
            let inputIndex = this.inputImages.findIndex(x => x.id === id);
            this.inputImages.splice(inputIndex, 1);

            this.rebuildCroppers();
            this.$emit("cancelEdit");
        },

        rebuildCroppers: function() {
            // Reload the image uploader.
            this.cropper.forEach(crop => {
                crop.destroy();
            });

            this.cropper = [];
            this.isLoadingArr = [];

            // Rebuild croppers.
            this.$nextTick(() => {
                let i = 0;
                this.images.forEach(image => {
                    const imgEl = document.querySelector("#cropper" + i);
                    const imgCont = document.querySelector("#imgCont" + i);

                    let width = this.$refs.tabs.$el.clientWidth - 48;

                    this.isLoadingArr.push(true);
                    let height = width / image.ratio;

                    if (height > 600) {
                        height = 600;
                        width = height * image.ratio;

                        imgCont.style.height = "600px";
                        imgCont.style.width = width + "px";
                    }

                    console.log(height);

                    this.setCropper(imgEl, i, width, height);
                    i++;
                });
            });
        },

        loadImage: async img => {
            return new Promise(resolve => {
                img.onload = async () => {
                    console.log("Image Loaded");
                    resolve(true);
                };
            });
        },

        readFileAsDataURL: async file => {
            return new Promise(resolve => {
                let fileReader = new FileReader();
                fileReader.onload = () => resolve(fileReader.result);
                fileReader.readAsDataURL(file);
            });
        }
    },
    watch: {
        imagesToAdd: function(n) {
            if (n.length > 0) {
                let compressionPromises = [];
                let readerPromises = [];
                let imagePromises = [];
                let images = [];

                this.isLoading = true;

                // First compress the imags.
                for (let i = 0; i < n.length; i++) {
                    compressionPromises.push(
                        imageCompression(n[i], {
                            maxSizeMB: 1,
                            maxWidthOrHeight: 1920
                        })
                    );
                    this.isLoadingArr.push(true);
                }

                // Once images compressed, convert to Data URLs.
                Promise.all(compressionPromises)
                    .then(files => {
                        files.forEach(file => {
                            readerPromises.push(this.readFileAsDataURL(file));
                        });

                        return Promise.all(readerPromises);
                    })
                    // Once converted, put into an image so we can read ratio.
                    .then(urls => {
                        urls.forEach(url => {
                            let image = new Image();
                            image.src = url;
                            this.inputURLs.push(url);
                            images.push(image);
                            imagePromises.push(this.loadImage(image));
                        });

                        return Promise.all(imagePromises);
                    })
                    // Once image loaded, read the ratio.
                    .then(() => {
                        for (let i = 0; i < images.length; i++) {
                            let width = this.$refs.tabs.$el.clientWidth - 48;
                            const ratio = images[i].width / images[i].height;

                            // This is the initial and wont get deleted so we can edit later on.
                            this.inputImages.push({
                                id: this.imageIncrementor,
                                url: images[i].src,
                                ratio: ratio
                            });
                            // This is the one that is referenced in template.
                            this.images.push({
                                id: this.imageIncrementor,
                                url: images[i].src,
                                ratio: ratio,
                                edit: false
                            });

                            this.imageIncrementor++;

                            this.$nextTick(() => {
                                let imageIndex =
                                    i +
                                    this.images.length -
                                    this.$props.imagesToAdd.length;
                                const imgEl = document.querySelector(
                                    "#cropper" + imageIndex
                                );
                                const imgCont = document.querySelector(
                                    "#imgCont" + imageIndex
                                );

                                let height = width / ratio;

                                if (height > 600) {
                                    console.log("TOO HIGH", height, i);
                                    height = 600;
                                    width = height * ratio;

                                    imgCont.style.height = "600px";
                                    imgCont.style.width = width + "px";
                                }

                                console.log(
                                    "Setting cropper",
                                    imgEl,
                                    i,
                                    width,
                                    height
                                );
                                this.setCropper(
                                    imgEl,
                                    imageIndex,
                                    width,
                                    height
                                );
                            });
                        }
                    })
                    .catch(e => {
                        console.error("Error setting up for cropper.", e);
                    });
            }
        },

        imagesToEdit: function(n) {
            if (n.length > 0) {
                // Only difference between inputImages and images is the edit key/value.
                // Set that to true.
                const image = this.inputImages.find(
                    x => x.id === n[n.length - 1]
                );
                image.edit = true;
                this.images.push(JSON.parse(JSON.stringify(image)));

                // Now set up the new cropper.
                let width = this.$refs.tabs.$el.clientWidth - 48;
                this.$nextTick(() => {
                    const imgEl = document.querySelector(
                        "#cropper" + (this.images.length - 1).toString()
                    );
                    const imgCont = document.querySelector(
                        "#imgCont" + (this.images.length - 1).toString()
                    );

                    let height = width / image.ratio;

                    if (height > 600) {
                        console.log("TOO HIGH", height);
                        height = 600;
                        width = height * image.ratio;

                        imgCont.style.height = "600px";
                        imgCont.style.width = width + "px";
                    }

                    console.log(height);

                    this.setCropper(
                        imgEl,
                        this.images.length - 1,
                        width,
                        height
                    );
                });
            }
        },

        // Altered in PostNew, and indicates a new post has been added, so all
        // variables must be reset and we start again.
        resetVariablesIncrementor: function() {
            this.isLoadingArr = [];
            this.inputURLs = [];
            this.cropper = [];
            this.isLoading = false;
            this.inputImages = [];
            this.images = [];
            this.imageIncrementor = 0;

            console.log("Editor reset");
        }
    }
};
</script>

<style scoped>
.cropperImg {
    width: 100% !important;
    height: auto !important;
}
.imgCont {
    margin: 0 auto;
    width: 100%;
    height: auto;
    visibility: visible;
}
.buttons {
    margin-top: 15px;
}
.buttons button {
    margin: 0 2px;
}
</style>
