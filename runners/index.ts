import { default as runnerChat } from './runner-chat.ts'
import { default as runnerInjector } from './runner-injector.ts'
import { RUNNERS } from '@/constants.ts'
export default {
  [RUNNERS.CHAT]: runnerChat,
  [RUNNERS.INJECTOR]: runnerInjector,
}
