// @flow

import wd from 'wd'
import fetch from 'node-fetch'
import childProcess from 'child_process'
import serverConfigs from '../config/configs'
import { clone } from 'lodash'
import browserstack from 'browserstack-local'

const BROWSERSTACK_EXHAUSTED_MESSAGE = 'All parallel tests are currently in use, including the queued tests. ' +
  'Please wait to finish or upgrade your plan to add more sessions.'
const IMPLICIT_WAIT_TIMEOUT = 80000
const INIT_RETRY_TIME = 3000
const STARTUP_DELAY = 8000

export const timer = (ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms))
type DriverType = {| driver: wd.promiseChainRemote, bsLocal?: browserstack.Local |}

export type ConfigType = {|
  url: string,
  browser: string,
  prefix: string,
  local: boolean,
  caps: {| [key: string]: string |}
|}

const getConfig = (): ConfigType | null => {
  const configName: ?string = process.env.E2E_CONFIG

  if (!configName) {
    console.error('E2E_CONFIG name is not set!')
    return null
  }

  const config = serverConfigs[configName.toLowerCase()]

  if (!config) {
    console.error(`Server config ${configName} not found!`)
    return null
  }

  return config
}

const initDriver = async (config: ConfigType, desiredCaps): Promise<wd.promiseChainRemote> => {
  try {
    const driver = wd.promiseChainRemote(config.url)
    await driver.init(desiredCaps)
    return driver
  } catch (e) {
    if (e.message.includes(BROWSERSTACK_EXHAUSTED_MESSAGE)) {
      console.log('Waiting because queue is full!')
      await timer(INIT_RETRY_TIME)
      await initDriver(config, desiredCaps)
    }

    throw e
  }
}

const initTunnel = async (desiredCaps): Promise<browserstack.Local> => {
  if (desiredCaps['browserstack.local']) {
    console.log('Connecting local')
    const bsLocal = new browserstack.Local()
    bsLocal.start({ key: desiredCaps['browserstack.key'] }, error => {
      if (error) { return console.log(error) }
      console.log('Connected. Now testing...')
    })
    return bsLocal
  }
}

const fetchTestResults = async (driver: wd.PromiseChainWebdriver) => {
  if (!driver.sessionID) {
    // We are not using BrowserStack probably
    return
  }

  const user = process.env.E2E_BROWSERSTACK_USER
  const password = process.env.E2E_BROWSERSTACK_KEY

  if (!user || !password) {
    console.log('Can not fetch test results from BrowserStack as username or password is not set!')
    return
  }

  const auth = `Basic ${Buffer.from(
    `${user}:${password}`
  ).toString('base64')}`

  try {
    const response = await fetch(
      `https://api.browserstack.com/automate/sessions/${driver.sessionID}.json`,
      {
        method: 'GET',
        headers: {
          Authorization: auth
        }
      })
    const json = await response.json()
    console.log(`View the results here: ${json.automation_session.public_url}`)
  } catch (error) {
    console.error(error)
  }
}

const getGitBranch = () => {
  return childProcess.execSync('git rev-parse --abbrev-ref HEAD').toString().trim()
}

const getGitHeadReference = () => {
  return childProcess.execSync('git rev-parse --short HEAD').toString().trim()
}

export const setupDriver = async (): Promise<DriverType> => {
  const config = getConfig()

  if (!config) {
    throw Error('Failed to get config!')
  }

  console.log(`Trying to use ${config.url} ...`)

  const desiredCaps = {
    ...clone(config.caps),
    build: `${config.prefix}: ${getGitBranch()}`,
    name: `${config.browser}: ${getGitHeadReference()}`,
    tags: [config.prefix, config.browser]
  }

  const driver = initDriver(config, desiredCaps)
  const status = await driver.status()
  const bsLocal = !config.local ? await initTunnel(desiredCaps) : undefined

  console.log(`Session ID is ${JSON.stringify(driver.sessionID)}`)
  console.log(`Status of Driver is ${JSON.stringify(status)}`)

  await driver.setImplicitWaitTimeout(IMPLICIT_WAIT_TIMEOUT)
  await timer(STARTUP_DELAY)

  return { driver, bsLocal }
}

export const stopDriver = async (e2eDriver: DriverType) => {
  const { driver, bsLocal } = e2eDriver
  await fetchTestResults(driver)
  if (driver === undefined) {
    return
  }
  await driver.quit()
  if (bsLocal === undefined) {
    return
  }
  bsLocal.stop(() => {
    console.log('Stopped BrowserStackLocal')
  })
}
