<template>
    <div>
        <div>
            <ImageSorter v-if="editedFiles.length > 0" :imagesProp="editedFiles" @editImage="editImage" @deleteImage="deleteImage" @sort="sort" />
        </div>
        <div ref="mImgEdit" class="imageEditor" style="visibility:hidden;position:absolute;">
            <ImageEditor :imagesToAdd="addedFiles" :imagesToEdit="imagesToEdit" @addImage="addImage" @cancelEdit="filesInEdit --" />
        </div>
        <div class="imageInput">
            <b-form-file class="imageInput" v-model="addedFiles" multiple @change="handleFileUpload" :file-name-formatter="formatNames"></b-form-file>
        </div>
    </div>
</template>

<script>
import ImageEditor from '@/components/Utility/ImageEditor.vue'
import ImageSorter from '@/components/Utility/ImageSorter.vue'

export default {
    name: 'ImageUploader',
    components: { ImageEditor, ImageSorter },
    data() {
        return {
            // addedFiles is new files and gets passed to ImageEditor.
            addedFiles: [],
            // editedFiles is whats returned from Image Editor and gets passed to Sorter.
            editedFiles: [],
            // sortedFiles is whats returned from Sorter and is pushed to firebase.
            sortedFiles: [],
            // imagesToEdit is an array of IDs thats passed to image editor that have already been passed through before.
            imagesToEdit: [],

            filesInEdit: 0,

        }
    },
    methods: {
        formatNames: function() {
            return this.filesInEdit === 1 ? '1 file selected' : `${ this.filesInEdit } files selected`
        },
        
        handleFileUpload: function(e) {
            this.filesInEdit += e.target.files.length;
        },
        
        addImage: function(data) {
            delete data.edit;
            delete data.ratio;

            this.editedFiles.push(data);
            this.sortedFiles.push(data);

            this.filesInEdit --;
        },

        editImage: function(id) {
            this.imagesToEdit.push(id);
            this.deleteImage(id);
            this.filesInEdit ++;
        },

        deleteImage: function(id) {
            let editedIndex = this.editedFiles.findIndex(x => x.id === id);
            let sortedIndex = this.sortedFiles.findIndex(x => x.id === id);

            this.editedFiles.splice(editedIndex, 1);
            this.sortedFiles.splice(sortedIndex, 1);
        },

        sort: function(arr) {
            this.sortedFiles = arr;
        }
    },
    watch: {
        filesInEdit: function() {
            if (this.filesInEdit > 0) {
                this.$refs.mImgEdit.style.visibility = "visible";
                this.$refs.mImgEdit.style.position = "inherit";
            } else {
                this.$refs.mImgEdit.style.visibility = "hidden";
                this.$refs.mImgEdit.style.position = "absolute";
            }
        },

        sortedFiles: function() {
            let temp = [];

            this.sortedFiles.forEach(file => {
                temp.push(file.url);
            }) 

            this.$emit("updateImages", temp);
        }
    }
}
</script>

<style scoped>
.imageInput:hover {
    cursor: pointer !important;
}

.imageEditor {
    margin-bottom: 15px;
}
</style>