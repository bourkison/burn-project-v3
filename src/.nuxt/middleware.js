const middleware = {}

middleware['requiresAuth'] = require('../middleware/requiresAuth.js')
middleware['requiresAuth'] = middleware['requiresAuth'].default || middleware['requiresAuth']

export default middleware
