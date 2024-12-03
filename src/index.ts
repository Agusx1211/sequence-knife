#!/usr/bin/env bun
import yargs from 'yargs'
import { hideBin } from 'yargs/helpers'
import { trackers } from '@0xsequence/sessions'
import type { Argv } from 'yargs'
import type { CommonOptions, Services } from './types'
import { basename } from 'path'

const DEFAULT_SESSIONS_URL = "https://sessions.sequence.app/"

const addCommonOptions = (yargs: Argv) => {
  return yargs.option('sessions', {
    describe: 'Sessions API URL',
    type: 'string',
    default: DEFAULT_SESSIONS_URL
  })
}

const parseServices = (options: CommonOptions): Services => {
  return {
    tracker: new trackers.remote.RemoteConfigTracker(options.sessions)
  }
}

// Get the program name - will be 'sequence-knife' when installed globally
const programName = basename(process.argv[1]) === 'index.ts' ? 'sequence-knife' : basename(process.argv[1])

const cli = yargs(hideBin(process.argv))
  .scriptName(programName)

// Import and register commands
const commands = [
  require('./commands/initialImageHash'),
  require('./commands/deployCalldata'),
  require('./commands/decode'),
  require('./commands/subdigestFinder'),
  require('./commands/subdigest'),
  require('./commands/config')
]

for (const cmd of commands) {
  cli.command({
    command: cmd.command,
    describe: cmd.describe,
    builder: (yargs) => addCommonOptions(cmd.builder(yargs)),
    handler: (argv) => cmd.handler(argv, parseServices(argv))
  })
}

cli
  .demandCommand(1, 'You need to specify a command')
  .strict()
  .help()
  .argv
