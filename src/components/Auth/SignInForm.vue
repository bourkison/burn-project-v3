<template>
    <b-form @submit.prevent="signIn">
        <b-form-group label="Email:" label-for="emailInput" description="We'll never share your email with anyone else.">
            <b-form-input id="emailInput" v-model="signInForm.email" type="email" placeholder="Enter Email" required />
        </b-form-group>

        <b-form-group label="Password:" label-for="passwordInput">
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
export default {
    name: 'SignIn',
    data() {
        return {
            isLoading: false,
            signInForm: {
                email: '',
                password: ''
            }
        }
    },

    methods: {
        signIn: function() {
            this.isLoading = true;
            this.$emit("signIn", this.signInForm);
        }
    }
}
</script>