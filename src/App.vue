<template>
    <div id="app">
        <div v-if="$store.state.userProfile">
            <b-navbar sticky class="mainNav" toggleable="sm" variant="faded" type="light">
                <b-navbar-brand tag="h1" :to="'/'">Burn</b-navbar-brand>

                <b-navbar-toggle target="nav-collapse"></b-navbar-toggle>

                <!-- Logged In Nav -->
                <b-collapse v-if="$store.state.userProfile.loggedIn" id="nav-collapse" is-nav>
                    <b-navbar-nav>
                        <b-nav-item to="/exercises">Exercises</b-nav-item>
                        <b-nav-item to="/templates">Templates</b-nav-item>
                        <b-nav-item to="/burn">Burns</b-nav-item>
                        <MainSearch />
                        <!-- <b-nav-form>
                            <b-form-input ref="searchInput" size="sm" placeholder="Search"></b-form-input>
                        </b-nav-form> -->
                    </b-navbar-nav>

                    <b-navbar-nav class="ml-auto">
                        <b-nav-item><b-icon-chat-left font-scale="1.5"/></b-nav-item>
                        <b-nav-item><b-icon-bell font-scale="1.5"/></b-nav-item>
                        <b-nav-item-dropdown right>
                            <template #button-content>
                                <span v-if="$store.state.userProfile.docData.profilePhoto">
                                    <b-avatar size="1.666em" :src="$store.state.userProfile.docData.profilePhoto" />
                                </span>
                                <span v-else>
                                    <b-icon-person-circle font-scale="1.5"/>
                                </span>
                            </template>
                            <b-dropdown-item :to="'/' + $store.state.userProfile.docData.username">Profile</b-dropdown-item>
                            <b-dropdown-item @click="signOut">Sign Out</b-dropdown-item>
                        </b-nav-item-dropdown>
                    </b-navbar-nav>
                </b-collapse>

                <!-- Logged Out Nav -->
                <b-collapse v-else id="nav-collapse" is-nav>
                    <b-navbar-nav>
                        <b-nav-item @click="$bvModal.show('login-modal')">Login</b-nav-item>
                        <b-nav-item @click="$bvModal.show('signup-modal')">Sign Up</b-nav-item>
                    </b-navbar-nav>

                    <b-modal hide-footer centered id="login-modal" title="Login">
                        <SignInForm  @closeSignInModal="$bvModal.hide('login-modal')"/>
                    </b-modal>

                    <b-modal id="signup-modal" hide-footer centered title="Sign Up">
                        <SignUpForm />
                    </b-modal>
                </b-collapse>
            </b-navbar>
            <div>
                <router-view/>
            </div>
        </div>
        <div v-else>
            <b-container fluid class="text-center p-5">
                <b-spinner label="Spinning"></b-spinner>
            </b-container>
        </div>
    </div>
</template>

<script>
import { auth } from '@/firebase'

import SignInForm from '@/components/Auth/SignInForm.vue'
import SignUpForm from '@/components/Auth/SignUpForm.vue'

import MainSearch from '@/components/Search/MainSearch.vue'

export default {
    components: { MainSearch, SignInForm, SignUpForm },
    methods: {
        signOut: function() {
            auth.signOut();
            this.$router.push("/");
        }
    }
}
</script>

<style>
body {
    background-color: rgba(203, 203, 210, 0.15) !important;
}

.mainNav {
    background-color: #fff !important;
}
</style>