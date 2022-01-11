<template>
    <div class="text-editor">
        <client-only>
            <div class="menubar">
                <span v-for="actionName in activeButtons" :key="actionName">
                    <button
                        v-if="actionName === 'bold'"
                        class="menubar__button"
                        :class="{ 'is-active': editor.isActive('bold') }"
                        @click="editor.chain().focus().toggleBold().run()"
                    >
                        <b-icon-type-bold />
                    </button>
                    <button
                        v-if="actionName === 'italic'"
                        class="menubar__button"
                        :class="{ 'is-active': editor.isActive('italic') }"
                        @click="editor.chain().focus().toggleItalic().run()"
                    >
                        <b-icon-type-italic />
                    </button>

                    <button
                        v-if="actionName === 'underline'"
                        class="menubar__button"
                        :class="{ 'is-active': editor.isActive('underline') }"
                        @click="editor.chain().focus().toggleUnderline().run()"
                    >
                        <b-icon-type-underline />
                    </button>

                    <button
                        v-if="actionName === 'strike'"
                        class="menubar__button"
                        :class="{ 'is-active': editor.isActive('strike') }"
                        @click="editor.chain().focus().toggleStrike().run()"
                    >
                        <b-icon-type-strikethrough />
                    </button>

                    <button
                        v-if="actionName === 'h1'"
                        class="menubar__button"
                        :class="{ 'is-active': editor.isActive('heading', { level: 1 }) }"
                        @click="editor.chain().focus().toggleHeading({ level: 1 }).run()"
                    >
                        <b-icon-type-h1 />
                    </button>

                    <button
                        v-if="actionName === 'h2'"
                        class="menubar__button"
                        :class="{ 'is-active': editor.isActive('heading', { level: 2 }) }"
                        @click="editor.chain().focus().toggleHeading({ level: 2 }).run()"
                    >
                        <b-icon-type-h2 />
                    </button>

                    <button
                        v-if="actionName === 'bulletList'"
                        class="menubar__button"
                        :class="{ 'is-active': editor.isActive('bulletList') }"
                        @click="editor.chain().focus().toggleBulletList().run()"
                    >
                        <b-icon-list-ul />
                    </button>

                    <button
                        v-if="actionName === 'orderedList'"
                        class="menubar__button"
                        :class="{ 'is-active': editor.isActive('orderedList') }"
                        @click="editor.chain().focus().toggleOrderedList().run()"
                    >
                        <b-icon-list-ol />
                    </button>

                    <button
                        v-if="actionName === 'blockquote'"
                        class="menubar__button"
                        :class="{ 'is-active': editor.isActive('blockquote') }"
                        @click="editor.chain().focus().toggleBlockquote().run()"
                    >
                        <b-icon-blockquote-left />
                    </button>

                    <button
                        v-if="actionName === 'horizontalRule'"
                        class="menubar__button"
                        @click="editor.chain().focus().setHorizontalRule().run()"
                    >
                        <b-icon-hr />
                    </button>

                    <button
                        v-if="actionName === 'undo'"
                        class="menubar__button"
                        @click="editor.chain().focus().undo().run()"
                    >
                        <b-icon-arrow-clockwise />
                    </button>

                    <button
                        v-if="actionName === 'redo'"
                        class="menubar__button"
                        @click="editor.chain().focus().redo().run()"
                    >
                        <b-icon-arrow-counterclockwise />
                    </button>
                </span>
            </div>

            <editor-content class="text-editor__content" :editor="editor" />
        </client-only>
    </div>
</template>

<script>
import { Editor, EditorContent } from "@tiptap/vue-2";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";

