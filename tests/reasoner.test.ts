import { expect, log } from '@utils'
import { type Api } from '@/isolates/longthread.ts'
import {
  actorId,
  fileRunnerPath,
  fixture,
  reasonerTestPath,
} from './fixtures/fixture.ts'
import { TestFile } from '@/api/tps-report.ts'
import { addBranches } from '@/constants.ts'

Deno.test('reasoner', async (t) => {
  log('reasoner')
  const { backchat, engine } = await fixture()
  // log.enable(
  //   'AI:tests AI:execute-tools AI:agents AI:qbr* AI:test-registry AI:test-controller AI:utils AI:test-case-runner AI:completions AI:napps',
  // )

  const opts = { branchName: 'runner', noClose: true }
  const { start } = await backchat.actions<Api>('longthread', opts)
  await start({})
  const target = addBranches(backchat.pid, opts.branchName)
  const { run } = await backchat.actions<Api>('longthread', { target })

  await t.step('run', async () => {
    const path = fileRunnerPath
    const content = 'run ' + reasonerTestPath
    await run({ path, content, actorId })

    const tpsPath = reasonerTestPath.replace('.test.md', '.tps.json')
    const tps = await backchat.readJSON<TestFile>(tpsPath, target)

    console.dir(tps, { depth: Infinity })

    expect(tps).toBeTruthy()
    expect(tps.summary.completed).toBe(1)
  })
  await engine.stop()
})
