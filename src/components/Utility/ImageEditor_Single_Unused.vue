<template>
    <div>
        <!-- 
            Here we input the images with visibility none so that we can grab the widths of them.
            As b-tabs sets to display none. 
        -->
        <b-card no-body>
            <b-card-body ref="cardBody">
                <div class="text-center" v-if="isLoading">
                    <b-spinner />
                </div>
                <div class="imgCont">
                    <img class="cropperImg" style="visibility:hidden;" :src="inputURL">
                </div>
                <div class="text-editorcenter buttons" v-if="!isLoading">
                    <b-btn size="sm" variant="outline-danger">Delete</b-btn>
                    <b-btn size="sm" variant="outline-success" @click="addImage">Add Image</b-btn>
                </div>
            </b-card-body>
        </b-card>
    </div>
</template>

<script>
import Cropper from 'cropperjs'

export default {
    name: 'ImageEditor',
    props: {
        imageToEdit: {
            type: File,
            required: false
        }
    },
    data() {
        return {
            inputURL: null,
            cropper: null,
            isLoading: false,
        }
    },



    methods: {
        addImage: function() {
            const canvas = this.cropper.getCroppedCanvas();
            const dataURL = canvas.toDataURL();

            this.inputURL = null;
            this.cropper = null;

            this.$emit("addImage", dataURL);

            

            console.log(this.cropper);
        },
    },

    watch: {
        imageToEdit: function(n) {
            if (n) {
                // Read the image and calculate the ratio in order to accurately set cropper
                // And as URL.createObjectURL does not work with Safari
                this.isLoading = true;
                let reader = new FileReader();
                reader.readAsDataURL(n);

                reader.onload = e => {
                    this.inputURL = e.target.result;

                    // Here we set a timeout to allow the element to load in the 
                    // i.target.src. Very unclean, should fix later.
                    setTimeout(() => {
                        let imgEl = document.querySelector('.cropperImg');
                        // Element is set to hidden as default so loader can show without 
                        // not rendering the element due to v-if

                        this.cropper = new Cropper(imgEl, {
                            scalable: false,
                            viewMode: 3,
                            aspectRatio: 0.9,
                            ready: (() => {
                                imgEl.style.visibility = "visible";
                                this.isLoading = false;
                            }),
                        })
                    }, 500)
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