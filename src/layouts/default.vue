<template>
    <div id="app">
        <link rel="stylesheet" href="https://vjs.zencdn.net/7.17.0/video-js.css" />
        <link href="https://unpkg.com/@videojs/themes@1/dist/forest/index.css" rel="stylesheet">
        <div v-if="$store.state.userProfile">
            <b-navbar sticky class="mainNav" toggleable="sm" variant="faded" type="light">
                <b-navbar-brand tag="h1" :to="'/'">Burn</b-navbar-brand>

                <b-navbar-toggle target="nav-collapse"></b-navbar-toggle>

                <!-- Logged In Nav -->
                <b-collapse v-if="$store.state.userProfile.loggedIn" id="nav-collapse" is-nav>
                    <b-navbar-nav>
                        <b-nav-item to="/exercises">Exercises</b-nav-item>
                        <b-nav-item to="/templates">Templates</b-nav-item>
                        <b-nav-item to="/workout">Workouts</b-nav-item>
                        <MainSearch />
                    </b-navbar-nav>

                    <b-navbar-nav class="ml-auto">
                        <b-nav-item><b-icon-chat-left font-scale="1.5"/></b-nav-item>
                        <b-nav-item><b-icon-bell font-scale="1.5"/></b-nav-item>
                        <b-nav-item-dropdown right>
                            <template #button-content>
                                <span v-if="$store.state.userProfile.docData.profilePhoto">
                                    <b-avatar
                                        size="1.666em"
                                        :src="$store.state.userProfile.docData.profilePhoto"
                                    />
                                </span>
                                <span v-else>
                                    <b-icon-person-circle font-scale="1.5" />
                                </span>
                            </template>
                            <b-dropdown-item :to="'/' + $store.state.userProfile.docData.username"
                                >Profile</b-dropdown-item
                            >
                            <b-dropdown-item to="#">Help</b-dropdown-item>
                            <b-dropdown-item @click="signOut">Sign Out</b-dropdown-item>
                        </b-nav-item-dropdown>
                    </b-navbar-nav>
                </b-collapse>

                <!-- Logged Out Nav -->
                <b-collapse v-else id="nav-collapse" is-nav>
                    <b-navbar-nav class="ml-auto">
                        <b-nav-item @click="signInModal = true;">Login</b-nav-item>
                        <b-nav-item
                            @click="
                                signUpModal = true;
                                signingUp = true;
                            "
                            >Sign Up</b-nav-item
                        >
                    </b-navbar-nav>

                    <b-modal hide-footer centered id="login-modal" title="Login" v-model="signInModal">
                        <SignInForm
                            @closeSignInModal="
                                signInModal = false;
                                signingUp = false;
                            "
                        />
                    </b-modal>
                </b-collapse>
            </b-navbar>
            <div>
                <Nuxt />
                <WorkoutToast />
            </div>
            <b-modal
                v-if="!$store.state.userProfile.loggedIn || signingUp"
                id="signup-modal"
                hide-footer
                no-close-on-esc
                no-close-on-backdrop
                centered
                title="Sign Up"
                v-model="signUpModal"
            >
                <SignUpForm @closeSignUpModal="signUpModal = false;" />
            </b-modal>
        </div>
        <div v-else>
            <b-container fluid class="text-center p-5">
                <b-spinner label="Spinning"></b-spinner>
            </b-container>
        </div>
    </div>
</template>

<script>
import { Auth } from "aws-amplify";

import SignInForm from "@/components/Auth/SignInForm.vue";
import SignUpForm from "@/components/Auth/SignUpForm.vue";
import MainSearch from "@/components/Search/MainSearch.vue";
import WorkoutToast from "@/components/Workout/WorkoutToast.vue";

export default {
    components: { MainSearch, SignInForm, SignUpForm, WorkoutToast },
    data() {
        return {
            signInModal: false,
            signUpModal: false,
            signingUp: false
        };
    },
    head() {
        return {
            title: "Burn · Home"
        }
    },
    
    methods: {
        async signOut() {
            await Auth.signOut().catch(err => { console.error(err.message || JSON.stringify(err)); });
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