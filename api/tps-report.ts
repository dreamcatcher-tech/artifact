import { z } from 'zod'

const md5 = z.string().regex(/^[a-f0-9]{40}$/, 'Invalid MD5 hash')

export const outcome = z
  .object({
    reasoning: z.array(z.string()).describe(
      'the chain of thought reasoning for how the outcome was reached',
    ),
    outcome: z.boolean().describe(
      'the outcome of the test compared with the expectation',
    ),
    analysis: z.array(z.string()).optional().describe(
      'the step by step analysis of WHY the system prompt of the agent under test did meet the expectation as well as it could have',
    ),
    improvements: z.array(z.string()).optional().describe(
      'the improvement(s) to the agent prompt that would have resulted in better performance against the expectation',
    ),
  })
  .describe(
    'After a single test iteration is assessed, along with chain of thought reasoning for how the outcome was reached',
  )

export type TestIteration = z.infer<typeof testIteration>
export const testIteration = z
  .object({
    commit: md5.describe('the commit this iteration completed on'),
    prompts: z.array(z.string()).describe('the prompt(s) that were used'),
    outcomes: z.array(outcome).describe('the outcomes of this iteration'),
  })
const summary = z
  .object({
    timestamp: z
      .number()
      .int()
      .gt(1723003530757)
      .default(Date.now)
      .describe('the start time'),
    elapsed: z
      .number()
      .int()
      .gte(0)
      .describe('the time the operation has been running for in ms'),
    iterations: z
      .number()
      .int()
      .gte(0)
      .describe('the number of planned iterations to run'),
    completed: z
      .number()
      .int()
      .gte(0)
      .default(0)
      .describe(
        'the lowest number of iterations of a test that have completed.  Tests complete asynchronously, so one test might complete all its planned iterations before another test.  The overall progress is based on the lowest number of completed iterations',
      ),
  })
  .describe(
    'A summary of the test results combining all individual results into a ratio',
  )

type TestCase = z.infer<typeof testCase>
const testCase = z
  .object({
    summary: summary
      .extend({
        prompts: z.array(z.array(z.string()))
          .describe('the array of prompt arrays used for each iteration'),
        expectations: z
          .array(z.string())
          .describe('the expectations for this test case'),
        successes: z
          .array(z.number().int().gte(0))
          .describe(
            'for each expectation, the sum of the successful outcomes so far.  When divided by the number of completed iterations, the ratio of successful outcomes is calculated',
          ),
        name: z.string().describe('the name of the test case'),
      })
      .strict()
      .describe(
        'A summary of the test results combining all individual results into a ratio',
      )
      .refine((v) => v.completed <= v.iterations, {
        message: 'completed cannot be greater than iterations',
      })
      .refine((v) => v.successes.length === v.expectations.length, {
        message: 'successes length must equal expectations length',
      })
      .refine((v) => v.successes.every((success) => success <= v.completed), {
        message: 'successes cannot be greater than completed',
      }),
    iterations: z.array(testIteration)
      .describe('the outcome and info about each test run that has executed'),
  })
  .strict()
  .describe('summary and runs output of a single test')
  .refine(
    (v) =>
      v.iterations.every((run) =>
        run.outcomes.length === v.summary.expectations.length
      ),
    { message: 'outcomes count must match expectations count' },
  )
  .refine((v) => v.iterations.length <= v.summary.iterations, {
    message: 'runs cannot be greater than iterations',
  })
  .refine((v) => v.iterations.length === v.summary.completed, {
    message: 'runs must equal completed',
  })
  .refine((v) => {
    const tally = v.summary.successes.map(() => 0)
    for (const run of v.iterations) {
      run.outcomes.forEach(({ outcome }, index) => {
        if (outcome) {
          tally[index]++
        }
      })
    }
    return v.summary.successes.every((success, index) =>
      success === tally[index]
    )
  }, { message: 'runs outcomes must sum to successes' })

export type TestFile = z.infer<typeof testFile>
export const testFile = z
  .object({
    summary: summary.extend({
      hash: md5
        .describe('the hash of the test file used to generate the test run'),
      path: z.string()
        .describe('the path to the test file'),
      agent: z.string()
        .describe('the path to the agent file under test'),
      assessor: z.string()
        .describe('path to the agent file that will assess the test results'),
    })
      .strict()
      .refine((value) => value.completed <= value.iterations, {
        message: 'completed cannot be greater than iterations',
      }),
    cases: z.array(testCase).describe('the results of each test case'),
  })
  .strict()

export type TestController = z.infer<typeof testController>
export const testController = z.object({
  globs: z.array(z.string()).default([])
    .describe('the globs to select the files to run'),
  files: z.array(z.object({
    path: z.string(),
    status: z.enum(['pending', 'running', 'complete', 'error']),
  })).describe(
    'the files to run after resolving the globs, in run order, along with their run status',
  ),
  concurrency: z.number().int().gt(0).default(1).describe(
    'the number of files to run concurrently',
  ),
}).strict()

export const create = (
  path: string,
  hash: string,
  agent: string,
  assessor: string,
  iterations: number,
) => {
  const blank: TestFile = {
    summary: {
      timestamp: Date.now(),
      path,
      hash,
      agent,
      assessor,
      elapsed: 0,
      iterations,
      completed: 0,
    },
    cases: [],
  }
  return testFile.parse(blank)
}

export const addTest = (
  base: TestFile,
  name: string,
  prompts: string[][],
  expectations: string[],
) => {
  const clean = testFile.parse(base)
  const test: TestCase = {
    summary: {
      name,
      timestamp: Date.now(),
      elapsed: 0,
      iterations: clean.summary.iterations,
      prompts,
      expectations,
      completed: 0,
      successes: Array(expectations.length).fill(0),
    },
    iterations: [],
  }
  clean.cases.push(test)
  return testFile.parse(clean)
}

export const addIteration = (
  base: TestFile,
  index: number,
  iteration: TestIteration,
) => {
  const copy = testFile.parse(base)
  const test = copy.cases[index]
  test.summary.completed++
  test.summary.elapsed = Date.now() - test.summary.timestamp
  iteration.outcomes.forEach(({ outcome }, index) => {
    if (outcome) {
      test.summary.successes[index]++
    }
  })
  test.iterations.push(iteration)
  let leastCompleted = Number.MAX_SAFE_INTEGER
  for (const _test of copy.cases) {
    if (_test.summary.completed < leastCompleted) {
      leastCompleted = _test.summary.completed
    }
  }
  copy.summary.completed = leastCompleted
  copy.summary.elapsed = Date.now() - copy.summary.timestamp
  return testFile.parse(copy)
}