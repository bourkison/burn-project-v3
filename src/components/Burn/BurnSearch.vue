<template>
    <div>
        <b-form-input v-model="searchText" placeholder="Search burns..." />

        <div v-if="!isLoading">
            <div v-if="filteredBurns.length > 0" class="mt-3">
                <b-list-group>
                    <b-list-group-item class="d-flex" align-v="center" v-for="burn in filteredBurns" :key="burn.id" @click="selectBurn(burn)" href="#">
                        <div>{{ burn.name }}</div>
                    </b-list-group-item>
                </b-list-group>
            </div>
        </div>

        <div v-else class="text-center mt-3">
            <b-spinner small />
        </div>
    </div>
</template>

<script>
import { userWorkoutsCollection } from '@/firebase'

export default {
    name: 'BurnSearch',
    data() {
        return {
            isLoading: true,
            searchText: '',
            burns: []
        }
    },

    created: function() {
        userWorkoutsCollection(this.$store.state.userProfile.data.uid).get()
        .then(burnSnapshot => {
            // Only push most recent of each workout.
            let uniqueNames = [];
            burnSnapshot.forEach(burn => {
                let data = burn.data();
                if (!uniqueNames.includes(data.name)) {
                    data.id = burn.id;
                    this.burns.push(data);
                    uniqueNames.push(data.name)
                }
            })

            this.isLoading = false;
        })
        .catch(e => {
            console.error("Error downloading burns:", e);
        })
    },

    computed: {
        filteredBurns: function() {
            if (this.searchText) {
                return this.burns.filter(burn => {
                    return burn.name.toLowerCase().includes(this.searchText.toLowerCase());
                })
            } else {
                return this.burns;
            }
        }
    },

    methods: {
        selectBurn: function(burn) {
            this.$emit("selectBurn", burn);
        }
    }

}
</script>