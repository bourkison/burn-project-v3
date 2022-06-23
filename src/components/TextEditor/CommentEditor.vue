<template>
    <div class="comment-editor">
        <client-only>
            <editor-content class="comment-editor__content" :editor="editor" />
        </client-only>
    </div>
</template>

<script lang="ts">
import Vue from 'vue';
import { API } from "aws-amplify"

import { Editor, EditorContent, VueRenderer, Extension } from "@tiptap/vue-2";
import { Plugin, PluginKey } from 'prosemirror-state';
import Document from "@tiptap/extension-document";
import Paragraph from "@tiptap/extension-paragraph";
import Text from "@tiptap/extension-text";
import HardBreak from "@tiptap/extension-hard-break";
import History from "@tiptap/extension-history";
import Placeholder from "@tiptap/extension-placeholder";
import Mention from "@tiptap/extension-mention";


import tippy from "tippy.js";

import MentionList from "@/components/TextEditor/Mention/MentionList.vue";

const DEBOUNCE_TIME = 500;

export default Vue.extend({
    name: "CommentEditor",
    components: {
        EditorContent
    },
    props: {
        value: {
            type: String,
            default: ""
        },
        replyingTo: {
            type: String,
            default: ""
        }
    },
    data() {
        return {
            editor: null as Editor | null,
            suggesting: false,
            suggestionComponent: null as VueRenderer | null,
            suggestionPopup: null as ReturnType<typeof tippy> | null,

            // Debounce:
            timeoutStart: 0,
            loadUsersTimeout: null as ReturnType<typeof setTimeout> | null
        }
    },

    mounted() {
        // Build plugin for emitting "addComment on Enter"
        const EnterHandler = Extension.create({
            name: "EventHandler",
            addProseMirrorPlugins: () => {
                return [
                    new Plugin({
                        props: {
                            // @ts-ignore
                            key: new PluginKey("enterHandler"),
                            handleKeyDown: (view, event) => {
                                if (!this.suggesting && event.key === "Enter" && !event.shiftKey) {
                                    this.$emit("addComment")
                                    return true;
                                }

                                return false;
                            }
                        }
                    })
                ]
            }
        })

        this.editor = new Editor({
            content: this.$props.value,
            extensions: [
                Document,
                Paragraph,
                Text,
                HardBreak,
                History,
                EnterHandler,
                Placeholder.configure({
                    placeholder: "Add a comment...",
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
                                    if (this.loadUsersTimeout) {
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

                                    this.suggesting = true;
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
                                    return this.suggestionComponent.ref?.onKeyDown(props)
                                },
        
                                onExit: () => {
                                    if (this.suggestionPopup) this.suggestionPopup[0].destroy()
                                    if (this.suggestionComponent) this.suggestionComponent.destroy()
                                    this.suggesting = false;
                                }
                            }
                        }
                    }
                })
            ],
            onUpdate: () => {
                if (this.editor) this.$emit("input", this.editor.getHTML());
            },
        });
    },

    methods: {
        async loadUsers(query: string) {
            try {
                if (query.trim() && this.suggestionComponent) {
                    this.suggestionComponent.updateProps({ isLoadingMentions: true });
                    const init = {
                        queryStringParameters: {
                            q: query,
                            collections: "user"
                        }
                    }

                    const response = await this.$accessor.api.getSearch({ init })
                    this.suggestionComponent.updateProps({ isLoadingMentions: false });
                    const usernames = response.user?.map(user => { return user.username });
                    if (usernames) {
                        return usernames;
                    } else {
                        return []
                    }
                } else {
                    return [];
                }
            }
            catch (err) {
                return [];
            }
        }
    },

    watch: {
        value: {
            immediate: true,
            handler(n) {
                if (this.editor) {
                    let html = this.editor.getHTML();
                    if (n !== html) {
                        this.editor.commands.setContent(n);
                    }
                }
            }
        },

        replyingTo(n) {
            if (n && this.editor) {
                this.editor.commands.focus();
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
})
</script>

<style>
.comment-editor {
    position: relative;
    border: 1px solid rgba(0, 0, 0, 0.125);
    border-radius: 3px;
    font-size: 14px;
}

.comment-editor .ProseMirror {
    text-align: initial;
    padding: 0 0.66em;
    min-height: 2em;
}

.comment-editor__content {
    overflow-wrap: break-word;
    word-wrap: break-word;
    word-break: break-word;
    overflow-y: scroll;
    border-radius: 3px;
    transition: border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out
}

.comment-editor__content:focus-within {
    border: 1px solid #80bdff;
    box-shadow: 0 0 0 0.15em rgba(0, 123, 255, 0.25);
}

.comment-editor__content .user-mention {
    color: #007bff;
    text-decoration: none;
}

.comment-editor__content .user-mention:hover {
    color: #0056b3;
    text-decoration: underline;
    cursor: pointer;
}

.comment-editor .menubar {
    transition: visibility 0.2s 0.4s, opacity 0.2s 0.4s;
    border-top: 1px solid rgba(0, 0, 0, 0.125);
    padding: 0.5em;
}

.comment-editor .menubar__button {
    vertical-align: middle;
    width: 1.6em;
    height: 1.5em;
    font-weight: bold;
    display: inline-flex;
    background: transparent;
    border: 0;
    color: black;
    margin: 0;
    margin-right: 0.2em;
    border-radius: 3px;
    cursor: pointer;
    padding: 0;
}

.comment-editor .menubar__button:hover {
    background-color: rgba(0, 0, 0, 0.05);
}

.comment-editor .menubar span {
    font-size: 13.3333px;
}

.comment-editor .menubar__icon {
    margin: 0 auto;
}

.comment-editor .ProseMirror p.is-editor-empty:first-child::before {
    content: attr(data-placeholder);
    float: left;
    color: #adb5bd;
    pointer-events: none;
    height: 0;
}

.comment-editor .ProseMirror p {
    margin-bottom: 0.3333em;
    line-height: 2em;
}

.comment-editor .ProseMirror p:last-child {
    margin-bottom: 0;
}
</style>