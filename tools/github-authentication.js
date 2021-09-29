// eslint-disable-next-line @typescript-eslint/no-var-requires
const { Octokit } = require('@octokit/rest')
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { createAppAuth } = require('@octokit/auth-app')

const authenticate = async ({ deliverinoPrivateKey, owner, repo }) => {
  const appId = 59249 // https://github.com/apps/deliverino
  const privateKey = Buffer.from(deliverinoPrivateKey, 'base64').toString('ascii')

  const octokit = new Octokit({ authStrategy: createAppAuth, auth: { id: appId, privateKey } })
  const {
    data: { id: installationId }
  } = await octokit.apps.getRepoInstallation({ owner, repo })
  const {
    data: { token }
  } = await octokit.apps.createInstallationAccessToken({ installation_id: installationId })

  return new Octokit({ auth: token })
}

module.exports = authenticate
