<template>
    <b-form @submit.prevent="signIn">
        <b-form-group label="Username" label-for="usernameInput">
            <b-form-input
                id="usernameInput"
                v-model="signInForm.username"
                placeholder="Enter Username"
                required
            />
        </b-form-group>

        <b-form-group label="Password" label-for="passwordInput">
            <b-form-input
                id="passwordInput"
                v-model="signInForm.password"
                type="password"
                placeholder="Enter Password"
                required
            />
        </b-form-group>

        <b-alert variant="danger" class="mt-2" fade :show="alertCountdown" dismissible @dismissed="alertCoundown = 0" @dismiss-count-down="alertCountdownChanged">
            {{ errorMessage }}
        </b-alert>

        <b-form-group class="text-center">
            <b-form-checkbox
                inline
                name="rememberDeviceCheckbox"
                v-model="rememberDevice"
            >
                Remember device
            </b-form-checkbox>
        </b-form-group>

        <div class="text-center">
            <b-button type="submit" variant="primary" :disabled="isLoading">
                <span v-if="isLoading"><b-spinner small/></span>
                <span v-else>Login</span>
            </b-button>
        </div>
    </b-form>
</template>

<script>
import { Auth } from "aws-amplify";

export default {
    name: "SignIn",
    data() {
        return {
            isLoading: false,
            signInForm: {
                username: "",
                password: ""
            },
            rememberDevice: false,

            // Error Handling
            dismissSecs: 10,
            alertCountdown: 0,
            errorMessage: ''
        };
    },

    methods: {
        signIn: async function() {
            this.isLoading = true;

            const user = await Auth.signIn(this.signInForm.username, this.signInForm.password)
            .catch(err => {
                console.log("ERROR:", err);
                this.errorMessage = err.message;
                this.alertCountdown = this.dismissSecs;
                this.isLoading = false;
            });

            if (user) {
                if (this.rememberDevice) {
                    await Auth.rememberDevice();
                }
    
                await this.$store.dispatch("fetchUser", user.signInUserSession);
                this.isLoading = false;
            }
        },

        alertCountdownChanged: function(alertCountdown) {
            this.alertCountdown = alertCountdown;
        }
    }
};
</script>
