<template>
    <div>
        <!-- 
            Here we input the images with visibility none so that we can grab the widths of them.
            As b-tabs sets to display none. 
        -->
        <b-card no-body>
            <b-tabs ref="tabs" card fill>
                <b-tab v-for="(image, index) in inputURLs" :title="`${(index + 1).toString()}`" :key="index">
                    <div :id="'imgCont' + index" class="imgCont"><img class="cropperImg" style="width:100%;height:auto;" :id="'cropper' + index" :src="inputURLs[index]"></div>
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
            inputURLs: [],

            cropper: [],
        }
    },

    methods: {
        setCropper: function(el, w, h) {
            // console.log("Img el:", imgEl, "Img Cont:", imgCont, "hidden img el:", hiddenImgEl, "ratio:", ratio);
            setTimeout(() => {
                this.cropper.push(new Cropper(el, {
                    scalable: false,
                    viewMode: 3,
                    aspectRatio: 0.9,
                    minContainerWidth: w,
                    minContainerHeight: h,
                    ready: (c => {
                        console.log("Cropper ready!", c);
                    }),
                    crop: (c => {
                        // Get ID by removing first 7 letters ('cropper') from ID.
                        const iterator = c.target.id.substring(7);
                        console.log(iterator);
                        // const canvas = this.cropper[iterator].getCroppedCanvas();
                        // console.log(canvas.toDataURL());
                    })
                }))
            }, 500);
        },

        setImageEl: function(i, ratio) {
            setTimeout(() => {
                const imgEl = document.querySelector("#cropper" + i);
                const imgCont = document.querySelector("#imgCont" + i);

                const width = this.$refs.tabs.$el.clientWidth - 48;
                const height = width / ratio;

                console.log(i, width, height);

                console.log("Img el:", imgEl, "Img Cont:", imgCont, "ratio:", ratio);

                this.setCropper(imgEl, width, height)
            }, 500)
        },
    },

    watch: {
        imagesToEdit: function(n) {
            if (n.length - this.inputURLs.length > 0) {
                // First create object URLs for the cropper component.
                // let i = 0;
                let newImages = n.length - this.inputURLs.length;
                console.log(newImages);

                for (let i = 0; i < newImages; i ++) {
                    let reader = new FileReader();
                    reader.readAsDataURL(n[this.inputURLs.length + i]);

                    reader.onload = e => {
                        let image = new Image();
                        image.src = e.target.result;

                        image.onload = i => {
                            const ratio = i.target.width / i.target.height;
                            console.log("IMAGE", i);
                            this.inputURLs.push(i.target.src);

                            this.setImageEl(this.inputURLs.length - 1, ratio);
                        }
                    }
                }

                // n.forEach(imageFile => {
                //     let reader = new FileReader();

                //     reader.readAsDataURL(imageFile);

                //     reader.onload = e => {
                //         let image = new Image();
                //         image.src = e.target.result;

                //         image.onload = i => {
                //             const ratio = i.target.width / i.target.height;
                //             this.inputURLs.push(i.target.src);

                //             this.setImageEl(this.inputURLs.length - 1, ratio);
                //         }
                //     }
                // })
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
</style>