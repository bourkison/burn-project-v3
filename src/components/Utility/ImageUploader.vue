<template>
    <div>
        <MultipleImageEditor :imagesToEdit="inputFiles" />
        <b-form-file id="imageInput" v-model="addedFiles" multiple :state="inputFiles.length > 0" @change="handleFileUpload" :file-name-formatter="formatNames"></b-form-file>
    </div>
</template>

<script>
import MultipleImageEditor from '@/components/Utility/MultipleImageEditor.vue'

export default {
    name: 'ImageUploader',
    components: { MultipleImageEditor },
    data() {
        return {
            inputFiles: [],
            addedFiles: []
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
        }
    }
}
</script>