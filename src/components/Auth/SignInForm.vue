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
            rememberDevice: false
        };
    },

    methods: {
        signIn: async function() {
            this.isLoading = true;

            const user = await Auth.signIn(this.signInForm.username, this.signInForm.password);

            if (this.rememberDevice) {
                await Auth.rememberDevice();
            }

            await this.$store.dispatch("fetchUser", user.signInUserSession);
            this.isLoading = false;
        }
    }
};
</script>
