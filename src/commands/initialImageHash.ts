import type { Argv } from 'yargs'
import type { CommonOptions, Services } from '../types'

export const command = 'initialImageHash <walletAddress>'
export const describe = 'Obtain the initial image hash of a wallet'

export const builder = (yargs: Argv) => {
  return yargs.positional('walletAddress', {
    describe: 'The wallet address',
    type: 'string',
    demandOption: true,
  })
}

export const handler = async (argv: CommonOptions & { walletAddress: string }, services: Services) => {
  const { tracker } = services
  const initial = await tracker.imageHashOfCounterfactualWallet({ wallet: argv.walletAddress })
  console.log(initial?.imageHash)
} 