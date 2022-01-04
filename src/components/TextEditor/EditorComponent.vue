<template>
    <editor-menu-bar :editor="editor" v-slot:default="editorParams">
        <div class="border bg-light rounded-top">
            <div class="btn-toolbar p-1" role="toolbar" aria-label="Editor Toolbar">
                <div class="btn-group btn-group-sm mr-2" role="group">
                    <editor-menu-button command="undo" icon="arrow-clockwise" :editor-params="editorParams" />
                    <editor-menu-button command="redo" icon="arrow-counterclockwise" :editor-params="editorParams" />
                </div>
                <div class="btn-group btn-group-sm mr-2" role="group">
                    <editor-menu-button command="bold" icon="type-bold" :editor-params="editorParams" />
                    <editor-menu-button command="italic" icon="type-italic" :editor-params="editorParams" />
                    <editor-menu-button command="underline" icon="type-underline" :editor-params="editorParams" />
                    <editor-menu-button
                        command="strike"
                        icon="type-strikethrough"
                        :editor-params="editorParams"
                    />
                </div>
                <div class="btn-group btn-group-sm mr-2" role="group">
                    <editor-menu-button command="paragraph" icon="paragraph" :editor-params="editorParams" />
                    <editor-menu-button
                        command="heading"
                        icon="type-h1"
                        :args="{ level: 1 }"
                        :editor-params="editorParams"
                    />
                    <editor-menu-button
                        command="heading"
                        icon="type-h2"
                        :args="{ level: 2 }"
                        :editor-params="editorParams"
                    />
                    <editor-menu-button
                        command="bullet_list"
                        icon="list-ul"
                        :editor-params="editorParams"
                    />
                    <editor-menu-button
                        command="ordered_list"
                        icon="list-ol"
                        :editor-params="editorParams"
                    />
                </div>
            </div>
        </div>
    </editor-menu-bar>
</template>

<script>
import { EditorMenuBar } from "tiptap";
import EditorMenuButton from "./EditorMenuButton.vue";

export default {
    name: "app",
    components: {
        EditorMenuButton,
        EditorMenuBar,
    },
    props: {
        editor: {
            type: Object,
            required: true,
        },
    },
};
</script>

<style>
.ProseMirror {
    text-align: initial;
}

.ProseMirror:focus {
    outline: none;
}
</style>
