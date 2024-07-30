import { Functions, print } from '@/constants.ts'
import { Debug } from '@utils'
const log = Debug('AI:agents')

export const api = {
  search: {
    type: 'object',
    description: 'Search for agents that can complete the job',
    properties: {
      query: {
        type: 'string',
        description:
          'The highly descriptive natrual language search query saying what the agent you want should be capable of doing.  Will return a ranked array of results, where each result will have a path to the agent file, the name of the agent, and a reason why it was selected, and optionally an avatar representing the agent.',
      },
    },
    additionalProperties: false,
  },
  switch: {
    type: 'object',
    description: 'Switch to a new agent',
    required: ['path'],
    properties: {
      path: {
        type: 'string',
        description: 'The path to the agent file to switch to',
      },
    },
    additionalProperties: false,
  },
}
interface SearchResult {
  path: string
  name: string
  reason: string
  imageUrl?: string
}
export type Api = {
  search: (params: { query: string }) => Promise<SearchResult[]>
  switch: (params: { path: string }) => Promise<void>
}

export const functions: Functions<Api> = {
  search: async ({ query }, api) => {
    // TODO make this the same as the files search function

    // read all the agent files in from disk
    // make an AI call to select the best ones and rank them
    // also to provide a reason why they were selected
    // if nothing found or an error, return null

    // this can be an AI call where we force the AI to call the function with
    // something
    // this is just using AI to help do coding tasks, as opposed to agents
    // so agents are defined by their interaction aspect
    // interaction implies state
    log('search', query, print(api.pid))
    const cheapResults = await api.ls('agents')
    return cheapResults.map((path) => ({
      path: `agents/${path}`,
      name: path,
      reason: 'no reason available',
    }))
  },
  switch: async ({ path }, api) => {
    log('switch', path, print(api.pid))

    // then this gets called, we need to break out of the tool execution, since
    // we are now going to halt the current execution
    // could submit tool results, but carry on the execution with the new agent
    // this would let us show the switch in the ui.

    // all we want is to not pollute the thread by executing in thread.
  },
}
