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

            this.isLoading = false;
        })
        .catch(e => {
            console.error(e);
        })
    }
}
</script>

<style scoped>
    .burn {
        margin-bottom: 25px;
    }
</style>