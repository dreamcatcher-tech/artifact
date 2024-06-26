import { expect, log } from '@utils'
import {
  CradleMaker,
  getTerminalId,
  IoStruct,
  PID,
  print,
} from '@/constants.ts'
import { Machine } from '@/api/web-client-machine.ts'
import { ulid } from 'ulid'

export default (name: string, cradleMaker: CradleMaker) => {
  const prefix = name + ': '
  Deno.test(prefix + 'session', async (t) => {
    const terminal = await cradleMaker()
    log('pid', print(terminal.pid))

    const repo = 'sessions/basic'
    const target = await terminal.init({ repo })

    // TODO exercise the ACL blocking some actions to the session chain
    await t.step('interact', async () => {
      const { local } = await terminal.actions('io-fixture', terminal.pid)
      const result = await local()
      expect(result).toEqual('local reply')
    })
    const second = terminal.newTerminal()
    await t.step('second session', async () => {
      const { local } = await second.actions('io-fixture', target.pid)
      const result = await local()
      expect(result).toEqual('local reply')
    })
    await t.step('cross session', async () => {
      const { local } = await second.actions('io-fixture', terminal.pid)
      const result = await local()
      expect(result).toEqual('local reply')
    })

    const resumed = terminal.resumeTerminal(terminal.pid)
    await t.step('resume session', async () => {
      // TODO this should check if the session is valid
      expect(resumed.pid).toEqual(terminal.pid)
      const { local } = await resumed.actions('io-fixture', target.pid)
      const result = await local()
      expect(result).toEqual('local reply')
    })
    await t.step('invalid session', () => {
      const branches = terminal.pid.branches.slice(0, -1)
      branches.push('invalid ulid')
      const pid = { ...terminal.pid, branches }
      expect(() => terminal.resumeTerminal(pid)).toThrow('invalid terminal')
    })
    // test a session resume to a non existent PID
    await Promise.all([resumed.stop(), second.stop(), terminal.stop()])
    await terminal.engineStop()
  })
  Deno.test(prefix + 'internal requests', async (t) => {
    const session = await cradleMaker()
    const repo = 'sessions/relay'

    const { pid } = await session.init({ repo })

    await t.step('ping', async () => {
      const { branch } = await session.actions('io-fixture', pid)
      const result = await branch()
      expect(result).toEqual('remote pong')
    })

    await session.engineStop()
  })
  Deno.test(prefix + 'machine reload', async () => {
    const terminal = await cradleMaker()
    await terminal.initializationPromise
    const root = await terminal.machine.rootTerminalPromise
    log('root session', print(root.pid))

    const io = await terminal.readJSON<IoStruct>('.io.json', root.pid)

    const machine = terminal.machine as Machine
    const next = machine.clone()
    expect(next.pid).toEqual(machine.pid)
    const nextRoot = await next.rootTerminalPromise
    log('cloned')
    expect(nextRoot.pid).toEqual(root.pid)
    log('next root session', print(nextRoot.pid))

    const nextIo = await terminal.readJSON<IoStruct>('.io.json', nextRoot.pid)
    expect(io).toEqual(nextIo)

    await terminal.engineStop()
  })
  Deno.test(prefix + 'session reload', async () => {
    const terminal = await cradleMaker()
    log('engine started')
    await terminal.initializationPromise
    log('terminal initialized')

    const root = await terminal.machine.rootTerminalPromise
    log('root session', print(root.pid))

    const actors = getBase(root.pid)
    const actorsIo = await terminal.readJSON<IoStruct>('.io.json', actors)
    const io = await terminal.readJSON<IoStruct>('.io.json', root.pid)

    const machine = terminal.machine as Machine
    const next = machine.clone()
    expect(next.pid).toEqual(machine.pid)
    const nextRoot = await next.rootTerminalPromise
    log('cloned')
    expect(nextRoot.pid).toEqual(root.pid)
    log('next root session', print(nextRoot.pid))

    const nextIo = await terminal.readJSON<IoStruct>('.io.json', nextRoot.pid)
    expect(nextIo).toEqual(io)
    nextRoot.resumeTerminal(terminal.pid)
    log('resumed')
    const lastIo = await terminal.readJSON<IoStruct>('.io.json', nextRoot.pid)
    expect(lastIo).toEqual(io)

    const lastActorsIo = await terminal.readJSON<IoStruct>('.io.json', actors)
    expect(lastActorsIo).toEqual(actorsIo)

    await terminal.engineStop()
  })
  Deno.test(prefix + 'session reload missing', async () => {
    const terminal = await cradleMaker()
    await terminal.initializationPromise
    const missingTerminalPid = newTerminalPid(terminal.pid)

    const root = await terminal.machine.rootTerminalPromise

    const { pid } = root.machine
    const io = await terminal.readJSON<IoStruct>('.io.json', pid)
    const terminalId = getTerminalId(missingTerminalPid)
    expect(Object.values(io.branches)).not.toContain(terminalId)

    const missing = root.resumeTerminal(missingTerminalPid)
    expect(missing.pid).toEqual(missingTerminalPid)
    await missing.initializationPromise
    const lastIo = await terminal.readJSON<IoStruct>('.io.json', pid)
    expect(Object.values(lastIo.branches)).toContain(terminalId)
    await terminal.engineStop()
  })
}
const getBase = (pid: PID) => {
  const branches = [pid.branches[0]]
  return { ...pid, branches }
}
const newTerminalPid = (pid: PID) => {
  const branches = [...pid.branches]
  branches[branches.length - 1] = ulid()
  return { ...pid, branches }
}
