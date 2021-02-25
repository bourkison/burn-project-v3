<template>
    <div>
        <!-- 
            Here we input the images with visibility none so that we can grab the widths of them.
            As b-tabs sets to display none. 
        -->
        <b-card no-body>
            <b-tabs ref="tabs" card fill>
                <b-tab v-for="(image, index) in images" :title="`${(index + 1).toString()}`" :key="image.id">
                    <!-- <div class="text-center" v-if="loadingGetter(index)">
                        <b-spinner />
                    </div> -->
                    <div :id="'imgCont' + index" class="imgCont">
                        <img class="cropperImg" style="visibility:hidden;" :id="'cropper' + index" :src="image.url">
                    </div>
                    <div class="text-center buttons">
                        <b-btn size="sm" variant="outline-danger" @click="deleteImage(index)">Cancel</b-btn>
                        <b-btn size="sm" variant="outline-success" @click="addImage(index)">Add Image</b-btn>
                    </div>
                </b-tab>
            </b-tabs>
        </b-card>
    </div>
</template>

<script>
import Cropper from 'cropperjs'
import imageCompression from 'browser-image-compression'

export default {
    name: 'ImageEditor',
    components: {},
    props: {
        imagesToEdit: {
            type: Array,
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
            imageIncrementor: 0,
        }
    },

    methods: {
        setCropper: function(el, i, w, h) {
            setTimeout(() => {
                // Element is set to hidden as default so loader can show without 
                // not rendering the element due to v-if
                this.cropper.push(new Cropper(el, {
                    scalable: false,
                    viewMode: 3,
                    aspectRatio: 0.9,
                    minContainerWidth: w,
                    minContainerHeight: h,
                    ready: (() => {
                        el.style.visibility = "visible";
                        this.isLoadingArr[i] = false;
                        this.cropperSet ++;
                        console.log("Cropper ready!", this.isLoadingArr, i, el);
                    }),
                }))
            }, 100);
        },

        addImage: function(index) {
            const canvas = this.cropper[index].getCroppedCanvas();
            const url = canvas.toDataURL('png', 1.0);
            this.images[index].url = url;
            this.$emit("addImage", this.images[index]);

            this.images.splice(index, 1);

            // Reload the image uploader.
            this.cropper.forEach(crop => {
                crop.destroy();
            })

            this.cropper = [];

            // Rebuild croppers.
            this.$nextTick(() => {
                let i = 0;
                const width = this.$refs.tabs.$el.clientWidth - 48;
                this.images.forEach(image => {
                    let imgEl = document.querySelector("#cropper" + i);
                    const height = width / image.ratio;
                    this.setCropper(imgEl, i, width, height)
                    i ++;
                })
            })
        },

        deleteImage: function(id) {
            console.log(id);
        },

        loadImage: async img => {
            return new Promise((resolve) => {
                img.onload = async () => {
                    console.log("Image Loaded");
                    resolve(true);
                };
            });
        },

        readFileAsDataURL: async file => {
            return new Promise((resolve) => {
                let fileReader = new FileReader();
                fileReader.onload = () => resolve(fileReader.result);
                fileReader.readAsDataURL(file);
            });
        },

    },
    watch: {
        imagesToEdit: function(n) {
            if (n.length > 0) {
                let compressionPromises = [];
                let readerPromises = [];
                let imagePromises = [];
                let images = [];

                // First compress the imags.
                for (let i = 0; i < n.length; i ++) {
                    compressionPromises.push(imageCompression(n[i], {maxSizeMB: 1, maxWidthOrHeight: 1920 }))
                    this.isLoadingArr.push(true);
                    this.isLoading = true;
                }

                // Once images compressed, convert to Data URLs.
                Promise.all(compressionPromises)
                .then(files => {
                    files.forEach(file => {
                        readerPromises.push(this.readFileAsDataURL(file));
                    })

                    return Promise.all(readerPromises);
                })
                // Once converted, put into an image so we can read ratio.
                .then(urls => {
                    urls.forEach(url => {
                        let image = new Image();
                        image.src = url;
                        this.inputURLs.push(url)
                        images.push(image);
                        imagePromises.push(this.loadImage(image));
                    })

                    return Promise.all(imagePromises)
                })
                // Once image loaded, read the ratio.
                .then(() => {
                    const width = this.$refs.tabs.$el.clientWidth - 48;

                    for (let i = 0; i < images.length; i ++) {
                        const ratio = images[i].width / images[i].height;

                        // This is the initial and wont get deleted so we can edit later on.
                        this.inputImages.push({ id: this.imageIncrementor, url: images[i].src, ratio: ratio });
                        // This is the one that is referenced in template.
                        this.images.push({ id: this.imageIncrementor, url: images[i].src, ratio: ratio })

                        this.imageIncrementor ++;

                        this.$nextTick(() => {
                            let imgEl = document.querySelector("#cropper" + i);

                            const height = width / ratio;

                            this.setCropper(imgEl, i, width, height)
                        })

                    }
                })
            }
        }
    }
}
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