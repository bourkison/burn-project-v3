<template>
    <b-container>
        <BurnComponent class="burn" v-for="burn in burns" :burn="burn" :key="burn.id" />
    </b-container>
</template>

<script>
import { db } from '@/firebase'
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

    created: function() {
        db.collection("users").doc(this.$store.state.userProfile.data.uid).collection("burns").orderBy("createdAt", "desc").get()
        .then(burnSnapshot => {
            burnSnapshot.forEach(burn => {
                const data = burn.data();
                data.id = burn.id;
                
                this.burns.push(data);
            })
        })
    }
}
</script>

<style scoped>
    .burn {
        margin-bottom: 25px;
    }
</style>