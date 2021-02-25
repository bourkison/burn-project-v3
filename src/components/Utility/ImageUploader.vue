<template>
    <div>
        <div>
            <ImageSorter :imagesProp="editedFiles" @sort="sort" />
        </div>
        <div ref="mImgEdit" style="visibility:hidden;position:absolute;">
            <ImageEditor :imagesToEdit="addedFiles" @addImage="addImage" />
        </div>
        <b-form-file id="imageInput" v-model="addedFiles" multiple :state="inputFiles.length > 0" @change="handleFileUpload" :file-name-formatter="formatNames"></b-form-file>
        <!-- <div>
            <b-row>
                <b-col v-for="(img, index) in sortedFiles" :key="index">
                    <b-card :img-src="img.url" img-top>
                    <b-card-text class="text-center">
                        {{ index }}
                    </b-card-text>
                </b-card>
                </b-col>
            </b-row>
        </div> -->
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
            // inputFiles is all files.
            inputFiles: [],
            // addedFiles is new files and gets passed to ImageEditor.
            addedFiles: [],
            // editedFiles is whats returned from Image Editor and gets passed to Sorter.
            editedFiles: [],
            // sortedFiles is whats returned from Sorter and is pushed to firebase.
            sortedFiles: [],

            // Image iterator used for keeping track of images and allowed edit.

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
            this.sortedFiles.push(data);
        },

        sort: function(arr) {
            this.sortedFiles = arr;
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

<style scoped>
#imageInput:hover {
    cursor: pointer;
}
</style>