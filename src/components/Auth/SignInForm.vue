<template>
    <div v-if="!forgotPassword">
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

            <b-alert
                variant="danger"
                class="mt-2"
                fade
                :show="alertCountdown"
                dismissible
                @dismissed="alertCoundown = 0"
                @dismiss-count-down="alertCountdownChanged"
            >
                {{ errorMessage }}
            </b-alert>

            <b-form-group class="text-center">
                <b-form-checkbox inline name="rememberDeviceCheckbox" v-model="rememberDevice">
                    Remember device
                </b-form-checkbox>
            </b-form-group>

            <div class="text-center">
                <b-button type="submit" variant="primary" :disabled="isLoading">
                    <span v-if="isLoading"><b-spinner small/></span>
                    <span v-else>Login</span>
                </b-button>
            </div>
            <div class="text-center mt-2">
                <b-link
                    to="#"
                    @click="
                        forgotPassword = true;
                        alertCountdown = 0;
                    "
                    >Forgot Password</b-link
                >
            </div>
        </b-form>
    </div>
    <div v-else>
        <div v-if="!isResettingPassword">
            <div>Enter username below to reset your password.</div>

            <b-form class="mt-2" @submit.prevent="sendPasswordReset">
                <b-form-group label="Username" label-for="usernameInput">
                    <b-form-input
                        id="usernameInput"
                        v-model="resetPasswordForm.username"
                        placeholder="Enter Username"
                        required
                    />
                </b-form-group>

                <b-alert
                    variant="danger"
                    class="mt-2"
                    fade
                    :show="alertCountdown"
                    dismissible
                    @dismissed="alertCoundown = 0"
                    @dismiss-count-down="alertCountdownChanged"
                >
                    {{ errorMessage }}
                </b-alert>

                <div class="text-center">
                    <b-button type="submit" variant="primary" :disabled="isLoading">
                        <span v-if="isLoading"><b-spinner small/></span>
                        <span v-else>Send Code</span>
                    </b-button>
                </div>
            </b-form>
        </div>
        <div v-else>
            <div>
                You have been sent a code to your email. Input the code and a new password to change
                your password.
            </div>

            <b-form class="mt-2" @submit.prevent="resetPassword">
                <b-form-group label="Code" label-for="codeInput">
                    <b-form-input
                        id="codeInput"
                        v-model="resetPasswordForm.code"
                        placeholder="Enter Code"
                        required
                    />
                </b-form-group>

                <b-form-group label="Password" label-form="passwordInput">
                    <b-form-input
                        id="passwordInput"
                        type="password"
                        v-model="resetPasswordForm.password"
                        placeholder="Enter Password"
                        required
                    />
                </b-form-group>

                <b-form-group label="Confirm Password" label-for="confPasswordInput">
                    <b-form-input
                        id="confPasswordInput"
                        type="password"
                        v-model="resetPasswordForm.confPassword"
                        placeholder="Confirm Password"
                        required
                    />
                </b-form-group>

                <b-alert
                    variant="danger"
                    class="mt-2"
                    fade
                    :show="alertCountdown"
                    dismissible
                    @dismissed="alertCoundown = 0"
                    @dismiss-count-down="alertCountdownChanged"
                >
                    {{ errorMessage }}
                </b-alert>

                <div class="text-center">
                    <b-button type="submit" variant="primary" :disabled="isLoading">
                        <span v-if="isLoading"><b-spinner small/></span>
                        <span v-else>Change Password</span>
                    </b-button>
                </div>
            </b-form>
        </div>
    </div>
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

            // Forgot Password
            forgotPassword: false,
            isResettingPassword: false,
            resetPasswordForm: {
                username: "",
                code: "",
                password: "",
                confPassword: ""
            },

            // Error Handling
            dismissSecs: 10,
            alertCountdown: 0,
            errorMessage: ""
        };
    },

    methods: {
        signIn: async function() {
            this.isLoading = true;

            const user = await Auth.signIn(
                this.signInForm.username,
                this.signInForm.password
            ).catch(err => {
                this.displayError(err.message);
            });

            if (user) {
                if (this.rememberDevice) {
                    await Auth.rememberDevice();
                }

                // await this.$store.dispatch("fetchUser", user.signInUserSession);
                // this.isLoading = false;
            }
        },

        sendPasswordReset: async function() {
            this.isLoading = true;
            const response = await Auth.forgotPassword(this.resetPasswordForm.username).catch(
                err => {
                    this.displayError(err.message);
                }
            );

            if (response) {
                this.isLoading = false;
                this.isResettingPassword = true;
                this.alertCountdown = 0;
            }
        },

        resetPassword: async function() {
            if (this.resetPasswordForm.password === this.resetPasswordForm.confPassword) {
                const response = await Auth.forgotPasswordSubmit(
                    this.resetPasswordForm.username,
                    this.resetPasswordForm.code,
                    this.resetPasswordForm.password
                ).catch(err => {
                    this.displayError(err.message);
                });

                console.log(response);
            }
        },

        displayError: function(message) {
            this.errorMessage = message;
            this.alertCountdown = this.dismissSecs;
            this.isLoading = false;
        },

        alertCountdownChanged: function(alertCountdown) {
            this.alertCountdown = alertCountdown;
        }
    }
};
</script>
