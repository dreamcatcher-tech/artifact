import debug from '$debug'
import git from 'https://esm.sh/isomorphic-git@1.25.3'
import http from 'https://esm.sh/isomorphic-git@1.25.3/http/web'
import { memfs } from 'https://esm.sh/memfs@4.6.0'
import {
  Dispatch,
  ENTRY_BRANCH,
  IsolateFunctions,
  IsolateLifecycle,
  Params,
  PID,
  QMessage,
} from '@/artifact/constants.ts'
import DB from '../db.ts'
import { ulid } from 'std/ulid/mod.ts'
import IsolateApi from '../isolate-api.ts'
import Compartment from '../io/compartment.ts'
import IO from '@io/io.ts'
import Fs from '../fs.ts'

const log = debug('AI:artifact')
const repo = {
  type: 'object',
  required: ['repo'],
  properties: {
    repo: {
      type: 'string',
      pattern: '^[a-zA-Z0-9][a-zA-Z0-9-_]*\/[a-zA-Z0-9][a-zA-Z0-9-_]*$',
    },
  },
}

export const api = {
  ping: {
    type: 'object',
    description: 'Check queue processing system is alive',
    properties: {},
  },
  clone: repo,
  pull: repo,
  push: repo,
  init: repo,
  isolateApi: {
    type: 'object',
    required: ['isolate'],
    properties: {
      isolate: {
        type: 'string',
      },
    },
  },
  dispatch: {
    type: 'object',
    required: ['isolate'],
    properties: {
      isolate: {
        type: 'string',
      },
      pid: {
        type: 'object',
        required: ['account', 'repository', 'branches'],
        additionalProperties: false,
        properties: {
          account: {
            type: 'string',
          },
          repository: {
            type: 'string',
          },
          branches: {
            type: 'array',
            items: {
              type: 'string',
            },
            minItems: 1,
          },
        },
      },
    },
  },
  // then need things like subscribing to fs updates in a pid, reading files,
  // but it should all be handled by subscribing to splices / patches ?
  // also subscribe to binary / read binary
  // in this case, the result back would be a stream or patches.  The sender
  // would need to decorate it to expect a stream, and the function should be
  // broadcasting out the patches.

  // requesting a patch would be done with the last patch you got, so we could
  // resume when the isolates were cancelled.

  // if we give it a user based context slot, then a long running item can store
  // something in there, like the db instance.  So that each time the isolate
  // starts, it gets its init function called, and it returns out the context it
  // wants to store.

  // do we even need a separate queue ?

  // If we load up, then call the init function, then it sets up its own self as
  // the listener to the queue, and begins processing from there

  // this isolate is the run that runs at the root of your chain, that pulls in
  // other chains so you can do different things.
}

type C = {
  db: DB
  io: IO
  fs: Fs
}
const directFunctions: IsolateFunctions = {
  ping: (params: Params) => {
    log('ping')
    return params
  },
  reping: (params, api) => {
    log('reping')
    return enqueue('ping', params, api)
  },
  async clone(params, api: IsolateApi<C>) {
    const start = Date.now()
    const repo = params.repo as string
    const [account, repository] = repo.split('/')
    const pid: PID = {
      account,
      repository,
      branches: [ENTRY_BRANCH],
    }
    // TODO acquire lock on the repo in the kv store
    // TODO handle existing repo

    // TODO use the fs option in the context

    const { fs } = memfs()
    const dir = '/'
    const url = `https://github.com/${account}/${repository}.git`
    log('start %s', url)
    await git.clone({ fs, http, dir, url, noCheckout: true })
    log('cloned')
    const { prettySize: size } = await api.context.fs!.updateIsolateFs(pid, fs)
    log('snapshot', size)
    return { size, elapsed: Date.now() - start }
  },
  pull(params, api: IsolateApi<C>) {
    throw new Error('not implemented')
  },
  push(params, api: IsolateApi<C>) {
    throw new Error('not implemented')
  },
  init(params, api: IsolateApi<C>) {
    throw new Error('not implemented')
  },
  isolateApi: (params: Params) => {
    const isolate = params.isolate as string
    const compartment = Compartment.create(isolate)
    return compartment.api
  },
  dispatch: (params, api: IsolateApi<C>) => {
    return api.context.io!.dispatch(params as Dispatch)
  },
}

export const functions: IsolateFunctions = queueWrap(directFunctions)

export const lifecycles: IsolateLifecycle = {
  async '@@mount'(api: IsolateApi<C>) {
    const db = await DB.create()
    db.listenQueue(({ nonce, name, parameters }: QMessage) => {
      log('listenQueue', name, nonce)
      return directFunctions[name](parameters, api)
    })
    const io = IO.create(db)
    const fs = Fs.create(db)
    api.context = { db, io, fs }
    return Promise.resolve('')
  },
  '@@unmount'(api: IsolateApi<C>) {
    return api.context.db!.stop()
  },
}

async function enqueue(name: string, params: Params, api: IsolateApi<C>) {
  const msg: QMessage = { nonce: ulid(), name, parameters: params }
  return await api.context.db!.enqueueMsg(msg)
}

function queueWrap(functions: IsolateFunctions): IsolateFunctions {
  const wrapped: IsolateFunctions = {}
  for (const name in functions) {
    wrapped[name] = (params, api) => {
      return enqueue(name, params, api)
    }
  }
  return wrapped
}
