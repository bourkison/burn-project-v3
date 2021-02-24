import Vue from 'vue'
import Vuex from 'vuex'
import { auth, db } from '../firebase'
import router from '../router'

Vue.use(Vuex)

export default new Vuex.Store({
  state: {
    userProfile: null
  },
  mutations: {
    setLoggedInUser: function(state, user) {
      state.userProfile = user;
    }
  },
  actions: {
    // Fetch user gets called after firebase.onAuthChange
    // It pulls the user profile document using the user ID pass to it from auth change.
    async fetchUser({ commit }, user) {
      if (user) {
        const userProfile = await db.collection("users").doc(user.uid).get()
        if (userProfile.exists) {
          commit("setLoggedInUser", { loggedIn: true, data: user, docData: userProfile.data() });

          if (router.history.current.name == "Sign Up" || router.history.current.name == "Login") {
            router.push("/");
          }
        } else {
          console.log("User signed in but no doc data. Signing out.")
          auth.signOut();
          commit("setLoggedInUser", { loggedIn: false, data: null, docData: null })
        } 
      } else {
        commit("setLoggedInUser", { loggedIn: false, data: null, docData: null })
      }
    } 
  },
  modules: {
  }
})
