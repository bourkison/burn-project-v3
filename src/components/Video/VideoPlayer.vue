<template>
    <div>
        <video ref="videoPlayer" class="video-js vjs-fluid" width></video>
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
            required: true
        }
    },
    data() {
        return {
            player: null,
            defaultOptions: {
                autoplay: true,
                controls: false,
                muted: true
            }
        }
    },

    mounted: function() {
        const options = Object.assign({}, this.defaultOptions, this.$props.options)
        const token = this.$props.token;

        videojs.Hls.xhr.beforeRequest = (options) => {
            console.log("OPTIONS URI:", options);
            options.uri = `${options.uri}${token}`;
            return options;
        }

        this.player = videojs(this.$refs.videoPlayer, options, function onPlayerReady() {
            console.log("On player ready", this);
        })
    },

    beforeDestroy: function() {
        if (this.player) {
            this.player.dispose();
        }
    }
}
</script>