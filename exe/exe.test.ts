import IOChannel, { toUnsequenced } from '../io/io-channel.ts'
import FS from '../git/fs.ts'
import Executor from './exe.ts'
import { C, isPierceRequest, PROCTYPE, SolidRequest } from '@/constants.ts'
import { assert, expect, log } from '@utils'
import DB from '@/db.ts'
import { UnsequencedRequest } from '@/constants.ts'

const pid = { id: 't', account: 'exe', repository: 'test', branches: ['main'] }
const source = { ...pid, account: 'higher' }
const request: SolidRequest = {
  isolate: 'io-fixture',
  functionName: 'local',
  params: {},
  proctype: PROCTYPE.SERIAL,
  target: pid,
  source,
  sequence: 0,
}
const mocks = async (initialRequest: SolidRequest) => {
  const db = await DB.create()
  let fs = await FS.init(pid, db)
  let io = await IOChannel.load(fs)
  io.addRequest(initialRequest)
  io.save()
  const { next } = await fs.writeCommitObject()
  fs = next
  io = await IOChannel.load(fs)
  const stop = () => db.stop()
  const exe = Executor.createCacheContext()
  const context: C = { db, exe }
  return { context, exe, io, fs, db, stop }
}
Deno.test('simple', async (t) => {
  const { context, exe, fs, stop } = await mocks(request)
  await t.step('no accumulations', async () => {
    const result = await exe.execute(request, fs.oid, context)
    assert('settled' in result)
    const { settled } = result
    const { reply, fs: settledFs } = settled
    expect(reply.target).toEqual(pid)
    expect(reply.outcome).toEqual({ result: 'local reply' })
    expect(settledFs).toEqual(fs)
    expect(settledFs.isChanged).toBeFalsy()
  })
  stop()
})
Deno.test('writes', async (t) => {
  const write = {
    ...request,
    functionName: 'write',
    params: { path: 'test.txt', content: 'hello' },
  }
  const { context, exe, fs, stop } = await mocks(write)
  await t.step('single file', async () => {
    const result = await exe.execute(write, fs.oid, context)
    assert('settled' in result)
    const { reply, fs: settledFs } = result.settled
    expect(reply.target).toEqual(pid)
    expect(reply.outcome.result).toBeUndefined()
    expect(settledFs).toEqual(fs)
    expect(settledFs.upserts).toEqual(['test.txt'])
    expect(settledFs.deletes).toHaveLength(0)
  })
  stop()
  // write, delete, write
  // write, delete,
  // delete existing file
  // multiple writes to the same file

  // check the broadcasting is working
  // throttle the broadcast updates - thrash to check it works
})

Deno.test('loopback', async () => {
  const compound = { ...request, functionName: 'compound' }
  const { context, exe, fs, stop } = await mocks(compound)
  const result = await exe.execute(compound, fs.oid, context)
  expect('pending' in result).toBeTruthy()
  stop()
})

Deno.test('compound', async (t) => {
  const target = { account: 'exe', repository: 'other', branches: ['other'] }
  const compound = {
    isolate: 'io-fixture',
    proctype: PROCTYPE.SERIAL,
    target: pid,
    source,
    sequence: 0,
    functionName: 'compound',
    params: { target },
  }
  const { context, exe, io, fs, stop } = await mocks(compound)
  let request: UnsequencedRequest
  await t.step('half done', async () => {
    const result = await exe.execute(compound, fs.oid, context)
    assert('pending' in result)
    const { requests } = result.pending
    expect(requests).toHaveLength(1)
    request = requests[0]
    log('internalRequest', request)
    expect(request.target).toEqual(target)
  })
  await t.step('reply using function cache', async () => {
    assert(request)
    const sequenced = io.addPending(0, 'fakeCommit', [request])
    expect(sequenced).toHaveLength(1)
    const target = sequenced[0].source
    const reply = {
      target,
      source: target,
      outcome: { result: 'compound reply' },
      sequence: sequenced[0].sequence,
      commit: 'fakeCommit',
    }
    const savedRequest = io.reply(reply)
    assert(!isPierceRequest(savedRequest))
    expect(toUnsequenced(savedRequest)).toEqual(request)
    io.save()
    const { next } = await fs.writeCommitObject()

    const result = await exe.execute(compound, next.oid, context)
    expect('settled' in result).toBeTruthy()
  })
  await t.step('reply from replay', async () => {
    assert(request)
    const io = await IOChannel.load(fs)
    const sequenced = io.addPending(0, 'fakeCommit2', [request])
    expect(sequenced).toHaveLength(1)
    const target = pid
    const reply = {
      target,
      source: target,
      commit: 'fakeCommit',
      outcome: { result: 'compound reply' },
      sequence: sequenced[0].sequence,
    }
    io.reply(reply)
    io.save()
    const { next } = await fs.writeCommitObject()

    const c = { ...context, exe: Executor.createCacheContext() }
    const result = await c.exe.execute(compound, next.oid, c)
    expect('settled' in result).toBeTruthy()
  })
  stop()

  // multiple outstanding requests
  // test that it will not get rerun unless all outstanding are returned
  // test rejection
  // dangling requests are awaited until function resolves
  // branch request to self is ok
  // test multiple cycles thru requests and replies
  // test making different request between two invocations
})
// test repeat calling should not corrupt the cache, and should return the same,
// even if the commit was several accumulations ago
