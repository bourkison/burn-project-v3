const middleware = {}

middleware['protectedRoute'] = require('../middleware/protectedRoute.js')
middleware['protectedRoute'] = middleware['protectedRoute'].default || middleware['protectedRoute']

export default middleware
