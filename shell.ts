import { transcribe } from '@/runners/runner-chat.ts'
import Compartment from './io/compartment.ts'
import {
  Artifact,
  DispatchFunctions,
  isPierceRequest,
  JsonValue,
  Params,
  PID,
  PierceRequest,
  ProcessOptions,
} from './constants.ts'
import { getProcType } from '@/constants.ts'
import { pidFromRepo } from '@/keys.ts'
import { assert, Debug, deserializeError, ulid } from '@utils'
import * as repo from '@/isolates/repo.ts'
import { Engine } from '@/engine.ts'
import { UnsequencedRequest } from '@/constants.ts'
import { PROCTYPE } from '@/constants.ts'
import { IoStruct } from '@/constants.ts'
const log = Debug('AI:cradle')

type PiercePromise = {
  resolve: (value: unknown) => void
  reject: (error: Error) => void
}

// Root device mounted successfully, but /sbin/init does not exist.
// Bailing out, you are on your own now. Good luck.

export class Shell implements Artifact {
  readonly #engine: Engine
  readonly #pid: PID
  private constructor(engine: Engine, pid: PID) {
    this.#engine = engine
    this.#pid = pid
    this.#watchPierces()
  }
  static create(engine: Engine, pid: PID) {
    return new Shell(engine, pid)
  }
  #repo: Promise<repo.Api> | undefined
  async #repoActions() {
    if (!this.#repo) {
      this.#repo = this.actions<repo.Api>('repo', this.#engine.pid)
    }
    return await this.#repo
  }
  stop() {
    // start watching the chain you are subscribed to
    // possibly make a new session immediately ?
    return this.#engine.stop()
  }
  #pierces = new Map<string, PiercePromise>()
  #pierce(pierce: PierceRequest) {
    return new Promise((resolve, reject) => {
      this.#pierces.set(pierce.ulid, { resolve, reject })
      this.#engine.pierce({ pierce })
    })
  }
  #abort = new AbortController()
  async #watchPierces() {
    const watchIo = this.#engine.read(this.#pid, '.io.json', this.#abort.signal)

    let patched = ''
    let lastSplice
    for await (const splice of watchIo) {
      if (lastSplice) {
        assert(splice.commit.parent[0] === lastSplice.oid, 'parent mismatch')
      }
      lastSplice = splice
      if (!splice.changes) {
        continue
      }
      let cursor = 0
      for (const diff of splice.changes) {
        if (diff.added) {
          patched = patched.substring(0, cursor) + diff.value +
            patched.substring(cursor)
          cursor += diff.value.length
        } else if (diff.removed) {
          const count = diff.count ?? 0
          patched = patched.substring(0, cursor) +
            patched.substring(cursor + count)
        } else {
          const count = diff.count ?? 0
          cursor += count
        }
      }
      const io = JSON.parse(patched)
      this.resolvePierces(io)
    }
  }
  async actions<T>(isolate: string, target: PID) {
    // client side, since functions cannot be returned from isolate calls
    const apiSchema = await this.apiSchema({ isolate })
    const pierces: DispatchFunctions = {}
    for (const functionName of Object.keys(apiSchema)) {
      pierces[functionName] = (
        params?: Params,
        options?: ProcessOptions,
      ) => {
        log('pierces %o', functionName)
        const proctype = getProcType(options)
        const request: UnsequencedRequest = {
          target,
          // ulid must be serverside, not browser side or core side
          isolate,
          functionName,
          params: params || {},
          // TODO pass the process options straight thru ?
          proctype,
        }
        const pierce: PierceRequest = {
          target: this.#pid,
          // ulid must be serverside, not browser side or core side
          ulid: ulid(),
          isolate: 'shell',
          functionName: 'pierce',
          params: { request },
          proctype: PROCTYPE.SERIAL,
        }
        return this.#pierce(pierce)
      }
    }
    log('pierces:', isolate, Object.keys(pierces))
    return pierces as T
  }

  //#section ARTIFACT API DIRECT CALLS
  async ping(params?: { data?: JsonValue }) {
    log('ping', params)
    await Promise.resolve()
    // TODO return some info about the deployment
    // version, deployment location, etc
    // if you want to ping in a chain, use an isolate
    if (params?.data) {
      return params.data
    }
  }
  async apiSchema(params: { isolate: string }) {
    // can be edge
    const { isolate } = params
    const compartment = await Compartment.create(isolate)
    return compartment.api
  }
  async transcribe(params: { audio: File }) {
    assert(params.audio instanceof File)
    const text = await transcribe(params.audio)
    return { text }
  }
  async probe({ pid }: { pid: PID }) {
    const actions = await this.#repoActions()
    return actions.probe({ pid })
  }
  async init(params: { repo: string }) {
    // take in a string, and use the id that this client holds
    const pid = pidFromRepo(this.#pid.id, params.repo)
    // basically need to simply relay actions around the place
    const actions = await this.#repoActions()
    return actions.init({ pid })
  }
  async clone(params: { repo: string }) {
    const pid = pidFromRepo(this.#pid.id, params.repo)
    const actions = await this.#repoActions()
    return actions.clone({ pid })
  }
  pull(params: { pid: PID }) {
    const { pid } = params
    return Promise.resolve({ pid, head: 'head' })
  }
  async push(_params: { pid: PID }) {
  }
  async rm(params: { repo: string }) {
    log('rm', params.repo)
    // hit up the system chain to delete some stuff

    const pid = pidFromRepo(this.#pid.id, params.repo)
    const actions = await this.#repoActions()
    return actions.rm({ pid })
  }
  read(pid: PID, path?: string, signal?: AbortSignal) {
    return this.#engine.read(pid, path, signal)
  }
  resolvePierces(io: IoStruct) {
    for (const [, value] of Object.entries(io.requests)) {
      if (isPierceRequest(value)) {
        if (this.#pierces.has(value.ulid)) {
          const outcome = getOutcomeFor(io, value.ulid)
          if (outcome) {
            const promise = this.#pierces.get(value.ulid)
            this.#pierces.delete(value.ulid)
            assert(promise, 'Promise not found')
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

export default Shell

const getOutcomeFor = (io: IoStruct, ulid: string) => {
  for (const [key, value] of Object.entries(io.requests)) {
    if (isPierceRequest(value)) {
      if (value.ulid === ulid) {
        return io.replies[key]
      }
    }
  }
}
