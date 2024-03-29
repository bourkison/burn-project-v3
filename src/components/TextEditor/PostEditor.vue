<template>
    <div class="post-editor">
        <client-only>
            <editor-content class="post-editor__content" :editor="editor" />

            <div class="menubar d-flex">
                <div>
                    <span title="Add image/video">
                        <label for="file-input" class="menubar__button">
                            <file-image-icon class="menubar__icon" :size="16" />
                        </label>
                    </span>
                    <span title="Add exercise">
                        <button class="menubar__button" @click="$emit('exerciseClick')">
                            <dumbbell-icon class="menubar__icon" :size="16" />
                        </button>
                    </span>
                    <span title="Add template">
                        <button class="menubar__button" @click="$emit('templateClick')">
                            <calendar-text-icon class="menubar__icon" :size="16" />
                        </button>
                    </span>
                    <span title="Add workout">
                        <button class="menubar__button" @click="$emit('workoutClick')">
                            <weight-lifter-icon class="menubar__icon" :size="16" />
                        </button>
                    </span>
                </div>
                <div class="ml-auto">
                    <span title="Create post">
                        <b-button class="menubar__button" @click="$emit('postClick')" :disabled="isLoading">
                            <span v-if="!isLoading" class="my-0 mx-auto">
                                <note-edit-outline-icon class="menubar__icon" :size="16" />
                            </span>
                            <span class="d-flex my-0 mx-auto" v-else>
                                <b-spinner class="align-self-center" style="height:16px;width:16px;" small />
                            </span>
                        </b-button>
                    </span>
                </div>
            </div>
        </client-only>
    </div>
</template>

<script lang="ts">
import Vue, { PropType } from "vue";

import { Editor, EditorContent, VueRenderer } from "@tiptap/vue-2";
import Document from "@tiptap/extension-document";
import Paragraph from "@tiptap/extension-paragraph";
import Text from "@tiptap/extension-text";
import HardBreak from "@tiptap/extension-hard-break";
import History from "@tiptap/extension-history";
import Placeholder from "@tiptap/extension-placeholder";
import Mention from "@tiptap/extension-mention";

import tippy from "tippy.js";

import CalendarTextIcon from "vue-material-design-icons/CalendarText.vue";
import DumbbellIcon from "vue-material-design-icons/Dumbbell.vue";
import WeightLifterIcon from "vue-material-design-icons/WeightLifter.vue";
import FileImageIcon from "vue-material-design-icons/FileImage.vue";
import NoteEditOutlineIcon from "vue-material-design-icons/NoteEditOutline.vue";

import MentionList from "@/components/TextEditor/Mention/MentionList.vue";

const DEBOUNCE_TIME = 500;

