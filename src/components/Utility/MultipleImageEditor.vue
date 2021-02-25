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

export default {
    name: 'MultipleImageEditor',
    components: {},
    props: {
        imagesToEdit: {
            type: Array,
            required: false
        }
    },

    created: function() {
        console.log(this.$props.imagesToEdit);
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
                const imgCont = document.querySelector("#imgCont" + i);

                // Need to change our reference to imgEl as IDs will change
                // When we add and delete images.
                const id = this.generateId(16);
                console.log(imgEl);
                imgEl.classList.add(id);
                imgEl = document.querySelector('.' + id);

                console.log(imgEl);

                const width = this.$refs.tabs.$el.clientWidth - 48;
                const height = width / ratio;

                console.log(i, width, height);

                console.log("Img el:", imgEl, "Img Cont:", imgCont, "ratio:", ratio);

                this.setCropper(imgEl, i, width, height)
            }, 500)
        },

        addImage: function(index) {
            const canvas = this.cropper[index].getCroppedCanvas();
            this.$emit("addImage", canvas.toDataURL());

            this.isLoadingArr.splice(index, 1);
            this.inputURLs.splice(index, 1);
            this.cropper.splice(index, 1);

            console.log(this.cropper);
        },

        generateId: function(n) {
            let randomChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'
            let id = '';
            // 7 random characters
            for (let i = 0; i < n; i++) {
                id += randomChars.charAt(Math.floor(Math.random() * randomChars.length));
            }
            return id;
        }
    },

    watch: {
        imagesToEdit: function(n) {
            if (n.length > 0) {
                // Read the image and calculate the ratio in order to accurately set cropper later on.
                for (let i = 0; i < n.length; i ++) {
                    let reader = new FileReader();
                    reader.readAsDataURL(n[i]);

                    reader.onload = e => {
                        let image = new Image();
                        image.src = e.target.result;

                        image.onload = i => {
                            const ratio = i.target.width / i.target.height;
                            console.log("IMAGE", i);
                            this.inputURLs.push(i.target.src);
                            this.isLoadingArr.push(true);
                            this.isLoading = true;

                            this.setImageEl(this.inputURLs.length - 1, ratio);
                        }
                    }
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