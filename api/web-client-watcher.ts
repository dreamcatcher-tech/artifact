import {
  EngineInterface,
  IoStruct,
  isPierceRequest,
  PID,
} from './web-client.types.ts'
import { deserializeError } from 'serialize-error'

type PiercePromise = {
  resolve: (value: unknown) => void
  reject: (error: Error) => void
}
export class PierceWatcher {
  readonly #pierces = new Map<string, PiercePromise>()
  readonly #signal: AbortSignal
  readonly #engine: EngineInterface
  readonly #pid: PID
  constructor(signal: AbortSignal, engine: EngineInterface, pid: PID) {
    this.#signal = signal
    this.#engine = engine
    this.#pid = pid
  }
  static create(signal: AbortSignal, engine: EngineInterface, pid: PID) {
    return new PierceWatcher(signal, engine, pid)
  }
  watch(ulid: string, resolvers: PiercePromise) {
    this.#pierces.set(ulid, resolvers)
  }
  async watchPierces() {
    let lastSplice
    const after = undefined
    const s = this.#engine.read(this.#pid, '.io.json', after, this.#signal)
    for await (const splice of s) {
      // move these checks to the engine side
      if (lastSplice && splice.commit.parent[0] !== lastSplice.oid) {
        console.dir(splice, { depth: Infinity })
        console.dir(lastSplice, { depth: Infinity })
        throw new Error('parent mismatch: ' + splice.oid)
      }
      lastSplice = splice

      if (splice.changes['.io.json']) {
        const { patch } = splice.changes['.io.json']
        // TODO move to unified diff patches
        if (!patch) {
          throw new Error('io.json patch not found')
        }
        const io = JSON.parse(patch)
        this.#resolvePierces(io)
      }
    }
  }
  #resolvePierces(io: IoStruct) {
    for (const [, value] of Object.entries(io.requests)) {
      if (isPierceRequest(value)) {
        if (this.#pierces.has(value.ulid)) {
          const outcome = getOutcomeFor(io, value.ulid)
          if (outcome) {
            const promise = this.#pierces.get(value.ulid)
            this.#pierces.delete(value.ulid)
            if (!promise) {
              throw new Error('Promise not found')
            }
            if (outcome.error) {
              promise.reject(deserializeError(outcome.error))
            } else {
              promise.resolve(outcome.result)
            }
          }
        }
      }
    }
  }
}

const getOutcomeFor = (io: IoStruct, ulid: string) => {
  for (const [key, value] of Object.entries(io.requests)) {
    if (isPierceRequest(value)) {
      if (value.ulid === ulid) {
        return io.replies[key]
      }
    }
  }
}