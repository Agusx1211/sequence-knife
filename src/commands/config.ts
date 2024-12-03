import type { Argv } from 'yargs'
import type { CommonOptions, Services } from '../types'
import { ethers } from 'ethers'

export const command = 'config <imageHash>'
export const describe = 'Get configuration for a given imageHash'

export const builder = (yargs: Argv) => {
  return yargs
    .positional('imageHash', {
      describe: 'Image hash to get configuration for',
      type: 'string',
      demandOption: true
    })
}

export const handler = async (
  argv: CommonOptions & {
    imageHash: string
  },
  services: Services
) => {
  // Validate imageHash is 32 bytes
  const imageHashBytes = ethers.getBytes(argv.imageHash)
  if (imageHashBytes.length !== 32) {
    throw new Error('imageHash must be 32 bytes')
  }

  const config = await services.tracker.configOfImageHash({ imageHash: argv.imageHash })
  console.log(JSON.stringify(config, null, 2))
} 
