<template>
    <b-form @submit.prevent="signIn">
        <b-form-group label="Username" label-for="usernameInput">
            <b-form-input id="usernameInput" v-model="signInForm.username" placeholder="Enter Username" required />
        </b-form-group>

        <b-form-group label="Password" label-for="passwordInput">
            <b-form-input id="passwordInput" v-model="signInForm.password" type="password" placeholder="Enter Password" required />
        </b-form-group>

        <div class="text-center">
            <b-button type="submit" variant="primary" :disabled="isLoading">
                <span v-if="isLoading"><b-spinner small /></span>
                <span v-else>Login</span>
            </b-button>
        </div>
    </b-form>
</template>

<script>
// import { auth } from '@/firebase'
import { CognitoUserPool, CognitoUser, AuthenticationDetails } from 'amazon-cognito-identity-js'
import { config } from '@/config'

export default {
    name: 'SignIn',
    data() {
        return {
            isLoading: false,
            signInForm: {
                username: '',
                password: ''
            }
        }
    },

    methods: {
        // signIn: function() {
        //     this.isLoading = true;

        //     auth.signInWithEmailAndPassword(this.signInForm.email, this.signInForm.password)
        //     .then(() => {
        //         this.isLoading = false;
        //         this.$emit("closeSignInModal");
        //         this.$router.push("/");
        //     })
        //     .catch(e => {
        //         console.error("Error signing in:", e);
        //         this.isLoading = false;
        //     });
        // }

        signIn: function() {
            this.isLoading = true;

            let poolData = config.cognito;
            let userPool = new CognitoUserPool(poolData);

            let userData = {
                Username: this.signInForm.username,
                Pool: userPool
            };

            let cognitoUser = new CognitoUser(userData);

            let authenticationData = {
                Username: this.signInForm.username,
                Password: this.signInForm.password
            }

            let authenticationDetails = new AuthenticationDetails(authenticationData);

            cognitoUser.authenticateUser(authenticationDetails, {
                onSuccess: (result) => {
                    console.log("SUCCESS", result);
                },

                onFailure: (err) => {
                    alert(err.message || JSON.stringify(err));
                }
            })


        }
    }
}
</script>