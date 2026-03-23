module.exports = {
  apps: [
    {
      name: 'bdms-api',
      cwd: '/root/.openclaw/workspace/BDMS_Nest',
      script: 'pnpm',
      args: 'start:dev',
      env: {
        NODE_ENV: 'development'
      }
    },
    {
      name: 'bdms-frontend',
      cwd: '/root/.openclaw/workspace/bdms-frontend',
      script: 'pnpm',
      args: 'dev --port 3001',
      env: {
        NODE_ENV: 'development'
      }
    }
  ]
}
