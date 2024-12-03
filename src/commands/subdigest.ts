import type { Argv } from 'yargs'
import type { CommonOptions, Services } from '../types'
import { ethers } from 'ethers'

export const command = 'subdigest'
export const describe = 'Calculate a subdigest for given chainId, address and digest'

export const builder = (yargs: Argv) => {
  return yargs
    .option('chainId', {
      describe: 'Chain ID',
      type: 'number',
      demandOption: true
    })
    .option('address', {
      describe: 'Address',
      type: 'string',
      demandOption: true
    })
    .option('digest', {
      describe: 'Digest (32 bytes)',
      type: 'string',
      demandOption: true
    })
}

function subdigestOf(chainId: number, address: string, digest: Uint8Array) {
  return ethers.solidityPackedKeccak256(
    ['bytes', 'uint256', 'address', 'bytes32'],
    ['0x1901', chainId, address, digest]
  )
}

export const handler = async (
  argv: CommonOptions & {
    chainId: number
    address: string
    digest: string
  }
) => {
  const digest = ethers.getBytes(argv.digest)
  const subdigest = subdigestOf(argv.chainId, argv.address, digest)
  console.log(subdigest)
} 