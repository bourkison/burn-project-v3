import Vue from 'vue'
import Router from 'vue-router'
import { normalizeURL, decode } from 'ufo'
import { interopDefault } from './utils'
import scrollBehavior from './router.scrollBehavior.js'

const _6186b3aa = () => interopDefault(import('../pages/exercises/index.vue' /* webpackChunkName: "pages/exercises/index" */))
const _6c8c34e4 = () => interopDefault(import('../pages/exercises/_exerciseId/index.vue' /* webpackChunkName: "pages/exercises/_exerciseId/index" */))
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
    path: "/exercises/:exerciseId",
    component: _6c8c34e4,
    name: "exercises-exerciseId"
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
