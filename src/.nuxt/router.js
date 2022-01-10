import Vue from 'vue'
import Router from 'vue-router'
import { normalizeURL, decode } from 'ufo'
import { interopDefault } from './utils'
import scrollBehavior from './router.scrollBehavior.js'

const _6186b3aa = () => interopDefault(import('../pages/exercises/index.vue' /* webpackChunkName: "pages/exercises/index" */))
const _3d0ab972 = () => interopDefault(import('../pages/exercises/followed.vue' /* webpackChunkName: "pages/exercises/followed" */))
const _f98be78e = () => interopDefault(import('../pages/exercises/new.vue' /* webpackChunkName: "pages/exercises/new" */))
const _6c8c34e4 = () => interopDefault(import('../pages/exercises/_exerciseId/index.vue' /* webpackChunkName: "pages/exercises/_exerciseId/index" */))
const _cdef5804 = () => interopDefault(import('../pages/exercises/_exerciseId/edit.vue' /* webpackChunkName: "pages/exercises/_exerciseId/edit" */))
const _7af23bdf = () => interopDefault(import('../pages/index.vue' /* webpackChunkName: "pages/index" */))

const emptyFn = () => {}

Vue.use(Router)

export const routerOptions = {
  mode: 'history',
  base: '/',
  linkActiveClass: 'nuxt-link-active',
  linkExactActiveClass: 'nuxt-link-exact-active',
  scrollBehavior,

  routes: [{
    path: "/exercises",
    component: _6186b3aa,
    name: "exercises"
  }, {
    path: "/exercises/followed",
    component: _3d0ab972,
    name: "exercises-followed"
  }, {
    path: "/exercises/new",
    component: _f98be78e,
    name: "exercises-new"
  }, {
    path: "/exercises/:exerciseId",
    component: _6c8c34e4,
    name: "exercises-exerciseId"
  }, {
    path: "/exercises/:exerciseId/edit",
    component: _cdef5804,
    name: "exercises-exerciseId-edit"
  }, {
    path: "/",
    component: _7af23bdf,
    name: "index"
  }],

  fallback: false
}

export function createRouter (ssrContext, config) {
  const base = (config._app && config._app.basePath) || routerOptions.base
  const router = new Router({ ...routerOptions, base  })

  // TODO: remove in Nuxt 3
  const originalPush = router.push
  router.push = function push (location, onComplete = emptyFn, onAbort) {
    return originalPush.call(this, location, onComplete, onAbort)
  }

  const resolve = router.resolve.bind(router)
  router.resolve = (to, current, append) => {
    if (typeof to === 'string') {
      to = normalizeURL(to)
    }
    return resolve(to, current, append)
  }

  return router
}
