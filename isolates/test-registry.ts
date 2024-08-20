import {
  addBranches,
  Functions,
  getActorPid,
  getBaseName,
  IA,
  print,
  toJsonSchema,
} from '@/constants.ts'
import { Debug } from '@utils'
import * as session from '@/isolates/session.ts'
import { z } from 'zod'

const log = Debug('AI:test-registry')

// TODO move to zodObject for all objects
export const schema = {
  '@@install': z.object({}).describe('Ensures the basic branch structure'),
  createController: z.object({})
    .describe(
      'Creates a controller in a branch and returns the controllerId',
    ),
  deleteController: z.object({
    controllerId: z.string().describe('The controllerId to delete'),
  }).describe('Deletes the controller and its containing branch'),
}

export type Api = {
  '@@install': (params: void) => void
  createController: (params: void) => Promise<string>
  deleteController: (params: { controllerId: string }) => Promise<void>
}

export const api = toJsonSchema(schema)

export const functions: Functions<Api> = {
  '@@install': (_, api) => {
    log('installing', print(api.pid))
  },
  createController: async (_, api) => {
    console.log('creating controller')
    const target = await ensureRegistry(api)
    const { noop } = await api.actions<session.Api>('session', {
      target,
      noClose: true,
      prefix: 'ctrl',
    })
    const pid = await noop()
    log('created controller', print(pid))

    return getBaseName(pid)
  },
  deleteController: async ({ controllerId }, api) => {
    console.log('deleting controller', controllerId)
  },
}

const ensureRegistry = async (api: IA) => {
  const actor = getActorPid(api.pid)
  const registry = addBranches(actor, 'tests')
  if (!await api.isPidExists(registry)) {
    const actions = await api.actions<Api>('test-registry', {
      target: actor,
      branchName: 'tests',
      noClose: true,
    })
    await actions['@@install']()
  }
  return registry
}
