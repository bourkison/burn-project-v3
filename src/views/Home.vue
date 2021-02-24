<template>
    <b-container>
        <b-row>
            <b-col sm="3">

            </b-col>
            <b-col sm="6">
                <b-container v-if="$store.state.userProfile.loggedIn">
                    <PostFeedHome />
                </b-container>
                <b-container v-else>
                    Log in to get started!
                </b-container>
            </b-col>
            <b-col sm="3">

            </b-col>
        </b-row>
    </b-container>
</template>

<script>
import PostFeedHome from '@/components/Post/PostFeedHome.vue'

export default {
    name: 'Home',
    components: { PostFeedHome }
}
</script>
