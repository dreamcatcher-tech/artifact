import { Debug } from '@utils'
import { C } from './isolates/artifact.ts'
import IsolateApi from './isolate-api.ts'
import { IsolateFunctions } from './constants.ts'
import { assert } from '$std/assert/assert.ts'
import { ulid } from '$std/ulid/mod.ts'
import { Outcome } from '@/artifact/constants.ts'
import {
  deserializeError,
  serializeError,
} from 'https://esm.sh/serialize-error'
import { Params } from '@/artifact/constants.ts'
const log = Debug('AI:queue')
type QFunction = { id: string; name: string; params?: Params }
const fifteenMinutes = 15 * 60 * 1000

export default class Queue {
  #api!: IsolateApi<C>
  #functions!: IsolateFunctions
  #kv!: Deno.Kv
  static create(functions: IsolateFunctions, api: IsolateApi<C>) {
    const queue = new Queue()
    queue.#api = api
    queue.#functions = functions
    queue.#kv = api.context.db!.kv
    queue.#listen()
    return queue
  }
  // TODO do tampering, like double message delivery, missed messages, delays
  async push(name: string, params?: Params) {
    const id = ulid()
    const msg = { id, name, params }
    const key = ['QUEUE', id, name]
    const stream = this.#kv.watch<Outcome[]>([key])
    await this.#kv.enqueue(msg, { backoffSchedule: [] })
    for await (const [event] of stream) {
      if (!event.versionstamp) {
        continue
      }
      const outcome: Outcome = event.value
      if (outcome.error) {
        throw deserializeError(outcome.error)
      }
      return outcome.result
    }
  }
  #listen() {
    this.#kv.listenQueue(async (msg: QFunction) => {
      assert(this.#functions[msg.name], `missing ${msg.name}`)
      const { id, name, params = {} } = msg
      const outcomeKey = ['QUEUE', id, name]
      const key = [...outcomeKey, 'pending']
      // TODO rely on the artifact functions to handle double delivery
      const result = await this.#kv.atomic().check({ key, versionstamp: null })
        .set(key, true, { expireIn: fifteenMinutes }).commit()
      if (!result.ok) {
        log('already processing', id, name)
        return
      }
      const outcome: Outcome = {}
      try {
        // TODO will the queue wait forever ?
        outcome.result = await this.#functions[name](params, this.#api)
      } catch (error) {
        outcome.error = serializeError(error)
      }
      await this.#kv.set(outcomeKey, outcome, { expireIn: fifteenMinutes })
    })
  }
}