// in this branch is where the tps reports are stored
// at the start all tps reports would be blanked ?
import { z } from 'zod'
import {
  addBranches,
  Functions,
  getActorPid,
  print,
  SchemaType,
  toJsonSchema,
} from '@/constants.ts'
import * as longthread from '@/isolates/longthread.ts'
import * as session from '@/isolates/session.ts'
import { Debug, equal } from '@utils'
import { assert } from '@std/assert'

const log = Debug('AI:test-controller')

export type Api = {
  /**  A list of file patterns and cases patterns to filter which cases to
   * run. Optionally delete all previous test results
   */
  start: (
    params: {
      controllerId: string
      files?: string[]
      cases?: string[]
      reset?: boolean
    },
  ) => Promise<void>
  /** Cancel the current run immediately */
  stop: (params: { controllerId: string }) => void
}

// so it acts as zod thing, but converts to  a json schema
// then the functions api is just functions keyed by the api schema
export const schema: SchemaType = {
  start: z.object({
    controllerId: z.string().describe('The controllerId to run the tests with'),
    files: z.array(z.string()).optional(),
    cases: z.array(z.string()).optional(),
    reset: z.boolean().optional(),
  }).describe(
    'A list of file patterns and cases patterns to filter which cases to run. Optionally delete all previous test results',
  ),
  stop: z.object({ controllerId: z.string() }).describe(
    'Cancel the current run immediately',
  ),
}

export const functions: Functions<Api> = {
  start: async ({ controllerId, files = [], cases, reset }, api) => {
    log('start', controllerId, files, cases, reset, print(api.pid))
    const actor = getActorPid(api.pid)
    const target = addBranches(actor, 'tests', controllerId)
    log('controller', print(target))

    if (!equal(target, api.pid)) {
      log('transmitting to target')
      const { start } = await api.actions<Api>('test-controller', { target })

      return start({ controllerId, files, cases, reset })
    }

    log('running locally')
    assert(api.originCommit, 'no commit')
    await api.merge(api.originCommit)

    log('ls', await api.ls('agents/'))

    // this is the generic function of calling a function on a range of files
    // resolve all the file names

    const promises = files.map(async (file) => {
      log('file', file)
      // TODO handle maliciously named branches
      const sopts = { branchName: file, noClose: true }
      const { noop } = await api.actions<session.Api>('session', sopts)

      const lopts = { target: await noop() }
      const actions = await api.actions<longthread.Api>('longthread', lopts)
      await actions.start()
      const actorId = 'test-runner'
      const path = 'agents/test-file-runner.md'
      const content = `${file}`
      await actions.run({ path, content, actorId })
      log('done', file)
    })
    await Promise.all(promises)
    log('done', files)
  },
  stop: async ({ controllerId }, api) => {
    log('stop', controllerId, print(api.pid))
  },
}

export const api = toJsonSchema(schema)
