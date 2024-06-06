// @ts-check

import { strictEqual } from 'node:assert'

import { describe, it } from 'mocha'
import trifidCore, { getListenerURL } from '../../index.js'

import healthPlugin from '../../plugins/health.js'

const createTrifidInstance = async () => {
  return await trifidCore({
    server: {
      listener: {
        port: 4242,
      },
      logLevel: 'warn',
    },
  }, {
    health: {
      module: healthPlugin,
    },
  })
}

describe('health plugin', () => {
  it('should return expected content-type', async () => {
    const trifidInstance = await createTrifidInstance()
    const trifidListener = await trifidInstance.start()
    const pluginUrl = `${getListenerURL(trifidListener)}/healthz`
    const response = await fetch(pluginUrl)
    const _responseText = await response.text()
    await trifidListener.close()

    const contentType = response.headers.get('content-type') || ''

    strictEqual(contentType.split(';')[0], 'text/plain')
  })

  it('should return expected body', async () => {
    const trifidInstance = await createTrifidInstance()
    const trifidListener = await trifidInstance.start()
    const pluginUrl = `${getListenerURL(trifidListener)}/healthz`
    const response = await fetch(pluginUrl)
    const responseText = await response.text()
    await trifidListener.close()

    strictEqual(responseText.split('\n')[0], 'OK')
  })

  it('should return expected status code', async () => {
    const trifidInstance = await createTrifidInstance()
    const trifidListener = await trifidInstance.start()
    const pluginUrl = `${getListenerURL(trifidListener)}/healthz`
    const response = await fetch(pluginUrl)
    const _responseText = await response.text()
    await trifidListener.close()

    strictEqual(response.status, 200)
  })

  it('should call health request with valid response', async () => {
    const trifidInstance = await createTrifidInstance()
    const trifidListener = await trifidInstance.start()
    const pluginUrl = `${getListenerURL(trifidListener)}/healthz`
    const response = await fetch(pluginUrl)
    const responseText = await response.text()
    await trifidListener.close()

    strictEqual(responseText.split('\n')[0], 'OK')
    strictEqual(response.status, 200)
    strictEqual(response.headers.get('content-type')?.split(';')[0], 'text/plain')
  })

  it('should not call health request', async () => {
    const trifidInstance = await createTrifidInstance()
    const trifidListener = await trifidInstance.start()
    const pluginUrl = `${getListenerURL(trifidListener)}/non-existant-route`
    const response = await fetch(pluginUrl)
    const _responseText = await response.text()
    await trifidListener.close()

    strictEqual(response.status, 404)
  })
})