export default Vue.extend({
    name: "PostEditor",
    components: {
        EditorContent,
        CalendarTextIcon,
        DumbbellIcon,
        WeightLifterIcon,
        FileImageIcon,
        NoteEditOutlineIcon,
    },
    props: {
        value: {
            type: String as PropType<string>,
            default: "",
        },
        isLoading: {
            type: Boolean as PropType<boolean>,
            required: true
        }
    },
    data() {
        return {
            editor: null as Editor | null,
            suggestionComponent: null as VueRenderer | null,
            suggestionPopup: null as ReturnType<typeof tippy> | null,

            // Debounce:
            timeoutStart: 0,
            loadUsersTimeout: null as ReturnType<typeof setTimeout> | null
        };
    },

    created() {
        this.editor = new Editor({
            content: this.$props.value,
            extensions: [
                Document,
                Paragraph,
                Text,
                History,
                HardBreak,
                Placeholder.configure({
                    placeholder: "New post...",
                }),
                Mention.configure({
                    HTMLAttributes: {
                        class: "user-mention"
                    },
                    suggestion: {
                        items: async ({ query }) => {
                            // Debounce promise
                            if (this.suggestionComponent) {
                                this.suggestionComponent.updateProps({ isLoadingMentions: true });
                            }

                            return await new Promise(async (resolve) => {
                                const now = (new Date()).getTime();

                                if (!this.timeoutStart || now - this.timeoutStart > 500) {
                                    this.timeoutStart = now
                                    resolve(await this.loadUsers(query))
                                } else {
                                    if (this.loadUsersTimeout !== null) {
                                        window.clearTimeout(this.loadUsersTimeout);
                                    }
                                    let waitTime = DEBOUNCE_TIME;

                                    if (this.timeoutStart) {
                                        waitTime = (this.timeoutStart + DEBOUNCE_TIME) - now;
                                    }

                                    this.loadUsersTimeout = setTimeout(async () => {
                                        if (this.suggestionComponent !== null) {
                                            this.timeoutStart = (new Date()).getTime();
                                            resolve(await this.loadUsers(query))
                                        }
                                    }, waitTime)
                                }
                            })
                        },

                        render: () => {
                            return {
                                onStart: (props) => {
                                    this.suggestionComponent = new VueRenderer(MentionList, {
                                        parent: this,
                                        propsData: { ...props, isLoadingMentions: false }
                                    });
        
                                    this.suggestionPopup = tippy('body', {
                                        getReferenceClientRect: props.clientRect,
                                        appendTo: () => document.body,
                                        content: this.suggestionComponent.element,
                                        showOnCreate: true,
                                        interactive: true,
                                        trigger: 'manual',
                                        placement: 'bottom-start',
                                    })
                                },
        
                                onUpdate: (props) => {
                                    if (this.suggestionComponent) this.suggestionComponent.updateProps(props);
                                    if (this.suggestionPopup && this.suggestionPopup[0]) {
                                        this.suggestionPopup[0].setProps({
                                            getReferenceClientRect: props.clientRect,
                                        });
                                    }
                                },
        
                                onKeyDown: (props) => {
                                    if (props.event.key === 'Escape' && this.suggestionPopup) {
                                        this.suggestionPopup[0].hide()
                                        return true
                                    }

                                    // @ts-ignore
                                    return this.suggestionComponent?.ref?.onKeyDown(props)
        
                                },
        
                                onExit: () => {
                                    if (this.suggestionComponent) this.suggestionComponent.destroy()
                                    if (this.suggestionPopup) this.suggestionPopup[0].destroy()
                                }
                            }
                        }
                    }
                })
            ],
            onUpdate: () => {
                if (this.editor) {
                    this.$emit("input", this.editor.getHTML());
                }
            },
        });
    },

    methods: {
        async loadUsers(query: string): Promise<string[]> {
            try {
                if (query.trim() && this.suggestionComponent) {
                    this.suggestionComponent.updateProps({ isLoadingMentions: true });
                    const init = {
                        queryStringParameters: {
                            q: query,
                            collections: "user"
                        }
                    }

                    const response = await this.$accessor.api.getSearch({ init });
                    this.suggestionComponent.updateProps({ isLoadingMentions: false });
                    const usernames = response.user?.map(user => { return user.username });
                    if (usernames) {
                        return usernames;
                    } else {
                        return [];
                    }
                } else {
                    return [];
                }
            }
            catch {
                return [];
            }
        }
    },

    beforeDestroy() {
        if (this.editor) {
            this.editor.destroy();
        }
        
        if (this.loadUsersTimeout) {
            window.clearTimeout(this.loadUsersTimeout);
        }

        if (this.suggestionComponent !== null) {
            this.suggestionComponent.destroy();
        }

        if (this.suggestionPopup && this.suggestionPopup[0] !== null) {
            this.suggestionPopup[0].destroy();
        }
    },
});
</script>

<style>
.post-editor .ProseMirror {
    text-align: initial;
    padding: 0.5rem 1rem;
}

.post-editor {
    position: relative;
    border: 1px solid rgba(0, 0, 0, 0.125);
    border-radius: 3px;
}

.post-editor__content {
    overflow-wrap: break-word;
    word-wrap: break-word;
    word-break: break-word;
    overflow-y: scroll;
    border-radius: 3px;
    transition: border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out
}

.post-editor__content:focus-within {
    border: 1px solid #80bdff;
    box-shadow: 0 0 0 0.15rem rgba(0, 123, 255, 0.25);
}

.post-editor__content .ProseMirror {
    height: 6rem;
}

.post-editor__content .user-mention {
    color: #007bff;
    text-decoration: none;
}

.post-editor__content .user-mention:hover {
    color: #0056b3;
    text-decoration: underline;
    cursor: pointer;
}

.post-editor .menubar {
    transition: visibility 0.2s 0.4s, opacity 0.2s 0.4s;
    border-top: 1px solid rgba(0, 0, 0, 0.125);
    padding: 0.5rem;
}

.post-editor .menubar__button {
    vertical-align: middle;
    width: 1.6rem;
    height: 1.5rem;
    font-weight: bold;
    display: inline-flex;
    background: transparent;
    border: 0;
    color: black;
    margin: 0;
    margin-right: 0.2rem;
    border-radius: 3px;
    cursor: pointer;
    padding: 0;
}

.post-editor .menubar__button:hover {
    background-color: rgba(0, 0, 0, 0.05);
}

.post-editor .menubar span {
    font-size: 13.3333px;
}

.post-editor .menubar__icon {
    margin: 0 auto;
}

.post-editor .ProseMirror p.is-editor-empty:first-child::before {
    content: attr(data-placeholder);
    float: left;
    color: #adb5bd;
    pointer-events: none;
    height: 0;
}

.post-editor .ProseMirror p {
    margin-bottom: 0.3333rem;
}

.post-editor .ProseMirror p:last-child {
    margin-bottom: 0;
}

/* .post-editor .ProseMirror-trailingBreak {
    display: none;
} */
</style>
