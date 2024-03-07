/**
 * Manages the .io.json file
 */

import IsolateApi from '@/artifact/isolate-api.ts'
import {
  IoStruct,
  isPierceRequest,
  PID,
  Request,
  toRunnableRequest,
} from '@/artifact/constants.ts'
import { Debug, equal } from '@utils'
import { IFs } from '@/artifact/constants.ts'
import { assert } from '@utils'
import { PROCTYPE } from '@/artifact/constants.ts'
import { SolidRequest } from '@/artifact/constants.ts'
import { MergeReply } from '@/artifact/constants.ts'
import { SolidReply } from '@/artifact/constants.ts'
import Accumulator from '@/artifact/exe/accumulator.ts'
const log = Debug('AI:io-file')

export default class IOChannel {
  #pid: PID
  #api: IsolateApi
  #io: IoStruct
  constructor(pid: PID, api: IsolateApi, io: IoStruct) {
    this.#pid = pid
    this.#api = api
    this.#io = io
  }
  // TODO make commit required
  static async load(pid: PID, fs: IFs, commit?: string) {
    const api = IsolateApi.createFS(fs, commit)
    let io: IoStruct = { sequence: 0, requests: {}, replies: {} }
    if (await api.exists('.io.json')) {
      io = await api.readJSON('.io.json') as IoStruct
      check(io)
      blankSettledRequests(io, pid)
    }
    return new IOChannel(pid, api, io)
  }
  save() {
    return this.#api.writeJSON('.io.json', this.#io)
  }
  /**
   * @returns true if there are any requests that are accumulating, as in they
   * have no replies yet, but are needed to continue execution
   */
  isAccumulating() {
    for (const [key, request] of Object.entries(this.#io.requests)) {
      if (isAccumulation(request, this.#pid)) {
        if (!this.#io.replies[key]) {
          return true
        }
      }
    }
    return false
  }
  isCallable(attempt: SolidRequest) {
    if (this.isAccumulating()) {
      return false
    }
    // TODO assert this is the first serial request to be called
    const sequence = this.getSequence(attempt)
    return this.#io.replies[sequence] === undefined
  }
  getExecutingRequest() {
    // get the first non accumulation request with no reply yet
    const openRequests = this.#getOpenRequestIndices()
    for (const key of openRequests) {
      const request = this.#io.requests[key]
      if (!isAccumulation(request, this.#pid)) {
        const runnable = toRunnableRequest(request, key)
        return runnable
      }
    }
    throw new Error('no executing request found')
  }
  getSequence(request: SolidRequest) {
    for (const [key, value] of Object.entries(this.#io.requests)) {
      const test = toRunnableRequest(value, Number.parseInt(key))
      if (equal(test, request)) {
        return Number.parseInt(key)
      }
    }
    throw new Error('request not found')
  }
  addRequest(request: Request) {
    const sequence = this.#io.sequence++
    this.#io.requests[sequence] = request
    return sequence
  }
  reply(reply: SolidReply | MergeReply) {
    const { sequence } = reply
    assert(Number.isInteger(sequence), 'reply needs a sequence number')
    assert(sequence >= 0, 'reply needs a whole sequence number')

    const request = this.#io.requests[sequence]
    assert(request, `reply sequence not found: ${sequence}`)
    assert(!this.#io.replies[sequence], 'sequence already replied')
    this.#io.replies[sequence] = reply.outcome
    return request
  }
  getAccumulator(): Accumulator {
    const indices: number[] = []
    for (const [key, request] of Object.entries(this.#io.requests)) {
      // must only get accumulations that came after the current origin ?
      if (isAccumulation(request, this.#pid)) {
        // find the lowest sequence that is not an accumulation and has no
        // pending accumulations.

        indices.push(Number.parseInt(key))
      }
    }
    indices.sort((a, b) => a - b)
    const accumulations = indices.map((key) => {
      const request = this.#io.requests[key]
      assert(!isPierceRequest(request), 'pierce request in accumulator')
      const outcome = this.#io.replies[key]
      return { request, outcome }
    })
    return Accumulator.create(accumulations)
  }
  print() {
    return JSON.stringify(this.#io, null, 2)
  }
  getPrior(sequence: number) {
    // TODO UNTESTED
    const keys = Object.keys(this.#io.requests).map(Number)
    keys.sort((a, b) => b - a)
    for (const key of keys) {
      assert(key <= sequence, `out of order sequence: ${key}`)
      if (this.#io.replies[key]) {
        continue
      }
      if (key < sequence) {
        return key
      }
    }
  }
  #getOpenRequestIndices() {
    const keys = Object.keys(this.#io.requests).map(parseInt)
    keys.sort((a, b) => a - b)
    return keys.filter((k) => !this.#io.replies[k])
  }
}
const check = (io: IoStruct) => {
  const requests = Object.values(io.requests)
  requests.every((request, index) =>
    requests.slice(index + 1).every((item) => !equal(item, request)) ||
    assert(false, 'duplicate request')
  )
  // TODO do the same for reply values
  for (const replyKey of Object.keys(io.replies)) {
    assert(replyKey in io.requests, 'no reply key in requests')
  }
}

const blankSettledRequests = (io: IoStruct, thisPid: PID) => {
  const toBlank = []
  for (const key in io.replies) {
    if (!isAccumulation(io.requests[key], thisPid)) {
      toBlank.push(key)
    }
  }
  for (const key of toBlank) {
    delete io.requests[key]
    delete io.replies[key]
    log('deleted', key)
  }
  // TODO blank accumulations when the origin is resolved
}
const isAccumulation = (request: Request, thisPid: PID) => {
  if (isPierceRequest(request)) {
    return false
  }
  if (!equal(thisPid, request.target)) {
    assert(equal(thisPid, request.source), 'source must be equal to pid')
    return true
  } else {
    if (equal(thisPid, request.source)) {
      assert(request.proctype !== PROCTYPE.SERIAL, 'no serial accumulation')
      return true
    }
  }
  return false
}