export default {
    name: "DescriptionEditor",
    components: { EditorContent },
    props: {
        initialValue: {
            type: String,
            default: "",
        },
        activeButtons: {
            type: Array,
            validator: function (list) {
                for (let el of list) {
                    // The value must match one of these strings
                    if (
                        [
                            "bold",
                            "italic",
                            "strike",
                            "underline",
                            "h1",
                            "h2",
                            "bulletList",
                            "orderedList",
                            "blockquote",
                            "horizontalRule",
                            "undo",
                            "redo",
                        ].indexOf(el) === -1
                    ) {
                        return -1;
                    }
                }
                return 1;
            },
            default: () => [
                "bold",
                "italic",
                "strike",
                "underline",
                "h1",
                "h2",
                "bulletList",
                "orderedList",
                "blockquote",
                "horizontalRule",
                "undo",
                "redo",
            ],
        },
    },
    emits: ["input"],
    data() {
        return {
            editor: null,
        };
    },

    created() {
        this.editor = new Editor({
            content: this.initialValue,
            extensions: [StarterKit, Underline],
            onUpdate: () => {
                this.$emit("input", this.editor.getHTML());
            },
        });
    },

    beforeDestroy() {
        this.editor.destroy();
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

.text-editor {
    position: relative;
    border: 1px solid rgba(0, 0, 0, 0.125);
    border-radius: 3px;
}

.text-editor__content {
    overflow-wrap: break-word;
    word-wrap: break-word;
    word-break: break-word;
    padding: 0 1rem;
}

.text-editor__content .ProseMirror {
    min-height: 15rem;
}

.text-editor__content pre {
    padding: 0.7rem 1rem;
    border-radius: 5px;
    background: black;
    color: white;
    font-size: 0.8rem;
    overflow-x: auto;
}

.text-editor__content ul,
.text-editor__content ol {
    padding-left: 1rem;
}

.text-editor__content li > p,
.text-editor__content li > ol,
.text-editor__content li > ul {
    margin: 0;
}

.text-editor__content a {
    color: inherit;
}

.text-editor__content blockquote {
    border-left: 3px solid rgba(0, 0, 0, 0.1);
    color: rgba(0, 0, 0, 0.8);
    padding-left: 0.8rem;
    font-style: italic;
}

.text-editor__content blockquote p {
    margin: 0;
}

.text-editor__content img {
    max-width: 100%;
    border-radius: 3px;
}

.text-editor__content table {
    border-collapse: collapse;
    table-layout: fixed;
    width: 100%;
    margin: 0;
    overflow: hidden;
}

.text-editor__content table td,
.text-editor__content table th {
    min-width: 1em;
    border: 2px solid grey;
    padding: 3px 5px;
    vertical-align: top;
    box-sizing: border-box;
    position: relative;
}

.text-editor__content table td > *,
.text-editor__content table th > * {
    margin-bottom: 0;
}

.text-editor__content th {
    font-weight: bold;
    text-align: left;
}

.text-editor__content .selectedCell:after {
    z-index: 2;
    position: absolute;
    content: "";
    left: 0;
    right: 0;
    top: 0;
    bottom: 0;
    background: rgba(200, 200, 255, 0.4);
    pointer-events: none;
}

.text-editor__content .column-resize-handle {
    position: absolute;
    right: -2px;
    top: 0;
    bottom: 0;
    width: 4px;
    z-index: 20;
    background-color: #adf;
    pointer-events: none;
}

.text-editor__content .tableWrapper {
    margin: 1em 0;
    overflow-x: auto;
}

.text-editor__content .resize-cursor {
    cursor: ew-resize;
    cursor: col-resize;
}

/* MENUBAR */
.text-editor .menubar {
    margin-bottom: 1rem;
    transition: visibility 0.2s 0.4s, opacity 0.2s 0.4s;
    border-bottom: 1px solid rgba(0, 0, 0, 0.125);
    padding: 0.5rem;
}

.text-editor .menubar.is-hidden {
    visibility: hidden;
    opacity: 0;
}

.text-editor .menubar.is-focused {
    visibility: visible;
    opacity: 1;
    transition: visibility 0.2s, opacity 0.2s;
}

.text-editor .menubar__button {
    vertical-align: middle;
    width: 1.8rem;
    height: 1.2rem;
    font-weight: bold;
    display: inline-flex;
    background: transparent;
    border: 0;
    color: black;
    padding: 0.2rem 0.5rem;
    margin-right: 0.2rem;
    border-radius: 3px;
    cursor: pointer;
}

.text-editor .menubar__button:hover {
    background-color: rgba(0, 0, 0, 0.05);
}

.text-editor .menubar__button.is-active {
    background-color: rgba(0, 0, 0, 0.1);
}

.text-editor .menubar span {
    font-size: 13.3333px;
}
</style>
