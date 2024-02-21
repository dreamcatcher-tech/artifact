import Cradle from './cradle.ts'
import { Debug, expect, log } from '@utils'
import { PID } from './constants.ts'

Deno.test('io', async (t) => {
  const artifact = await Cradle.create()
  await t.step('ping empty', async () => {
    const empty = await artifact.ping()
    expect(empty).toEqual({})
  })
  await t.step('ping with params', async () => {
    const result = await artifact.ping({ test: 'test' })
    expect(result).toEqual({ test: 'test' })
  })

  let target!: PID
  await t.step('clone', async () => {
    const cloneResult = await artifact.clone({ repo: 'dreamcatcher-tech/HAL' })
    log('clone result', cloneResult)
    target = cloneResult.pid
    // TODO read the fs and see what the state of the file system is ?
    expect(target).toBeDefined()
  })

  await artifact.stop()
})
Deno.test.ignore('child to self', async (t) => {})
Deno.test.ignore('child to child', async (t) => {})
Deno.test.ignore('child to parent', async (t) => {})
Deno.test.only('pierce', async (t) => {
  const isolate = 'io-fixture'
  const artifact = await Cradle.create()
  const { pid: target } = await artifact.init({ repo: 'cradle/pierce' })
  const dispatches = await artifact.pierces(isolate, target)
  await t.step('local', async () => {
    Debug.enable('*')
    const result = await dispatches.local()
    log('local result', result)
    expect(result).toBe('local reply')
  })
  // await t.step('second local', async () => {
  //   const second = await dispatches.local()
  //   expect(second).toBe('local reply')
  // })
  // await t.step('throws', async () => {
  //   const message = 'test message'
  //   await expect(dispatches.error({ message })).rejects.toThrow(message)
  // })
  // await t.step('child process', async () => {
  //   const result = await actions.spawn({ isolate })
  //   expect(result).toBe('remote pong')
  // })
})
