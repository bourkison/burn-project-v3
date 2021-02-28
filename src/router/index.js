import Vue from 'vue'
import VueRouter from 'vue-router'
import firebase from 'firebase'

import Home from '@/views/Home.vue'

import Exercise from '@/views/Exercise/Exercise.vue'
import ExerciseDiscover from '@/views/Exercise/ExerciseDiscover.vue'
import ExerciseEdit from '@/views/Exercise/ExerciseEdit.vue'
import ExerciseFollowed from '@/views/Exercise/ExerciseFollowed.vue'
import ExerciseNew from '@/views/Exercise/ExerciseNew.vue'
import ExerciseView from '@/views/Exercise/ExerciseView.vue'

import Workout from '@/views/Workout/Workout.vue'
import WorkoutDiscover from '@/views/Workout/WorkoutDiscover.vue'
import WorkoutFollowed from '@/views/Workout/WorkoutFollowed.vue'
import WorkoutView from '@/views/Workout/WorkoutView.vue'


Vue.use(VueRouter)

const routes = [
    {
        path: '/',
        name: 'Home',
        component: Home
    },
    {
        path: '/about',
        name: 'About',
        // route level code-splitting
        // this generates a separate chunk (about.[hash].js) for this route
        // which is lazy-loaded when the route is visited.
        component: () => import(/* webpackChunkName: "about" */ '../views/About.vue')
    },
    {
        path: '/exercises',
        name: 'Exercise',
        component: Exercise,
        meta: {
            requiresAuth: true
        },
        children: [
            {
                path: '/exercises/discover',
                name: 'Discover Exercises',
                component: ExerciseDiscover
            },
            {
                path: '/exercises',
                name: 'Followed Exercises',
                component: ExerciseFollowed
            },
        ]
    },
    {
        path: '/exercises/new',
        name: 'New Exercise',
        component: ExerciseNew,
        meta: {
            requiresAuth: true
        }
    },
    {
        path: '/exercises/:exerciseid/edit',
        name: 'Edit Exercise',
        component: ExerciseEdit,
        meta: {
            requiresAuth: true
        }
    },
    {
        path: '/exercises/:exerciseid',
        name: 'View Exercise',
        component: ExerciseView,
        meta: {
            requiresAuth: true
        }
    },
    {
        path: '/workouts',
        name: 'Workout',
        component: Workout,
        meta: {
            requiresAuth: true
        },
        children: [
            {
                path: '/workouts/discover',
                name: 'Discover Workouts',
                component: WorkoutDiscover
            },
            {
                path: '/workouts',
                name: 'Followed Workouts',
                component: WorkoutFollowed
            }
        ]
    },
    {
        path: '/workouts/:workoutid',
        name: 'View Workout',
        component: WorkoutView,
        meta: {
            requiresAuth: true
        }
    }
    
]

const router = new VueRouter({
    mode: 'history',
    base: process.env.BASE_URL,
    routes
})

// This function checks if user is logged in based on route metadata.
// Calls a promise in firebase.js to wait for user to log in (if on initial load).
router.beforeEach(async (to, from, next) => {
    const requiresAuth = to.matched.some(x => x.meta.requiresAuth)

    if (requiresAuth && !await firebase.getCurrentUser()) {
        next('home');
    } else {
        next();
    }

    next();
})

export default router
