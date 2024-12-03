import type { Argv } from 'yargs'
import { ethers } from 'ethers'
import { walletContracts } from '@0xsequence/abi'
import type { CommonOptions, Services } from '../types'

export const command = 'deployCalldata <walletAddress>'
export const describe = 'Code to deploy a wallet'

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
  const factoryInterface = new ethers.Interface(walletContracts.factory.abi)
  const deployCalldata = factoryInterface.encodeFunctionData('deploy', [initial?.context.mainModule, initial?.imageHash])
  console.log(initial?.context.factory + " " + deployCalldata)
}
