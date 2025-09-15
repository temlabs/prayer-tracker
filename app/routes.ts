import { type RouteConfig, index, route } from '@react-router/dev/routes'

export default [
    index('routes/home.tsx'),
    route('/identity', 'routes/identity.tsx'),
    route('/log', 'routes/log.tsx'),
] satisfies RouteConfig
