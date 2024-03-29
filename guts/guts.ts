// the Grand Unified Test Suite™

import { expect, log } from '@utils'
import { Cradle } from '../api/web-client.types.ts'
import processMgmt from './process-mgmt.ts'
import aiCalls from './ai-calls.ts'
import splices from './splices.ts'
const isolate = 'io-fixture'

export default (name: string, cradleMaker: () => Promise<Cradle>) => {
  const prefix = name + ': '

  Deno.test(prefix + 'io', async (t) => {
    const artifact = await cradleMaker()
    await t.step('ping empty', async () => {
      const empty = await artifact.ping()
      expect(empty).toEqual({})
    })
    await t.step('ping with params', async () => {
      const result = await artifact.ping({ test: 'test' })
      expect(result).toEqual({ test: 'test' })
    })

    await artifact.rm({ repo: 'dreamcatcher-tech/HAL' })

    await t.step('clone', async () => {
      const clone = await artifact.clone({ repo: 'dreamcatcher-tech/HAL' })
      log('clone result', clone)
      // TODO read the fs and see what the state of the file system is ?
      expect(clone.pid).toBeDefined()
      expect(clone.pid.account).toBe('dreamcatcher-tech')
      expect(typeof clone.head).toBe('string')
    })
    await artifact.stop()
  })
  Deno.test.ignore(prefix + 'child to self', async () => {})
  Deno.test.ignore(prefix + 'child to child', async () => {})
  Deno.test.ignore(prefix + 'child to parent', async () => {})
  Deno.test(prefix + 'pierce', async (t) => {
    const artifact = await cradleMaker()
    await artifact.rm({ repo: 'cradle/pierce' })
    const { pid: target } = await artifact.init({ repo: 'cradle/pierce' })
    const pierces = await artifact.pierces(isolate, target)
    await t.step('local', async () => {
      const result = await pierces.local()
      log('local result', result)
      expect(result).toBe('local reply')
    })
    await t.step('second local', async () => {
      const second = await pierces.local()
      expect(second).toBe('local reply')
    })

    await t.step('throws', async () => {
      const message = 'test message'
      await expect(pierces.error({ message })).rejects.toThrow(message)
    })
    await t.step('params fails validation', async () => {
      const msg = 'Parameters Validation Error: '
      await expect(pierces.local({ invalid: 'parameters' }))
        .rejects.toThrow(msg)
    })
    await artifact.stop()
  })

  Deno.test(prefix + 'resource hogging', async (t) => {
    const artifact = await cradleMaker()
    const repo = 'cradle/pierce'
    await artifact.rm({ repo })
    const { pid: target } = await artifact.init({ repo })
    const { local } = await artifact.pierces(isolate, target)

    await t.step('serial', async () => {
      const promises = []
      const count = 20
      for (let i = 0; i < count; i++) { // at 20, this fails on cloud
        promises.push(local())
      }
      log('promises start')
      const results = await Promise.all(promises)
      for (const result of results) {
        expect(result).toBe('local reply')
      }
      log('done')

      const logs: unknown[] = await artifact.logs({ repo: 'cradle/pierce' })
      log('logs', logs.length)
      expect(logs.length).toBeGreaterThan(count)

      await artifact.stop()
    })
  })
  Deno.test(prefix + 'resource hogging parallel', async (t) => {
    const artifact = await cradleMaker()
    const repo = 'cradle/pierce'
    await artifact.rm({ repo })

    const { pid: target } = await artifact.init({ repo })
    const { local } = await artifact.pierces(isolate, target)

    await t.step('parallel', async () => {
      const promises = []
      const count = 20
      for (let i = 0; i < count; i++) { // at 20, this fails on cloud
        promises.push(local({}, { branch: true }))
      }
      log('promises start')
      const results = await Promise.all(promises)
      for (const result of results) {
        expect(result).toBe('local reply')
      }
      log('done')

      const logs: unknown[] = await artifact.logs({ repo: 'cradle/pierce' })
      expect(logs.length).toBeGreaterThan(count * 2)

      await artifact.stop()
    })
  })
  Deno.test(prefix + 'github operations', async (t) => {
    const artifact = await cradleMaker()
    const pid = {
      account: 'dreamcatcher-tech',
      repository: 'HAL',
      branches: ['main'],
    }
    await artifact.rm({ repo: 'dreamcatcher-tech/HAL' })
    await t.step('probe empty', async () => {
      const result = await artifact.probe({ repo: 'dreamcatcher-tech/HAL' })
      log('probe result', result)
      expect(result).toBeUndefined()
    })
    await t.step('init', async () => {
      const result = await artifact.init({ repo: 'dreamcatcher-tech/HAL' })
      log('init result', result)
      expect(result).toBeDefined()
      expect(result!.pid).toEqual(pid)
      expect(typeof result!.head).toBe('string')
    })
    await t.step('probe', async () => {
      const result = await artifact.probe({ repo: 'dreamcatcher-tech/HAL' })
      log('probe result', result)
      expect(result).toBeDefined()
      expect(result!.pid).toEqual(pid)
    })
    await artifact.stop()
  })
  processMgmt(name, cradleMaker)
  aiCalls(name, cradleMaker)
  splices(name, cradleMaker)
}
