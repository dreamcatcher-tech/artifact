import { Engine } from '@/engine.ts'
import { Machine } from '@/api/web-client-machine.ts'
import * as HAL from '@/isolates/hal.ts'
import * as Github from '@/isolates/github.ts'
import * as Actors from '../isolates/actors.ts'
import { expect, log } from '@utils'
import { Tokens } from '@deno/kv-oauth'
import { getActorId, print } from '@/constants.ts'

Deno.test.only('login loop', async (t) => {
  const engine = await Engine.start()

  // TODO set up concept of a superuser
  await engine.provision()

  const homeAddress = engine.homeAddress
  const repo = 'dreamcatcher-tech/HAL'
  const { pid: halAddress } = await engine.clone(repo, 'hal', { homeAddress })
  log.enable('AI:engine AI:actors AI:hal AI:tests AI:completions AI:github')

  const machine = Machine.load(engine)
  const session = machine.openSession()

  const halBase = await session.actions<HAL.HalBase>('hal', halAddress)
  const actorAddress = await halBase.createActor()
  log('actorAddress', print(actorAddress))

  const halActor = await session.actions<HAL.HalActor>('hal', actorAddress)

  const sessionAddress = await halActor.startSession()
  const hal = await session.actions<HAL.HalSession>('hal', sessionAddress)

  await hal.prompt({ text: 'hello' })

  await t.step('second session', async () => {
    const second = machine.openSession()
    log('second session', print(second.pid))
    const halActor = await second.actions<HAL.HalActor>('hal', actorAddress)
    const sessionAddress = await halActor.startSession()
    const hal = await second.actions<HAL.HalSession>('hal', sessionAddress)
    await hal.prompt({ text: 'hello' })
  })

  await t.step('restart a session', async () => {
    log('resuming session', print(session.pid))
    const resumed = machine.openSession(session.pid)
    const hal = await resumed.actions<HAL.HalSession>('hal', sessionAddress)
    await hal.prompt({ text: 'hello' })
  })

  await t.step('invalid session', () => {
    const branches = session.pid.branches.slice(0, -1)
    branches.push('invalid ulid')
    const pid = { ...session.pid, branches }
    expect(() => machine.openSession(pid)).toThrow('invalid session')
  })
  // TODO test valid format but deleted / nonexistent session
  // TODO test invalid machine

  engine.stop()
})

Deno.test('login with github', async (t) => {
  const engine = await Engine.start()
  await engine.provision()
  const authProvider = engine.githubAddress
  const machine = Machine.load(engine)
  const session = machine.openSession()
  const github = await session.actions<Github.Api>('github', authProvider)

  // ? make a mock so we can control the auth flow ?

  const githubUserId = 'github-user-id'

  await t.step('login with github', async () => {
    log.enable('AI:engine AI:actors AI:hal AI:tests AI:completions AI:github')
    const { pid } = session
    const actorId = getActorId(pid)
    const authSessionId = 'mock-session-id'

    await github.registerAttempt({ actorId, authSessionId })
    const tokens: Tokens = { accessToken: 'mock-token-1', tokenType: 'bearer' }
    await github.authorize({ authSessionId, tokens, githubUserId })

    const home = engine.homeAddress
    const actor = await session.actions<Actors.ActorApi>('actors', home)
    // this should be internal to the session, and it should shift all
    // registered sessions to the new actor
    const newActorId = await actor.surrender({ authProvider })
    expect(newActorId).toEqual(actorId)
  })
  // await t.step('second machine login', async () => {
  //   const secondMachine = Machine.load(engine)
  //   const second = secondMachine.openSession()

  //   const { pid } = second
  //   expect(pid).not.toEqual(session.pid)
  //   const actorId = pid.branches.slice(-3)[0]
  //   const authSessionId = 'mock-session-id-2'
  //   await github.registerAttempt({ actorId, authSessionId })
  //   const tokens: Tokens = { accessToken: 'mock-token-2', tokenType: 'bearer' }
  //   await github.authorize({ authSessionId, tokens, githubUserId })

  //   const actor = await second.actions<Actors.ActorApi>('home', pid)
  //   // these should be managed inside the session since it changes the machine
  //   await actor.surrender({ authProvider })

  //   // assert that the PID for the session has changed
  // })
  // await t.step('repeat login still succeeds', async () => {
  //   const { pid } = session
  //   const actorId = pid.branches.slice(-3)[0]
  //   const authSessionId = 'mock-session-id'
  //   await github.registerAttempt({ actorId, authSessionId })
  //   const tokens: Tokens = { accessToken: 'mock-token-3', tokenType: 'bearer' }
  //   await github.authorize({ authSessionId, tokens, githubUserId })

  //   const actor = await session.actions<Actors.ActorApi>('home', pid)
  //   await actor.surrender({ authProvider })
  //   // verify that the PID for the session has not changed
  //   // verify that the latest PAT is the one that is stored
  // })
  // // test trying to login with github when already authed
  // await t.step('second machine revoked', async () => {
  //   // using the first session, deauth the second, then attempt to make another
  //   // request with the second session, watch it get denied.
  //   // it should then become an unauthorized machine and reauthenticate as its
  //   // original pure machine name
  // })
  await engine.stop()
})
// do a push to a github repo using the authed token

// shared sessions, where a multi app allows other to connect to a session
// possibly with read only mode

// test login with github and continue existing sessions

// test login to github where already have existing account