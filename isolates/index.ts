import * as system from './system.ts'

import * as fetch from './fetch.ts'
import * as files from './files.ts'
import * as ioFixture from './io-fixture.ts'
import * as utils from './utils.ts'
import * as artifact from './artifact.ts'
import * as session from './session.ts'

import * as actors from './actors.ts'
import * as actor from './actor.ts'
import * as machines from './machines.ts'
import * as backchat from './backchat.ts'
import * as isolates from './isolates.ts'
import * as branches from './branches.ts'
import * as agents from './agents.ts'
import * as youtube from './youtube.ts'
import * as github from './github.ts'
import * as threads from './threads.ts'

import * as completions from './ai-completions.ts'
import * as loadTools from './utils/ai-load-tools.ts'

import * as longthread from './longthread.ts'
import * as stateboard from './stateboard.ts'

import * as testCaseRunner from './test-case-runner.ts'
import * as testController from './test-controller.ts'
import * as testRegistry from './test-registry.ts'
import * as tpsReport from './tps-report.ts'

import * as napps from './napps.ts'

const isolatesExport = {
  system,

  fetch,
  files,
  'io-fixture': ioFixture,
  utils,
  artifact,
  session,

  github,
  actors,
  actor,
  machines,
  backchat,
  isolates,
  branches,
  agents,
  threads,
  youtube,

  'ai-completions': completions,
  'ai-load-tools': loadTools,

  longthread,
  stateboard,

  'test-case-runner': testCaseRunner,
  'test-controller': testController,
  'test-registry': testRegistry,
  'tps-report': tpsReport,

  napps,
}

export default isolatesExport

export type Isolate = keyof typeof isolatesExport
export const isIsolate = (isolate: string): isolate is Isolate => {
  return isolate in isolatesExport
}
