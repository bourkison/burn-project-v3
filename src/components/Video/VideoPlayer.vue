<template>
    <div>
        <video 
            v-observe-visibility="{ callback: playWhenViewable, intersection: { threshold: 0.5 }}" 
            ref="videoPlayer" 
            class="video-js vjs-fluid vjs-theme-forest" 
            width
            @click="interacted"
        ></video>
    </div>
</template>

<script lang="ts">
import Vue, { PropType } from "vue";
import videojs, { VideoJsPlayerOptions, Player } from 'video.js';

export default Vue.extend({
    name: 'VideoPlayer',
    props: {
        options: {
            type: Object as PropType<VideoJsPlayerOptions>,
            default() {
                return {}
            }
        },
        token: {
            type: String as PropType<string>,
            default: ""
        },
        id: {
            type: String as PropType<string>,
            default: ""
        }
    },
    data() {
        return {
            player: null as Player | null,
            defaultOptions: {
                autoplay: false,
                controls: false,
                muted: true
            } as VideoJsPlayerOptions,
            userInteracted: false,
        }
    },

    mounted() {
        const options = Object.assign({}, this.defaultOptions, this.options);

        if (this.id && this.token) {
            const idArr = this.id.split("/");
            const key = idArr[idArr.length - 1];

            this.$store.commit("setVideoToken", {
                key: key,
                token: this.token
            });

            // @ts-ignore
            videojs.Vhs.xhr.beforeRequest = (options) => {
                const splitUrl = options.uri.split(".");
                const splitId = splitUrl[splitUrl.length - 2].split("/");
                const id = splitId[splitId.length - 2];
                
                const token = this.$accessor.videoTokens[id] && this.$accessor.videoTokens[id].token ? this.$accessor.videoTokens[id].token : "";

                options.uri = `${options.uri}${token}`;
                return options;
            }
        }

        this.player = videojs(this.$refs.videoPlayer, options);
        this.player.controlBar.playToggle.on('click', this.interacted);
    },

    beforeDestroy() {
        if (this.player) {
            this.player.dispose();
        }

        if (this.id && this.token) {
            const key = this.id.split("/")[this.id.split("/").length - 1];
            this.$store.commit("deleteVideoToken", key);
        }
    },

    methods: {
        playWhenViewable(isVisible: boolean) {
            if (!this.userInteracted) {
                if (isVisible && this.player.paused()) {
                    this.player.play();
                } else if (!isVisible && !this.player.paused()) {
                    this.player.pause();
                }
            }
        },

        interacted() {
            this.userInteracted = true;
        }
    }
})
</script>