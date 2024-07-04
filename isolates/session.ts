import {
  IsolateApi,
  IsolateReturn,
  PID,
  print,
  ProcessOptions,
  UnsequencedRequest,
} from '@/constants.ts'
import { assert, Debug } from '@utils'
const log = Debug('AI:session')

export const api = {
  create: {
    description: 'Creat a new session branch',
    type: 'object',
    additionalProperties: false,
    properties: {
      retry: {
        type: 'object',
        description:
          'If we have a stored session id, attempt to validate it and resume the existing session, else create a new one',
        // TODO use the PID json schema here
      },
      name: {
        type: 'string',
        description: 'The name of the session to create',
      },
      prefix: {
        type: 'string',
        description: 'The prefix to use for the session branch',
      },
    },
  },
  noop: {
    description: 'a noop that is used to start a long running branch',
    type: 'object',
    additionalProperties: false,
    properties: {},
  },
  close: {
    description: 'End a session branch',
    type: 'object',
    additionalProperties: false,
    properties: {},
  },
}

export type Api = {
  create: (
    params?: { retry?: PID; name?: string; prefix?: string },
  ) => Promise<PID>
  close: () => void
  noop: () => Promise<PID>
  rexec: (
    params: { requests: UnsequencedRequest[]; opts: ProcessOptions },
  ) => Promise<IsolateReturn>[]
}

export const functions = {
  async create(
    { retry, name, prefix }: { retry?: PID; name?: string; prefix?: string } =
      {},
    api: IsolateApi,
  ) {
    assert(isMaxOneOf(retry, name, prefix), 'max one arg is possible')
    log('create %o', { retry, name, prefix })
    if (retry) {
      if (await api.isChild(retry)) {
        // TODO check signing keys for validity too
        return retry
      }
    }

    const options: ProcessOptions = { noClose: true }
    if (prefix) {
      options.prefix = prefix
    }
    if (name) {
      options.branchName = name
    }
    if (!retry && !prefix && !name) {
      options.prefix = 'session'
    }
    const { noop } = await api.actions<Api>('session', options)
    const pid = await noop()
    assert(pid, 'no pid returned')
    log('noop pid returned', print(pid))
    return pid
  },
  noop(_: object, api: IsolateApi) {
    log('noop', print(api.pid))
    return api.pid
  },
  close: (_: object, api: IsolateApi) => {
    log(api)
    // message the parent and tell it to close this child
  },
  rexec: (
    { requests, opts }: {
      requests: UnsequencedRequest[]
      opts?: ProcessOptions
    },
    api: IsolateApi,
  ) => {
    // if we wrap this in the api, then all the remote options can be provided
    // in this same interface, since it can do any kind of process option

    return Promise.all(requests.map((request) => api.action(request)))
  },
}

const isMaxOneOf = (...args: unknown[]) => {
  let count = 0
  for (const arg of args) {
    if (arg !== undefined) {
      count++
    }
  }
  return count <= 1
}
