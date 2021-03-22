<template>
    <b-card no-body>
        <b-card-body>
            <b-card-text>
                <b-form-textarea v-model="post.content" rows="3" no-resize placeholder="New post..."  />
                <div class="d-flex mt-1 p-1" align-v="center">
                    <div>
                        <b-icon-card-image font-scale="1.2" class="mr-1 clickableIcon" />
                        <b-icon-bicycle font-scale="1.2" class="mr-1 clickableIcon" />
                        <b-icon-droplet font-scale="1.2" class="mr-1 clickableIcon" />
                        <b-icon-award font-scale="1.2" class="mr-1 clickableIcon" />
                    </div>
                    <div class="ml-auto">
                        <b-button size="sm" variant="outline">Post</b-button>
                    </div>
                </div>
            </b-card-text>
        </b-card-body>
    </b-card>
</template>

<script>
export default {
    name: 'PostNew',
    data() {
        return {
            post: {
                content: ""
            }
        }
    }
}
</script>

<style scoped>
.clickableIcon {
    vertical-align: middle !important;
}

.clickableIcon:hover {
    cursor: pointer;
}
</style>