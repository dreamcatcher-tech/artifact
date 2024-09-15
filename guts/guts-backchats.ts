import { expect, log } from '@utils'
import { CradleMaker, hash, print } from '@/constants.ts'
import { Crypto } from '../api/crypto.ts'
import { Backchat } from '../api/client-backchat.ts'
import { Api } from '@/isolates/io-fixture.ts'

export default (name: string, cradleMaker: CradleMaker) => {
  const prefix = name + ':backchats: '
  Deno.test(prefix + 'multi backchat', async (t) => {
    const { engine } = await cradleMaker()
    const key = Crypto.generatePrivateKey()
    const backchat = await Backchat.upsert(engine, key)
    log('pid', print(backchat.pid))

    // TODO exercise the ACL blocking some actions to the session chain
    await t.step('initial', async () => {
      const { local } = await backchat.actions<Api>('io-fixture')
      const result = await local({})
      expect(result).toEqual('local reply')
    })
    const second = await Backchat.upsert(engine, key)
    await t.step('second backchat', async () => {
      const { local } = await second.actions<Api>('io-fixture')
      const result = await local({})
      expect(result).toEqual('local reply')
    })
    await t.step('cross backchat', async () => {
      const opts = { target: backchat.pid }
      const { local } = await second.actions<Api>('io-fixture', opts)
      const result = await local({})
      expect(result).toEqual('local reply')
    })

    const resumed = await Backchat.upsert(engine, key, backchat.id)
    await t.step('resume session', async () => {
      // TODO this should check if the session is valid
      expect(resumed.pid).toEqual(backchat.pid)
      const { local } = await resumed.actions<Api>('io-fixture')
      const result = await local({})
      expect(result).toEqual('local reply')
    })
    await t.step('invalid session', async () => {
      await expect(Backchat.upsert(engine, key, 'invalid'))
        .rejects.toThrow('Invalid resume backchat id: invalid')

      const almost = `bac_${hash('almost')}`
      const next = await Backchat.upsert(engine, key, almost)
      expect(next.id).not.toEqual(almost)
    })
    await engine.stop()
  })

  Deno.test(prefix + 'internal requests', async (t) => {
    const { backchat, engine } = await cradleMaker()
    const repo = 'backchats/relay'
    const { pid } = await backchat.init({ repo })

    await t.step('ping', async () => {
      const { branch } = await backchat.actions<Api>('io-fixture', {
        target: pid,
      })
      const result = await branch({})
      expect(result).toEqual('remote pong')
    })

    await engine.stop()
  })
  Deno.test(prefix + 'readTree', async (t) => {
    const { backchat, engine } = await cradleMaker()
    const { pid } = backchat

    await t.step('empty path', async () => {
      const path = ''
      const result = await backchat.readTree(path, pid)
      expect(result.length).toBeGreaterThan(0)
    })
    await t.step('.', async () => {
      const path = '.'
      const result = await backchat.readTree(path, pid)
      expect(result.length).toBeGreaterThan(0)
    })
    await t.step('tests', async () => {
      const path = 'tests'
      const result = await backchat.readTree(path, pid)
      expect(result.length).toBeGreaterThan(0)
    })
    await t.step('non existent', async () => {
      const path = 'tests/non-existent'
      await expect(backchat.readTree(path, pid))
        .rejects.toThrow('Could not find')
    })

    await engine.stop()
  })
}
