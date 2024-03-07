import IOChannel from '../io/io-channel.ts'
import { getPoolKey } from '@/artifact/keys.ts'
import { SolidReply, SolidRequest } from '@/artifact/constants.ts'
import IsolateApi from '../isolate-api.ts'
import Compartment from '../io/compartment.ts'
import { IFs, Outcome, Request } from '@/artifact/constants.ts'
import { serializeError } from 'https://esm.sh/serialize-error'
import { Debug, equal } from '@utils'
import { assert } from 'https://deno.land/std@0.217.0/assert/assert.ts'
import { PID } from '@/artifact/constants.ts'
import Accumulator from '@/artifact/exe/accumulator.ts'
const log = Debug('AI:exe')

/**
 * Induct poolable items into the commit history
 */
type I = (request: SolidRequest | SolidReply) => Promise<void>

export default class Executor {
  #functions = new Map<string, Execution>()
  static create() {
    return new Executor()
  }
  /**
   * We expect the execlock has already been acquired, giving this function
   * authority to operate.
   * @returns true if the request was run to completion, false if it has some
   * dependent actions that need it is awaiting
   */
  async execute(pid: PID, commit: string, req: SolidRequest, fs: IFs, i: I) {
    assert(equal(pid, req.target), 'target is not self')
    const io = await IOChannel.load(pid, fs, commit)
    assert(io.isCallable(req), 'request is not callable')
    log('request %o %o', req.isolate, req.functionName)

    const ioAccumulator = io.getAccumulator()

    const exeId = getExeId(req)
    if (!this.#functions.has(exeId)) {
      const isolateApi = IsolateApi.create(fs, commit, pid, ioAccumulator)
      const compartment = await Compartment.create(req.isolate)
      const functions = compartment.functions(isolateApi)
      const execution = {
        function: Promise.resolve().then(() => {
          return functions[req.functionName](req.params)
        }).then((result) => {
          const outcome: Outcome = { result }
          log('self result: %o', outcome.result)
          return outcome
        }).catch((error) => {
          // TODO cancel all outstanding requests
          // and transmit them to the chains that are running them
          log('error', error.message)
          const outcome: Outcome = { error: serializeError(error) }
          return outcome
        }),
        accumulator: ioAccumulator,
      }
      this.#functions.set(exeId, execution)
    }
    log('running function %o', exeId)
    const execution = this.#functions.get(exeId)
    assert(execution, 'execution not found')
    execution.accumulator.absorb(ioAccumulator)

    const accumulatorPromise = execution.accumulator.await()
    const winner = await Promise.race([execution.function, accumulatorPromise])
    execution.accumulator.arm()

    if (isOutcome(winner)) {
      const sequence = io.getSequence(req)
      const reply: SolidReply = { target: pid, sequence, outcome: winner }
      await i(reply)
      log('exe complete %o', reply)
      return true
    }

    log('accumulator triggered first')
    const { accumulations } = execution.accumulator
    for (const accumulation of accumulations) {
      log('accumulation:', accumulation.request)
      await i(accumulation.request)
    }
    return false
  }
}

type Execution = {
  function: Promise<Outcome>
  accumulator: Accumulator
}
const getExeId = (request: Request) => {
  const id = getPoolKey(request)
  return JSON.stringify(id)
}
const isOutcome = (value: unknown): value is Outcome => {
  return typeof value === 'object' && value !== null &&
    ('result' in value || 'error' in value) &&
    !('result' in value && 'error' in value)
}