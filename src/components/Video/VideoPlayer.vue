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
        }
    },
    data() {
        return {
            player: null
        }
    },

    mounted: function() {
        this.player = videojs(this.$refs.videoPlayer, this.$props.options, function onPlayerReady() {
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