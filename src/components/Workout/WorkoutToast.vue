<template>
    <b-toast
        v-model="workoutToast"
        no-auto-hide
        solid
        target
        toaster="b-toaster-bottom-right"
        no-close-button
        header-class="workout-toast-header"
    >
        <template #toast-title>
            <div class="d-flex w-100 align-items pt-1 pb-1">
                <div>
                    <router-link :to="$store.state.activeWorkout.initialUrl">{{
                        $store.state.activeWorkout.workout.name
                    }}</router-link>
                </div>
                <div class="ml-auto d-flex align-items text-muted fs-12">
                    {{ $store.state.activeWorkout.timeString }}
                </div>
            </div>
        </template>

        <div>Test.</div>
        <b-collapse v-model="collapseModel">
            <div>
                <!-- Exercise Recording Goes Here -->
            </div>
        </b-collapse>
    </b-toast>
</template>

<script lang="ts">
import Vue from "vue";

export default Vue.extend({
    name: "WorkoutToast",
    data() {
        return {
            collapseModel: false
        };
    },
    computed: {
        workoutToast: {
            get() {
                return this.$accessor.activeWorkout.displayToast;
            },
            set(value: boolean) {
                this.$accessor.activeWorkout.SET_DISPLAY_TOAST(value);
            }
        }
    }
});
</script>

<style scoped>
.fs-12 {
    font-size: 12px !important;
}

.align-items {
    align-items: center !important;
}
</style>
