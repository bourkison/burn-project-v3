<template>
    <b-container>
        <div v-if="burns.length > 0 && !isLoading">
            <BurnComponent class="burn" v-for="burn in burns" :burn="burn" :key="burn.id" />
        </div>
        <div v-else-if="!isLoading">
            <p><em>Looks like you havent had any burns yet.</em></p>
        </div>
        <div v-else>
            <b-spinner />
        </div>
    </b-container>
</template>

<script>
import BurnComponent from '@/components/Burn/BurnComponent'

export default {
    name: 'BurnRecent',
    components: { BurnComponent },
    data() {
        return {
            isLoading: true,
            burns: []
        }
    },

    created: async function() {
        if (this.$store.state.userBurns === null) {
            await this.$store.dispatch('fetchBurns', this.$store.state.userProfile.data)
            .catch(e => { console.error(e) });
        }

        this.burns = this.$store.state.userBurns;
        this.isLoading = false;
    }
}
</script>

<style scoped>
    .burn {
        margin-bottom: 25px;
    }
</style>