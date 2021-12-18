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

<script>
import videojs from 'video.js';

export default {
    name: 'VideoPlayer',
    props: {
        options: {
            type: Object,
            default() {
                return {}
            }
        },
        token: {
            type: String,
            default: ""
        },
        id: {
            type: String,
            default: ""
        }
    },
    data() {
        return {
            player: null,
            defaultOptions: {
                autoplay: false,
                controls: false,
                muted: true
            },
            userInteracted: false,
        }
    },

    mounted: function() {
        const options = Object.assign({}, this.defaultOptions, this.$props.options);

        if (this.$props.id && this.$props.token) {
            const idArr = this.$props.id.split("/");
            const key = idArr[idArr.length - 1];

            this.$store.commit("setVideoToken", {
                key: key,
                token: this.$props.token
            });

            videojs.Vhs.xhr.beforeRequest = (options) => {
                const splitUrl = options.uri.split(".");
                const splitId = splitUrl[splitUrl.length - 2].split("/");
                const id = splitId[splitId.length - 2];
                
                const token = this.$store.state.videoTokens[id] && this.$store.state.videoTokens[id].token ? this.$store.state.videoTokens[id].token : "";

                options.uri = `${options.uri}${token}`;
                return options;
            }
        }

        this.player = videojs(this.$refs.videoPlayer, options);
        this.player.controlBar.playToggle.on('click', this.interacted);
    },

    beforeDestroy: function() {
        if (this.player) {
            this.player.dispose();
        }

        if (this.$props.id && this.$props.token) {
            const key = this.$props.id.split("/")[this.$props.id.split("/").length - 1];
            this.$store.commit("deleteVideoToken", key);
        }
    },

    methods: {
        playWhenViewable: function(isVisible) {
            if (!this.userInteracted) {
                if (isVisible && this.player.paused()) {
                    this.player.play();
                } else if (!isVisible && !this.player.paused()) {
                    this.player.pause();
                }
            }
        },

        interacted: function() {
            this.userInteracted = true;
        }
    }
}
</script>