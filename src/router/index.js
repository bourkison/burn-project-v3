import Vue from "vue";
import VueRouter from "vue-router";
// import store from '@/store'

import { Auth } from 'aws-amplify'

import Home from "@/views/Home.vue";

import Workout from "@/views/Workout/Workout.vue";
import WorkoutNew from "@/views/Workout/WorkoutNew.vue";
import WorkoutRecent from "@/views/Workout/WorkoutRecent.vue";
import WorkoutView from "@/views/Workout/WorkoutView.vue";

import ExerciseDiscover from "@/views/Exercise/ExerciseDiscover.vue";
import ExerciseEdit from "@/views/Exercise/ExerciseEdit.vue";
import ExerciseFollowed from "@/views/Exercise/ExerciseFollowed.vue";
import ExerciseNew from "@/views/Exercise/ExerciseNew.vue";
import ExerciseView from "@/views/Exercise/ExerciseView.vue";

import Profile from "@/views/User/Profile.vue";

import Admin from '@/views/Utility/Admin.vue';
import Search from "@/views/Utility/Search.vue";

// import Template from '@/views/Template/Template.vue'
import TemplateDiscover from "@/views/Template/TemplateDiscover.vue";
import TemplateEdit from "@/views/Template/TemplateEdit.vue";
import TemplateFollowed from "@/views/Template/TemplateFollowed.vue";
import TemplateNew from "@/views/Template/TemplateNew.vue";
import TemplateView from "@/views/Template/TemplateView.vue";
import store from "../store";

Vue.use(VueRouter);

const routes = [
    {
        path: "/",
        name: "Home",
        component: Home
    },
    // EXERCISES
    {
        path: "/exercises",
        name: "Discover Exercises",
        component: ExerciseDiscover,
        meta: {
            requiresAuth: true
        }
    },
    {
        path: "/exercises/followed",
        name: "Followed Exercises",
        component: ExerciseFollowed,
        meta: {
            requiresAuth: true
        }
    },
    {
        path: "/exercises/new",
        name: "New Exercise",
        component: ExerciseNew,
        meta: {
            requiresAuth: true
        }
    },
    {
        path: "/exercises/:exerciseid",
        name: "View Exercise",
        component: ExerciseView,
        meta: {
            requiresAuth: true
        }
    },
    {
        path: "/exercises/:exerciseid/edit",
        name: "Edit Exercise",
        component: ExerciseEdit,
        meta: {
            requiresAuth: true
        }
    },
    // TEMPLATES
    {
        path: "/templates",
        name: "Discover Templates",
        component: TemplateDiscover,
        meta: {
            requiresAuth: true
        }
    },
    {
        path: "/templates/followed",
        name: "Followed Templates",
        component: TemplateFollowed,
        meta: {
            requiresAuth: true
        }
    },
    {
        path: "/templates/new",
        name: "New Template",
        component: TemplateNew,
        meta: {
            requiresAuth: true
        }
    },
    {
        path: "/templates/:templateid",
        name: "View Template",
        component: TemplateView,
        meta: {
            requiresAuth: true
        }
    },
    {
        path: "/templates/:templateid/edit",
        name: "Edit Template",
        component: TemplateEdit,
        meta: {
            requiresAuth: true
        }
    },
    // WORKOUT
    {
        path: "/workout",
        name: "Workout",
        component: Workout,
        meta: {
            requiresAuth: true
        },
        children: [
            {
                path: "/workout/new",
                name: "New Workout",
                component: WorkoutNew
            },
            {
                path: "/workout/recent",
                name: "WorkoutRecent",
                component: WorkoutRecent
            },
            {
                path: "/workout",
                name: "Workout View",
                component: WorkoutView
            }
        ]
    },
    // SEARCH
    {
        path: "/search",
        name: "Search",
        component: Search,
        meta: {
            requiresAuth: true
        }
    },
    // ADMIN
    {
        path: '/admin',
        name: "Admin",
        component: Admin,
        meta: {
            requiresAuth: true,
            requiresAdmin: true
        }
    },
    // USER + 404
    {
        path: "/:profileid",
        name: "Profile",
        component: Profile,
        meta: {
            requiresAuth: true
        }
    }
];

const router = new VueRouter({
    mode: "history",
    base: process.env.BASE_URL,
    routes
});

// This function checks if user is logged in based on route metadata.
// Calls a promise in firebase.js to wait for user to log in (if on initial load).
router.beforeEach(async (to, from, next) => {
    const requiresAuth = to.matched.some(x => x.meta.requiresAuth)

    // if (requiresAuth && !await store.dispatch('fetchUser', false)) {
    //     next('home');
    // } else {
    //     next();
    // }

    // next();
    if (requiresAuth && (!store.state.userProfile || !store.state.userProfile.loggedIn)) {
        const user = (await Auth.currentAuthenticatedUser()).signInUserSession;

        if (!user) {
            next('');
        } else {
            await store.dispatch('fetchUser', user);
            next();
        }
    } else {
        next();
    }
});

export default router;
