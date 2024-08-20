import { cradleMaker } from '@/cradle-maker.ts'

export const actorId = 'testerActorId'

export const infoPath = 'info/test-format.md'
export const requesterPath = 'agents/test-requester.md'
export const assessorPath = 'agents/test-assessor.md'
export const fileRunnerPath = 'agents/test-file-runner.md'
export const firstTestPath = 'tests/fixtures/test-file-runner.test.md'
export const secondTestPath = 'tests/fixtures/second.test.md'

export const info = await Deno.readTextFile('./HAL/' + infoPath)
export const requester = await Deno.readTextFile('./HAL/' + requesterPath)
export const assessor = await Deno.readTextFile('./HAL/' + assessorPath)
export const fileRunner = await Deno.readTextFile('./HAL/' + fileRunnerPath)

export const firstTest = await Deno.readTextFile(firstTestPath)
export const secondTest = await Deno.readTextFile(secondTestPath)

export const fixture = async () => {
  const { backchat, engine } = await cradleMaker()

  await backchat.write(infoPath, info)
  await backchat.write(requesterPath, requester)
  await backchat.write(assessorPath, assessor)
  await backchat.write(fileRunnerPath, fileRunner)

  await backchat.write(firstTestPath, firstTest)
  await backchat.write(secondTestPath, secondTest)

  return { backchat, engine }
}
