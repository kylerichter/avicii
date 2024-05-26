import config from 'config'

/**
 * Verify all environment variables required for running the client are set.
 */
export const checkEnv = () => {
  process.env.NODE_ENV = process.env.NODE_ENV ?? 'development'

  const requiredEnvVars: string[] = config.get('requiredEnv')

  requiredEnvVars.forEach((envVar) => {
    if (!process.env[envVar]) {
      console.error(`Must set ${envVar}`)
      process.exit(1)
    }
  })
}
