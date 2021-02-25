<template>
    <div>
        <b-img v-for="(img, index) in editedFiles" :src="img" :key="index" style="max-width:100%;height:auto;"/>
        <div ref="mImgEdit" style="visibility:hidden;position:absolute;">
            <ImageEditor :imageToEdit="addedFile" @addImage="addImage" />
        </div>
        <b-form-file id="imageInput" v-model="addedFile" @change="handleFileUpload"></b-form-file>
    </div>
</template>

<script>
import ImageEditor from '@/components/Utility/ImageEditor.vue'

export default {
    name: 'ImageUploader',
    components: { ImageEditor },
    data() {
        return {
            addedFile: null,

            editedFiles: [],
        }
    },

    methods: {
        handleFileUpload: function(e) {
            if (e) {
                this.$refs.mImgEdit.style.visibility = "visible";
                this.$refs.mImgEdit.style.position = "inherit";
            }
        },

        addImage: function(data) {
            this.editedFiles.push(data);
            this.addedFile = null;
        }
    }
}
</script>