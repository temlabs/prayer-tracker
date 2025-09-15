import { type RouteConfig, index, route } from '@react-router/dev/routes'

export default [
    index('routes/index.tsx'),
    route('/identity', 'routes/identity.tsx'),
    route('/activity', 'routes/activity.tsx'),
    route('/data', 'routes/data.tsx'),
    route('/members', 'routes/members.tsx'),
] satisfies RouteConfig
