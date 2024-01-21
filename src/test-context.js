import Artifact from './artifact/artifact'
import { test as vitest, expect as viexpect } from 'vitest'
import Debug from 'debug'
const _debug = Debug('test')
export const debug = (...args) => {
  return _debug(...args)
}
debug.enable = Debug.enable.bind(Debug)
export const expect = viexpect
export const test = vitest.extend({
  // eslint-disable-next-line no-empty-pattern
  artifact: async ({}, use) => {
    const artifact = await Artifact.boot()

    await use(artifact)

    await artifact.stop()
  },
})

export const goal = test.extend({
  result: async ({ artifact, task }, use) => {
    const text = task.name
    const { engage } = await artifact.actions('engage-help')
    const result = await engage({ help: 'goalie', text })
    await use(result)
  },
})
