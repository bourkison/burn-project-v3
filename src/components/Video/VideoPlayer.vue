<template>
    <div>
        <video 
            v-observe-visibility="{ callback: playWhenViewable, intersection: { threshold: 0.5 }}" 
            ref="videoPlayer" 
            class="video-js vjs-fluid vjs-theme-forest" 
            width
        ></video>
    </div>
</template>

<script>
import videojs from 'video.js'

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
            }
        }
    },

    mounted: function() {
        const options = Object.assign({}, this.defaultOptions, this.$props.options);

        if (this.$props.id && this.$props.token) {
            this.$store.commit("setVideoToken", {
                key: this.$props.id,
                token: this.$props.token
            });
        }


        videojs.Vhs.xhr.beforeRequest = (options) => {
            const splitUrl = options.uri.split(".");
            const splitId = splitUrl[splitUrl.length - 2].split("/");
            const id = splitId[splitId.length - 2];
            const token = this.$store.state.videoTokens[id] && this.$store.state.videoTokens[id].token ? this.$store.state.videoTokens[id].token : "";

            options.uri = `${options.uri}${token}`;
            return options;
        }

        this.player = videojs(this.$refs.videoPlayer, options);
    },

    beforeDestroy: function() {
        if (this.player) {
            this.player.dispose();
        }

        if (this.$props.id && this.$props.token) {
            this.$store.commit("deleteVideoToken", this.$props.id);
        }
    },

    methods: {
        playWhenViewable: function(isVisible) {
            if (isVisible && this.player.paused()) {
                this.player.play();
            } else if (!isVisible && !this.player.paused()) {
                this.player.pause();
            }
        }
    }
}
</script>