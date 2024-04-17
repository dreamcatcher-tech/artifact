import { UnsequencedRequest } from '@/constants.ts'
import { IsolatePromise } from '@/constants.ts'
import { assert, deserializeError, equal, expect } from '@utils'

export default class Accumulator {
  #index = 0
  #buffer: IsolatePromise[] = []
  #new: IsolatePromise[] = []
  #isActive = false
  #trigger: (() => void) | undefined
  private constructor() {}
  static create(buffer: IsolatePromise[] = []) {
    const acc = new Accumulator()
    acc.#buffer = buffer
    return acc
  }
  get accumulations() {
    return [...this.#new]
  }
  push(request: IsolatePromise) {
    assert(this.isActive, 'Activity is denied')
    assert(typeof this.#trigger === 'function', 'Trigger is not set')
    this.#trigger()
    this.#new.push(request)
    this.#buffer.push(request)
  }
  recover(request: UnsequencedRequest) {
    assert(this.isActive, 'Activity is denied')
    const index = this.#index++
    if (this.#buffer[index]) {
      const recovered = this.#buffer[index]
      assert(equal(recovered.request, request), 'Requests are not equal')
      return recovered
    }
  }
  activate(symbol: symbol) {
    assert(!this.isActive, 'Activity is already active')
    assert(!this.#trigger, 'Trigger is already set')
    this.#isActive = true
    return new Promise<symbol>((resolve) => {
      this.#trigger = () => resolve(symbol)
    })
  }
  deactivate() {
    assert(this.isActive, 'Activity is not active')
    this.#isActive = false
    this.#trigger = undefined
  }
  get isActive() {
    return this.#isActive
  }
  /**
   * Used so that an execution can be paused, then receive replies from
   * accumulated actions, then continue without restarting the execution.  Makes
   * it easier to debug these functions, but also can be faster to execute.
   * This is a nice to have and the operation is equally capable of starting
   * again, if we find ourselves replaying the operation with no existing cache.
   *
   * As new layers of the accumulation process occur, the filesystem object
   * referenced by the isolate-api object will tick forwards.
   *
   * @param from The newer accumulator that should be copied in to the old one
   */
  absorb(from: Accumulator) {
    assert(!this.isActive, '"this" is already active')
    assert(!from.isActive, '"from" is already active')
    if (!(this.#buffer.length <= from.#buffer.length)) {
      console.log('this buffer length', this.#buffer.length)
      console.dir(this.#buffer, { depth: null })
      console.log('from buffer length', from.#buffer.length)
      console.dir(from.#buffer, { depth: null })
    }
    assert(this.#buffer.length <= from.#buffer.length, '"this" must be shorter')
    let index = 0
    for (const source of from.#buffer) {
      const sink = this.#buffer[index++]
      if (!sink) {
        this.#buffer.push(source)
        continue
      }
      if (!equal(source.request, sink.request)) {
        expect(source.request).toEqual(sink.request)
      }
      if (sink.outcome) {
        assert(equal(source.outcome, sink.outcome), 'outcomes are not equal')
      } else {
        sink.outcome = source.outcome
      }
      if (sink.outcome && sink.resolve) {
        assert(sink.reject, 'sink has no reject')
        if (sink.outcome.error) {
          sink.reject(deserializeError(sink.outcome.error))
        } else {
          sink.resolve(sink.outcome.result)
        }
      }
    }
  }
}
