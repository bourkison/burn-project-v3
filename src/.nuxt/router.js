import Vue from 'vue'
import Router from 'vue-router'
import { normalizeURL, decode } from 'ufo'
import { interopDefault } from './utils'
import scrollBehavior from './router.scrollBehavior.js'

const _6186b3aa = () => interopDefault(import('../pages/exercises/index.vue' /* webpackChunkName: "pages/exercises/index" */))
const _c836b8a4 = () => interopDefault(import('../pages/search/index.vue' /* webpackChunkName: "pages/search/index" */))
const _0fdb4249 = () => interopDefault(import('../pages/templates/index.vue' /* webpackChunkName: "pages/templates/index" */))
const _1e69c426 = () => interopDefault(import('../pages/workout/index.vue' /* webpackChunkName: "pages/workout/index" */))
const _3d0ab972 = () => interopDefault(import('../pages/exercises/followed.vue' /* webpackChunkName: "pages/exercises/followed" */))
const _f98be78e = () => interopDefault(import('../pages/exercises/new.vue' /* webpackChunkName: "pages/exercises/new" */))
const _89d7ab2e = () => interopDefault(import('../pages/templates/followed.vue' /* webpackChunkName: "pages/templates/followed" */))
const _446d17d7 = () => interopDefault(import('../pages/templates/new.vue' /* webpackChunkName: "pages/templates/new" */))
const _abb0e70a = () => interopDefault(import('../pages/workout/new.vue' /* webpackChunkName: "pages/workout/new" */))
const _138dc850 = () => interopDefault(import('../pages/workout/recent.vue' /* webpackChunkName: "pages/workout/recent" */))
const _6c8c34e4 = () => interopDefault(import('../pages/exercises/_exerciseId/index.vue' /* webpackChunkName: "pages/exercises/_exerciseId/index" */))
const _a843a764 = () => interopDefault(import('../pages/templates/_templateId/index.vue' /* webpackChunkName: "pages/templates/_templateId/index" */))
const _cdef5804 = () => interopDefault(import('../pages/exercises/_exerciseId/edit.vue' /* webpackChunkName: "pages/exercises/_exerciseId/edit" */))
const _5c3f9584 = () => interopDefault(import('../pages/templates/_templateId/edit.vue' /* webpackChunkName: "pages/templates/_templateId/edit" */))
const _7af23bdf = () => interopDefault(import('../pages/index.vue' /* webpackChunkName: "pages/index" */))
const _38b0a696 = () => interopDefault(import('../pages/_userId/index.vue' /* webpackChunkName: "pages/_userId/index" */))

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
    path: "/search",
    component: _c836b8a4,
    name: "search"
  }, {
    path: "/templates",
    component: _0fdb4249,
    name: "templates"
  }, {
    path: "/workout",
    component: _1e69c426,
    name: "workout"
  }, {
    path: "/exercises/followed",
    component: _3d0ab972,
    name: "exercises-followed"
  }, {
    path: "/exercises/new",
    component: _f98be78e,
    name: "exercises-new"
  }, {
    path: "/templates/followed",
    component: _89d7ab2e,
    name: "templates-followed"
  }, {
    path: "/templates/new",
    component: _446d17d7,
    name: "templates-new"
  }, {
    path: "/workout/new",
    component: _abb0e70a,
    name: "workout-new"
  }, {
    path: "/workout/recent",
    component: _138dc850,
    name: "workout-recent"
  }, {
    path: "/exercises/:exerciseId",
    component: _6c8c34e4,
    name: "exercises-exerciseId"
  }, {
    path: "/templates/:templateId",
    component: _a843a764,
    name: "templates-templateId"
  }, {
    path: "/exercises/:exerciseId/edit",
    component: _cdef5804,
    name: "exercises-exerciseId-edit"
  }, {
    path: "/templates/:templateId/edit",
    component: _5c3f9584,
    name: "templates-templateId-edit"
  }, {
    path: "/",
    component: _7af23bdf,
    name: "index"
  }, {
    path: "/:userId",
    component: _38b0a696,
    name: "userId"
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