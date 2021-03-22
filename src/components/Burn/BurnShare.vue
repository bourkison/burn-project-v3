<template>
    <b-container>
        <div v-if="!isLoading">
            <b-row class="text-center font-weight-bold">
                <b-col cols="1">#</b-col>
                <b-col cols="5">Exercise Name</b-col>
                <b-col cols="3">Kg</b-col>
                <b-col cols="3">Reps</b-col>
            </b-row>

            <b-row class="text-center mt-1" v-for="(exercise, index) in burn.exercises" :key="index">
                <b-col cols="1">{{ exercise.sets.length }}</b-col>

                <b-col cols="5">
                    <router-link :to="'/exercises/' + exercise.id">{{ exercise.name }}</router-link>
                </b-col>

                <b-col cols="3">
                    {{ exercise.sets[0].kg }}
                </b-col>

                <b-col cols="3">
                    {{ exercise.sets[0].measureAmount }}
                </b-col>
            </b-row>
        </div>
        <div v-else class="text-center">
            <b-spinner small />
        </div>
    </b-container>
</template>

<script>
import { db } from '@/firebase'

export default {
    name: 'BurnShare',
    props: {
        burnId: {
            type: String,
            required: true
        },
        userId: {
            type: String,
            required: true
        }
    },
    data() {
        return {
            isLoading: true,
            burn: {}
        }
    },

    created: function() {
        this.downloadBurn();
    },

    methods: {
        downloadBurn: function() {
            db.collection("users").doc(this.$props.userId).collection("burns").doc(this.$props.burnId).get()
            .then(burnDoc => {
                this.burn = burnDoc.data();
                this.burn.id = burnDoc.id;

                this.isLoading = false;
            })
        }
    },

    watch: {
        burnId: function() {
            this.downloadBurn();
        }
    }
}
</script>