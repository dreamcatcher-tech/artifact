import merge from 'npm:lodash.merge'
import Cradle from '../cradle.ts'
import { Debug, expect, log } from '@utils'
import IsolateApi from '../isolate-api.ts'
import { Help, RUNNERS } from '../constants.ts'
import runner from './runner-chat.ts'
import FS from '@/git/fs.ts'
import DB from '@/db.ts'
import Accumulator from '@/exe/accumulator.ts'

Deno.test('runner', async (t) => {
  const helpBase: Help = {
    config: {
      model: 'gpt-3.5-turbo',
    },
    runner: RUNNERS.CHAT,
    commands: ['io-fixture:local', 'io-fixture:error'],
    instructions: ['Only reply with a SINGLE word'],
  }
  const db = await DB.create()
  const fs = await FS.init('runner/test', db)
  const api = IsolateApi.create(fs, Accumulator.create())

  Debug.enable('AI:runner*')
  await t.step('hello world', async () => {
    const help = merge({}, helpBase, { commands: [] })
    const text = 'reply with the cheese emoji'
    const result = await runner({ help, text }, api)
    expect(result).toBe('🧀')
    log('result', result)
    const session = await api.readJSON('session.json')
    log('session', session)
    expect(session).toHaveLength(3)
  })
  await t.step('tool call', async () => {
    const text = 'call the "local" function'
    const help = merge({}, helpBase, {
      instructions: ['return the function call results verbatim'],
    })
    const result = await runner({ help, text }, api)
    expect(result).toContain('local reply')
  })
  await t.step('tool error', async () => {
    const text = 'call the "error" function with message: salami'
    const help = merge({}, helpBase, {
      instructions: ['return the function call results verbatim'],
    })
    const result = await runner({ help, text }, api)
    expect(result).toContain('salami')
    // TODO read the filesystem and get the error message out
  })
  db.stop()
})

Deno.test('artifact', async (t) => {
  const repo = 'dreamcatcher-tech/HAL'
  const artifact = await Cradle.create()
  const { pid } = await artifact.clone({ repo })

  const splices = async () => {
    for await (const splice of artifact.read(pid, 'session.json')) {
      log('splice', splice)
    }
  }
  splices()

  await t.step('chat', async () => {
    const isolate = 'engage-help'
    const { engage } = await artifact.pierces(isolate, pid)
    const result = await engage({ help: 'help-fixture', text: 'hello' })

    log('result', result)
  })
  await artifact.stop()
})
