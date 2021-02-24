<template>
    <div id="app">
        <div v-if="$store.state.userProfile">
            <b-navbar toggleable="sm" variant="faded" type="light">
                <b-navbar-brand tag="h1" :to="'/'">Burn</b-navbar-brand>

                <b-navbar-toggle target="nav-collapse"></b-navbar-toggle>

                <!-- Logged In Nav -->
                <b-collapse v-if="$store.state.userProfile.loggedIn" id="nav-collapse" is-nav>
                    <b-navbar-nav>
                        <b-nav-item :to="'/exercises'">Exercises</b-nav-item>
                        <b-nav-item :to="'/workouts'">Workouts</b-nav-item>
                        <b-nav-item :to="'/burns'">Burns</b-nav-item>
                        <b-nav-form>
                            <b-form-input ref="searchInput" size="sm" placeholder="Search"></b-form-input>
                        </b-nav-form>
                    </b-navbar-nav>

                    <b-navbar-nav class="ml-auto">
                        <b-nav-item><b-icon-chat-left font-scale="1.5"/></b-nav-item>
                        <b-nav-item><b-icon-bell font-scale="1.5"/></b-nav-item>
                        <b-nav-item-dropdown>
                            <template #button-content>
                                <b-icon-person-circle font-scale="1.5"/>
                            </template>
                            <b-dropdown-item :to="'/profile'">Profile</b-dropdown-item>
                            <b-dropdown-item @click="signOut">Sign Out</b-dropdown-item>
                        </b-nav-item-dropdown>
                    </b-navbar-nav>
                </b-collapse>

                <!-- Logged Out Nav -->
                <b-collapse v-else id="nav-collapse" is-nav>
                    <b-navbar-nav>
                        <b-nav-item v-b-modal.login-modal>Login</b-nav-item>
                        <b-nav-item v-b-modal.signup-modal>Sign Up</b-nav-item>
                    </b-navbar-nav>

                    <b-modal id="login-modal" title="Login">
                        Login!
                    </b-modal>

                    <b-modal id="signup-modal" title="Sign Up">
                        Sign Up!
                    </b-modal>
                </b-collapse>
            </b-navbar>
        </div>
        <div v-else>
            <b-container fluid>
                <b-spinner label="Spinning"></b-spinner>
            </b-container>
        </div>
        <router-view/>
    </div>
</template>

<script>
import { auth } from '@/firebase'

export default {
    methods: {
        signOut: function() {
            auth.signOut();
        }
    }
}
</script>