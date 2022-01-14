<template>
    <div>
        <div ref="mImgEdit" class="imageEditor">
            <ImageEditor
                :imagesToAdd="addedFiles"
                :imagesToEdit="imagesToEdit"
                @addImage="addImage"
                @imageAddedFromEdit="imagesToEdit = []"
                @cancelEdit="filesInEdit--"
                :resetVariablesIncrementor="resetVariablesIncrementor"
                :maxCropperHeight="450"
            />
        </div>
        <div v-if="displayVideo" class="p-2">
            <VideoPlayer :options="videoOptions" class="video-player" />
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
                accept="image/*,video/*"
                multiple
                @change="handleFileUpload"
                :name="formatNames"
            ></b-form-file>
        </div>
        <div class="d-inline" v-else>
            <input
                type="file"
                id="file-input"
                style="display: none;"
                accept="image/*,video/*"
                multiple
                @change="handleFileUpload"
            />
        </div>
    </div>
</template>

<script lang="ts">
import Vue, { PropType } from "vue"

import { v4 as uuid } from "uuid"
import ImageEditor from "@/components/Utility/ImageEditor.vue";
import ImageSorter from "@/components/Utility/ImageSorter.vue";
import VideoPlayer from "@/components/Video/VideoPlayer.vue";

type ImageUploaderData = {
    addedFiles: {
        file: File,
        id: string
    }[]
    editedFiles: TImage[];
    sortedFiles: TImage[];
    imagesToEdit: string[];
    filesInEdit: number;
    displayVideo: boolean;
    videoFile: File | null;
    videoOptions: {
        autoplay: boolean;
        controls: boolean;
        sources: {
            src: string;
            type: string;
        }[]
    } | null;
}

type TImage = {
    id: string;
    file: File;
    url: string;
    editable: boolean;
    path: string | null;
}

export default Vue.extend({
    name: "ImageUploader",
    components: { ImageEditor, ImageSorter, VideoPlayer },
    props: {
        initImages: {
            type: Array as PropType<TImage[]>,
            default: []
        },
        inlineDisplay: {
            type: Boolean as PropType<boolean>,
            required: true
        },
        resetVariablesIncrementor: {
            type: Number as PropType<number>,
            required: false
        }
    },
    data(): ImageUploaderData {
        return {
            // addedFiles is new files and gets passed to ImageEditor.
            addedFiles: [],
            // editedFiles is whats returned from Image Editor and gets passed to Sorter.
            editedFiles: [],
            // sortedFiles is whats returned from Sorter and is uploaded.
            sortedFiles: [],
            // imagesToEdit is an array of IDs thats passed to image editor that have already been passed through before.
            imagesToEdit: [],

            filesInEdit: 0,

            displayVideo: false,
            videoFile: null,
            videoOptions: null
        };
    },

    computed: {
        formatNames(): string {
            return this.filesInEdit === 1
                ? "1 file selected"
                : `${this.filesInEdit.toString()} files selected`;
        }
    },

    created() {
        this.initImages.forEach(img => {
            this.sortedFiles.push(img);
            this.editedFiles.push(img);
        });
    },

    methods: {
        async handleFileUpload(e: Event): Promise<void> {
            let files = (e.target as HTMLInputElement).files;

            if (!files || !files.length) {
                return;
            }

            // First ensure all files are image, or there is only 1 video file.
            for (let i = 0; i < files.length; i++) {
                if (!files[i].type.includes("image/") && !files[i].type.includes("video/")) {
                    throw new Error("Unrecognised file type.");
                }

                if (files[i].type.includes("video/") && files.length > 1) {
                    throw new Error("Can only upload 1 video");
                }
            }

            if (files[0].type.includes("image/")) {
                if (this.videoFile) {
                    this.videoFile = null;
                    this.displayVideo = false;
                }

                this.filesInEdit += files.length;
    
                this.addedFiles = [];

                for (let i = 0; i < files.length; i++) {
                    this.addedFiles.push({
                        file: files[i],
                        id: uuid()
                    });
                }
            } else {
                // Video upload logic:
                if (this.videoFile) {
                    this.videoFile = null;
                    this.displayVideo = false;

                    await this.$nextTick();
                }

                if (this.addedFiles.length) {
                    this.$emit("resetVariables");
                    await this.$nextTick();
                }

                this.videoFile = files[0];

                this.videoOptions = {
                    autoplay: true,
                    controls: true,
                    sources: [
                        {
                            src: URL.createObjectURL(files[0]),
                            type: files[0].type
                        }
                    ]
                }
    
                this.displayVideo = true;
                this.$emit("updateVideo", this.videoFile);
            }
        },

        addImage(data: TImage) {
            this.editedFiles.push(data);
            this.sortedFiles.push(data);

            this.filesInEdit--;
        },

        editImage(id: string) {
            this.imagesToEdit.push(id);
            this.deleteImage(id);
            this.filesInEdit++;
        },

        deleteImage(id: string) {
            let editedIndex = this.editedFiles.findIndex(x => x.id === id);
            let sortedIndex = this.sortedFiles.findIndex(x => x.id === id);

            if (!this.sortedFiles[sortedIndex].editable) {
                // @ts-ignore
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
                    .then((value: boolean) => {
                        if (value) {
                            this.$emit("deleteInitImage", this.sortedFiles[sortedIndex].path);
                            this.editedFiles.splice(editedIndex, 1);
                            this.sortedFiles.splice(sortedIndex, 1);
                        }
                    })
                    .catch((e: any) => {
                        console.error(e);
                    });
            } else {
                this.editedFiles.splice(editedIndex, 1);
                this.sortedFiles.splice(sortedIndex, 1);
            }
        },

        sort(arr: TImage[]) {
            this.sortedFiles = arr;
        }
    },
    watch: {
        filesInEdit() {
            if (this.$refs.mImgEdit) {
                if (this.filesInEdit > 0) {
                    (this.$refs.mImgEdit as HTMLElement).style.visibility = "visible";
                    (this.$refs.mImgEdit as HTMLElement).style.position = "inherit";
                } else {
                    (this.$refs.mImgEdit as HTMLElement).style.visibility = "hidden";
                    (this.$refs.mImgEdit as HTMLElement).style.position = "absolute";
                }
            }
        },

        sortedFiles() {
            this.$emit("updateImages", this.sortedFiles);
        },

        // Changed in PostNew. Is an indication to reset all variables within.
        resetVariablesIncrementor() {
            this.addedFiles = [];
            this.editedFiles = [];
            this.sortedFiles = [];
            this.imagesToEdit = [];
            this.filesInEdit = 0;
            this.displayVideo = false;
            this.videoFile = null;

            console.log("Uploader reset");
        }
    },

    beforeDestroy() {
        if (this.videoOptions && this.videoOptions.sources) {
            URL.revokeObjectURL(this.videoOptions.sources[0].src);
        }

        this.editedFiles.forEach(file => {
            URL.revokeObjectURL(file.url);
        })

        this.sortedFiles.forEach(file => {
            URL.revokeObjectURL(file.url);
        })
    }
});
</script>

<style scoped>
.imageInput:hover {
    cursor: pointer !important;
}

.imageEditor {
    margin-bottom: 15px;
    visibility:hidden;
    position:absolute;
}

.videoPlayer {
    width: 100%;
    height: auto;
}
</style>
