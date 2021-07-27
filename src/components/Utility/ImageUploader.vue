<template>
    <div>
        <div
            ref="mImgEdit"
            class="imageEditor"
            style="visibility:hidden;position:absolute;"
        >
            <ImageEditor
                :imagesToAdd="addedFiles"
                :initId="initId"
                :imagesToEdit="imagesToEdit"
                @addImage="addImage"
                @cancelEdit="filesInEdit--"
                :resetVariablesIncrementor="resetVariablesIncrementor"
            />
        </div>
        <div>
            <ImageSorter
                v-if="editedFiles.length > 0"
                :imagesProp="editedFiles"
                @editImage="editImage"
                @deleteImage="deleteImage"
                @sort="sort"
            />
        </div>
        <div class="imageInput" v-if="!inlineDisplay">
            <b-form-file
                class="imageInput"
                v-model="addedFiles"
                multiple
                @change="handleFileUpload"
                :file-name-formatter="formatNames"
            ></b-form-file>
        </div>
        <div class="d-inline" v-else>
            <input
                type="file"
                id="file-input"
                style="display: none;"
                multiple
                @change="handleFileUpload"
            />
        </div>
    </div>
</template>

<script>
import ImageEditor from "@/components/Utility/ImageEditor.vue";
import ImageSorter from "@/components/Utility/ImageSorter.vue";

export default {
    name: "ImageUploader",
    components: { ImageEditor, ImageSorter },
    props: {
        initImages: {
            type: Array,
            required: false
        },
        inlineDisplay: {
            type: Boolean,
            required: true
        },
        resetVariablesIncrementor: {
            type: Number,
            required: false
        }
    },
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

            // initId is the number of images passed at the start
            // Used for determining new image IDs.
            initId: 0,

            filesInEdit: 0
        };
    },

    created: function() {
        if (this.$props.initImages) {
            this.$props.initImages.forEach(img => {
                this.sortedFiles.push(img);
                this.editedFiles.push(img);
            });

            this.initId = this.$props.initImages.length;
        }
    },

    methods: {
        formatNames: function() {
            return this.filesInEdit === 1
                ? "1 file selected"
                : `${this.filesInEdit} files selected`;
        },

        handleFileUpload: function(e) {
            this.filesInEdit += e.target.files.length;

            if (this.$props.inlineDisplay) {
                this.addedFiles = [];

                e.target.files.forEach(file => {
                    this.addedFiles.push(file);
                });
            }
        },

        addImage: function(data) {
            delete data.edit;
            delete data.ratio;

            this.editedFiles.push(data);
            this.sortedFiles.push(data);

            this.filesInEdit--;
        },

        editImage: function(id) {
            this.imagesToEdit.push(id);
            this.deleteImage(id);
            this.filesInEdit++;
        },

        deleteImage: function(id) {
            let editedIndex = this.editedFiles.findIndex(x => x.id === id);
            let sortedIndex = this.sortedFiles.findIndex(x => x.id === id);

            if (!this.sortedFiles[sortedIndex].editable) {
                this.$bvModal
                    .msgBoxConfirm(
                        "You are about to delete an image that you have already uploaded. Are you sure?",
                        {
                            title: "Confirm",
                            size: "sm",
                            buttonSize: "sm",
                            okVariant: "danger",
                            okTitle: "Delete",
                            cancelTitle: "No",
                            footerClass: "p2",
                            hideHeaderClose: false,
                            centered: true
                        }
                    )
                    .then(value => {
                        if (value) {
                            this.$emit(
                                "deleteInitImage",
                                this.sortedFiles[sortedIndex].path
                            );
                            this.editedFiles.splice(editedIndex, 1);
                            this.sortedFiles.splice(sortedIndex, 1);
                        }
                    })
                    .catch(e => {
                        console.error(e);
                    });
            } else {
                this.editedFiles.splice(editedIndex, 1);
                this.sortedFiles.splice(sortedIndex, 1);
            }
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
            this.$emit("updateImages", this.sortedFiles);
        },

        // Changed in PostNew. Is an indication to reset all variables within.
        resetVariablesIncrementor: function() {
            this.addedFiles = [];
            this.editedFiles = [];
            this.sortedFiles = [];
            this.imagesToEdit = [];
            this.initId = 0;
            this.filesInEdit = 0;

            console.log("Uploader reset");
        }
    }
};
</script>

<style scoped>
.imageInput:hover {
    cursor: pointer !important;
}

.imageEditor {
    margin-bottom: 15px;
}
</style>
