<template>
    <div>
        <!-- 
            Here we input the images with visibility none so that we can grab the widths of them.
            As b-tabs sets to display none. 
        -->
        <b-card no-body>
            <b-tabs ref="tabs" card fill>
                <b-tab v-for="(image, index) in inputURLs" :title="`${(index + 1).toString()}`" :key="index">
                    <!-- <div class="text-center" v-if="loadingGetter(index)">
                        <b-spinner />
                    </div> -->
                    <div :id="'imgCont' + index" class="imgCont">
                        <img class="cropperImg" style="visibility:hidden;" :id="'cropper' + index" :src="inputURLs[index]">
                    </div>
                    <div class="text-center buttons">
                        <b-btn size="sm" variant="outline-danger">Delete</b-btn>
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
            }, 500);
        },

        setImageEl: function(i, ratio) {
            setTimeout(() => {
                let imgEl = document.querySelector("#cropper" + i);

                const width = this.$refs.tabs.$el.clientWidth - 48;
                const height = width / ratio;

                this.setCropper(imgEl, i, width, height)
            }, 500)
        },

        addImage: function(index) {
            const canvas = this.cropper[index].getCroppedCanvas();
            this.$emit("addImage", canvas.toDataURL('png', 1.0));
            this.inputURLs.splice(index, 1);

            this.cropper.forEach(crop => {
                crop.destroy();
            })

            this.cropper = [];

            const temp = this.inputURLs;
            this.inputURLs = [];
            this.isLoadingArr = [];

            console.log("TEMP:", temp);
            temp.forEach(url => {
                this.buildCrop(url)
            })
        },

        buildCrop: function(e) {
            let image = new Image();
            image.src = e;

            image.onload = i => {
                const ratio = i.target.width / i.target.height;

                this.inputURLs.push(i.target.src);
                this.isLoadingArr.push(true);
                this.isLoading = true;

                this.setImageEl(this.inputURLs.length - 1, ratio);
            }
        },
    },
    watch: {
        imagesToEdit: function(n) {
            if (n.length > 0) {
                // Before sending through to our build crop function, compress the image.
                for (let i = 0; i < n.length; i ++) {
                    imageCompression(n[i], {maxSizeMB: 1, maxWidthOrHeight: 1920 })
                    .then(file => {
                        let reader = new FileReader();
                        reader.readAsDataURL(file);
                        reader.onload = e => {
                            this.buildCrop(e.target.result);
                        }
                    })
                }
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