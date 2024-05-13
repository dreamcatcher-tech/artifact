import { posix } from '@utils'
import { IsolateApi, RUNNERS } from '@/constants.ts'
import { Help } from '@/constants.ts'

export const api = {
  load: {
    description:
      'load the help by name.  Will convert the help to a path using `/helps/${name}.json`, and then will return the json object from loading and parsing this file',
    type: 'object',
    additionalProperties: false,
    required: ['help'],
    properties: {
      help: {
        description: 'the name of the help',
        type: 'string',
      },
    },
  },
  loadAll: {
    description: 'load all the helps',
    type: 'object',
    additionalProperties: false,
    properties: {},
  },
}
export interface Api {
  load: (params: { help: string }) => Promise<Help>
  loadAll: () => Promise<Help[]>
}

export const functions = {
  load: async ({ help }: { help: string }, api: IsolateApi) => {
    const loaded = await api.readJSON<Help>(`helps/${help}.json`)
    checkHelp(loaded)
    return loaded
  },
  loadAll: async (_: object, api: IsolateApi) => {
    // TODO provide a glob as first arg
    const helps: { name: string; help: Help }[] = []
    const files = await api.ls('helps')
    for (const file of files) {
      if (file.endsWith('.json')) {
        const name = posix.basename(file, posix.extname(file))
        const help = await functions.load({ help: name }, api)
        helps.push({ name, help })
      }
    }
    return helps
  },
}

const checkHelp = (help: Help) => {
  if (!Array.isArray(help.instructions)) {
    throw new Error('instructions must be an array')
  }
  const { runner } = help
  if (runner !== RUNNERS.CHAT && runner !== RUNNERS.INJECTOR) {
    throw new Error('runner must be chat or injector')
  }
  if (help.description && typeof help.description !== 'string') {
    throw new Error('description must be a string')
  }
  if (help.config) {
    const { config } = help
    if (
      config.model && config.model !== 'gpt-3.5-turbo' &&
      config.model !== 'gpt-4-turbo' && config.model !== 'gpt-4o'
    ) {
      throw new Error('model must be gpt-3.5-turbo or gpt-4-turbo or gpt-4o')
    }
    if (
      help.config.temperature &&
      (help.config.temperature < 0 || help.config.temperature > 1)
    ) {
      throw new Error('temperature must be between 0 and 1')
    }
  }
  if (help.commands && !Array.isArray(help.commands)) {
    throw new Error('commands must be an array')
  }
}
