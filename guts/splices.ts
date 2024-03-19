import { assert, Debug, delay, expect, log } from '@utils'
import { Cradle } from '../api/web-client.types.ts'

export default (name: string, cradleMaker: () => Promise<Cradle>) => {
  const prefix = name + ': '
  Deno.test(prefix + 'files', async (t) => {
    const artifact = await cradleMaker()
    const repo = 'process/session'
    await artifact.rm({ repo })
    const { pid } = await artifact.init({ repo })
    const { write } = await artifact.pierces('io-fixture', pid)

    await t.step('read', async () => {
      write({ path: 'test', content: 'hello' })
      let first
      for await (const splice of artifact.read({ pid, path: 'test' })) {
        log('splice', splice)
        first = splice
        break
      }
      assert(first)
      expect(first.pid).toEqual(pid)
      expect(first.path).toEqual('test')
      expect(first.changes).toHaveLength(1)
      assert(first.changes)
      expect(first.changes[0].value).toEqual('hello')
    })
    // do a writeSlow test to see how broadcast channel behaves
    // and to test the catchup of the final commit

    await artifact.stop()
  })
  Deno.test.only(prefix + '.io.json diffs', async (t) => {
    // send in a bunch of actions and view the diffs as splices

    const artifact = await cradleMaker()
    const repo = 'process/session'
    await artifact.rm({ repo })
    const { pid } = await artifact.init({ repo })
    const { write } = await artifact.pierces('io-fixture', pid)

    Debug.enable('*tests *cradle')
    const logger = async () => {
      const stream = artifact.read({ pid, path: '.io.json' })
      // make a library that transforms splice streams
      for await (const splice of stream) {
        log('splice', splice)
      }
      log('done')
    }
    logger()

    await t.step('read', async () => {
      const promise = write({ path: 'test', content: 'hello' })
      let first
      for await (const splice of artifact.read({ pid, path: 'test' })) {
        // log('test splice', splice)
        first = splice
        break
      }
      assert(first)
      expect(first.pid).toEqual(pid)
      expect(first.path).toEqual('test')
      expect(first.changes).toHaveLength(1)
      assert(first.changes)
      expect(first.changes[0].value).toEqual('hello')
      await promise
    })
    // ? how should we cancel streams that are in flight ?
    await artifact.stop()
  })
  // do broadcast channel for partial writes occuring
}
