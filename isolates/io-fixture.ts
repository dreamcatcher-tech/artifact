import { Debug, delay } from '@utils'
import { IsolateApi } from '@/constants.ts'
import { PID } from '@/constants.ts'
const log = Debug('AI:io-fixture')

export const api = {
  write: {
    description: 'write a file',
    type: 'object',
    required: ['path', 'content'],
    additionalProperties: false,
    properties: { path: { type: 'string' }, content: { type: 'string' } },
  },
  writeSlow: {
    description: 'write a file one character at a time',
    type: 'object',
    required: ['path', 'content'],
    additionalProperties: false,
    properties: {
      path: { type: 'string' },
      content: { type: 'string' },
      delay: { type: 'integer', minimum: 0 },
    },
  },
  error: {
    description: 'throw an error',
    type: 'object',
    additionalProperties: false,
    properties: {
      message: { type: 'string' },
    },
  },
  branch: {
    description: 'make a new branch',
    type: 'object',
    additionalProperties: false,
    properties: {},
  },
  compound: {
    description: 'call another function',
    type: 'object',
    additionalProperties: false,
    properties: { target: { type: 'object' } },
  },
  pong: {
    description: 'ping the AI',
    type: 'object',
    properties: {},
  },
  local: {
    description: 'ping locally',
    type: 'object',
    properties: {},
    additionalProperties: false,
  },
}
export const functions = {
  write: (params: { path: string; content: string }, api: IsolateApi) => {
    log('write', params)
    api.write(params.path, params.content)
  },
  async writeSlow(
    params: { path: string; content: string; delay: number },
    api: IsolateApi,
  ) {
    log('writeSlow', params)
    let string = ''
    for (const char of params.content) {
      string += char
      api.write(params.path, string)
      await delay(10)
    }
    // TODO extend to test with large strings so we can check performance impact
  },
  error: ({ message }: { message: string }) => {
    log('error', message)
    throw new Error(message)
  },
  branch: async (_: object, api: IsolateApi) => {
    log('branch')
    const { pong } = await api.actions('io-fixture')
    const result = await pong({}, { branch: true })
    return result
  },
  compound: async (params: { target?: PID }, api: IsolateApi) => {
    const { target } = params
    log('compound target:', target)
    const { pong } = await api.actions('io-fixture', target)
    const result = await pong({})
    return result
  },
  pong: () => {
    log('pong')
    return 'remote pong'
  },
  local: () => {
    log('local')
    return 'local reply'
  },
}
