<template>
    <div>
        <b-img v-for="(img, index) in editedFiles" :src="img" :key="index" style="max-width:100%;height:auto;"/>
        <div ref="mImgEdit" style="visibility:hidden;position:absolute;">
            <ImageEditor :imagesToEdit="addedFiles" @addImage="addImage" />
        </div>
        <b-form-file id="imageInput" v-model="addedFiles" multiple :state="inputFiles.length > 0" @change="handleFileUpload" :file-name-formatter="formatNames"></b-form-file>
    </div>
</template>

<script>
import ImageEditor from '@/components/Utility/ImageEditor.vue'
export default {
    name: 'ImageUploader',
    components: { ImageEditor },
    data() {
        return {
            inputFiles: [],
            addedFiles: [],
            editedFiles: [],
        }
    },
    methods: {
        formatNames: function() {
            return this.inputFiles.length === 1 ? this.inputFiles[0].name : `${ this.inputFiles.length } files selected`
        },
        
        handleFileUpload: function(e) {
            e.target.files.forEach(file => {
                this.inputFiles.push(file);
            })
        },
        addImage: function(data) {
            this.editedFiles.push(data);
        }
    },
    watch: {
        inputFiles: function() {
            if (this.inputFiles.length > 0) {
                this.$refs.mImgEdit.style.visibility = "visible";
                this.$refs.mImgEdit.style.position = "inherit";
            }
        }
    }
}
</script>