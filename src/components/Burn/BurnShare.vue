<template>
    <b-container>
        <div v-if="!isLoading">
            <b-row class="text-center font-weight-bold">
                <b-col cols="1">#</b-col>
                <b-col cols="5">Exercise Name</b-col>
                <b-col cols="3">Kg</b-col>
                <b-col cols="3">Reps</b-col>
            </b-row>

            <div v-for="(exercise, index) in burn.exercises" :key="index">
                <b-row class="text-center mt-1">
                    <b-col cols="1" class="setAmountHoverable" v-b-toggle="'setsCollapse-' + burn.id + index">{{ exercise.sets.length }}</b-col>

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

                <b-collapse :id="'setsCollapse-' + burn.id + index">
                    <b-row v-for="(set, index) in exercise.sets" :key="index" class="text-center mt-1 text-muted font-weight-light">
                        <b-col cols="1"></b-col>
                        <b-col cols="5">{{ index + 1 }}</b-col>
                        <b-col cols="3">{{ exercise.sets[index].kg }}</b-col>
                        <b-col cols="3">{{ exercise.sets[index].measureAmount }}</b-col>
                    </b-row>
                </b-collapse>
            </div>
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

<style scoped>
.setAmountHoverable:hover {
    cursor: pointer;
    text-decoration: underline;
}

/* Disable highlight */
.setAmountHoverable {
    -webkit-touch-callout: none; /* iOS Safari */
    -webkit-user-select: none; /* Safari */
    -khtml-user-select: none; /* Konqueror HTML */
    -moz-user-select: none; /* Old versions of Firefox */
    -ms-user-select: none; /* Internet Explorer/Edge */
    user-select: none; /* Non-prefixed version, currently supported by Chrome, Edge, Opera and Firefox */
}
</style>