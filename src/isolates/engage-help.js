import * as hooks from '../artifact/io-hooks.js'
import assert from 'assert-fast'
import Debug from 'debug'
const debug = Debug('AI:engage-help')
const engage = {
  description: 'engage the help',
  type: 'object',
  additionalProperties: false,
  required: ['help', 'text'],
  properties: {
    help: {
      description: 'the name of the help',
      type: 'string',
    },
    text: {
      description: 'the text to pass to the help runner',
      type: 'string',
    },
  },
}
export const api = {
  engage,
  engageInBand: engage,
}

export const functions = {
  engageInBand: async ({ help: path, text }) => {
    debug('engage:', path)
    // use the files isolate to load up all the runners
    const { load } = await hooks.actions('load-help')
    const help = await load({ help: path })

    assert(typeof help.runner === 'string', `no runner: ${help.runner}`)
    debug('found runner:', help.runner)

    const { default: runner } = await import(`../runners/${help.runner}.js`)

    return await runner({ help, text })
  },
  engage: async ({ help, text }) => {
    debug('engage:', help)
    // TODO should be able to get my own isolate name inside the isolate
    const { engageInBand } = await hooks.spawns('engage-help')
    return await engageInBand({ help, text })
  },
  continue: async ({ help: path, text, commit }) => {
    debug('continue:', path, commit)
    // this would continue the help, but in the same branch as a previous run
  },
}

// because engage help is inside of a runner, it can have any format we like
