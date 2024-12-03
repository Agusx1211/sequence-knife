import type { Argv } from 'yargs'
import type { CommonOptions, Services } from '../types'
import { ethers } from 'ethers'
import * as core from '@0xsequence/core'

export const command = 'subdigestFinder'
export const describe = 'Find combinations of parameters that match a known subdigest'

export const builder = (yargs: Argv) => {
  return yargs
    .option('chainIds', {
      describe: 'Comma-separated list of chain IDs to try',
      type: 'string',
      demandOption: true
    })
    .option('addresses', {
      describe: 'Comma-separated list of addresses to try',
      type: 'string',
      demandOption: true
    })
    .option('digests', {
      describe: 'Comma-separated list of digests to try',
      type: 'string',
      default: ''
    })
    .option('targetSubdigest', {
      describe: 'The known subdigest to match against',
      type: 'string',
      conflicts: ['signature', 'expectedSigner']
    })
    .option('signature', {
      describe: 'ECDSA signature to recover',
      type: 'string',
      implies: 'expectedSigner'
    })
    .option('expectedSigner', {
      describe: 'Expected signer address to match against signature recovery',
      type: 'string',
      implies: 'signature'
    })
}

function subdigestOf(chainId: number, address: string, digest: Uint8Array) {
  return ethers.solidityPackedKeccak256(
    ['bytes', 'uint256', 'address', 'bytes32'],
    ['0x1901', chainId, address, digest]
  )
}

function getAllPermutations<T>(array: T[]): T[][] {
  if (array.length <= 1) return [array]
  
  const permutations: T[][] = []
  const smallerPerms = getAllPermutations(array.slice(1))
  
  const firstOption = array[0]
  for (const perm of smallerPerms) {
    for (let i = 0; i <= perm.length; i++) {
      const permutation = [...perm.slice(0, i), firstOption, ...perm.slice(i)]
      permutations.push(permutation)
    }
  }
  
  return permutations
}

function tryRecoverAddress(digest: string, signature: string): string | null {
  try {
    return ethers.recoverAddress(digest, signature)
  } catch {
    return null
  }
}

export const handler = async (
  argv: CommonOptions & {
    chainIds: string
    addresses: string
    digests: string
    messages: string
    targetSubdigest?: string
    signature?: string
    expectedSigner?: string
    parallel: number
  },
  services: Services
) => {
  // Parse input arrays
  const chainIds = argv.chainIds.split(',').map(id => parseInt(id.trim()))
  const addresses = argv.addresses.split(',').map(addr => addr.trim())
  const digests = argv.digests ? argv.digests.split(',').map(d => d.trim()) : []
  
  // Validate matching method
  if (!argv.targetSubdigest && !argv.signature) {
    throw new Error('Either targetSubdigest or signature+expectedSigner must be provided')
  }

  const targetSubdigest = argv.targetSubdigest?.toLowerCase()
  const signature = argv.signature
  const expectedSigner = argv.expectedSigner?.toLowerCase()

  // Parse all possible digests
  const initialDigests: {
    digest: Uint8Array,
    metadata: string
  }[] = []

  for (const digest of digests) {
    initialDigests.push({
      digest: ethers.getBytes(digest),
      metadata: `digest:${digest}`
    })
  }

  console.log('\nStarting subdigest search...')
  if (targetSubdigest) {
    console.log(`Target subdigest: ${targetSubdigest}`)
  } else {
    console.log(`Target signature: ${signature}`)
    console.log(`Expected signer: ${expectedSigner}`)
  }
  console.log(`Testing with ${chainIds.length} chainIds and ${addresses.length} addresses`)
  
  let found = false
  let attempts = 0

  const isMatch = (computedSubdigest: string) => {
    if (targetSubdigest) {
      return computedSubdigest === targetSubdigest
    } else {
      const recoveredAddress = tryRecoverAddress(computedSubdigest, signature!)
      return recoveredAddress?.toLowerCase() === expectedSigner
    }
  }

  // Try direct subdigests first
  for (const chainId of chainIds) {
    for (const address of addresses) {
      for (const { digest, metadata } of initialDigests) {
        attempts++
        const computedSubdigest = subdigestOf(chainId, address, digest).toLowerCase()
        const matched = isMatch(computedSubdigest)

        console.log(`\nAttempt ${attempts} (direct):`)
        console.log(`  Chain ID: ${chainId}`)
        console.log(`  Address:  ${address}`)
        console.log(`  Digest:   ${metadata}`)
        console.log(`  Result:   ${computedSubdigest}`)
        if (signature) {
          const recovered = tryRecoverAddress(computedSubdigest, signature)
          console.log(`  Recovered: ${recovered || 'invalid signature'}`)
        }
        console.log(`  Match:    ${matched ? '✅ YES!' : '❌ No'}`)

        if (matched) {
          found = true
          console.log('\n🎉 Found matching combination!')
          console.log('============================')
          console.log(`Chain ID: ${chainId}`)
          console.log(`Address:  ${address}`)
          console.log(`Digest:   ${metadata}`)
          return
        }
      }
    }
  }

  // Try nested subdigests with all possible address permutations
  const addressPermutations = getAllPermutations(addresses)
  console.log(`\nTrying nested subdigests with ${addressPermutations.length} address permutations...`)

  for (const chainId of chainIds) {
    for (const addressPermutation of addressPermutations) {
      for (const { digest: initialDigest, metadata: initialMetadata } of initialDigests) {
        let currentDigest = initialDigest
        let currentMetadata = initialMetadata
        
        for (let i = 0; i < addressPermutation.length; i++) {
          const address = addressPermutation[i]
          attempts++
          
          const computedSubdigest = subdigestOf(chainId, address, currentDigest).toLowerCase()
          const matched = isMatch(computedSubdigest)

          console.log(`\nAttempt ${attempts} (nested, depth ${i + 1}):`)
          console.log(`  Chain ID: ${chainId}`)
          console.log(`  Address:  ${address}`)
          console.log(`  Using:    ${currentMetadata} (${ethers.hexlify(currentDigest)})`)
          console.log(`  Result:   ${computedSubdigest}`)
          if (signature) {
            const recovered = tryRecoverAddress(computedSubdigest, signature)
            console.log(`  Recovered: ${recovered || 'invalid signature'}`)
          }
          console.log(`  Match:    ${matched ? '✅ YES!' : '❌ No'}`)
          console.log(`  Path:     ${addressPermutation.slice(0, i + 1).join(' -> ')}`)

          if (matched) {
            found = true
            console.log('\n🎉 Found matching nested combination!')
            console.log('================================')
            console.log(`Chain ID: ${chainId}`)
            console.log(`Address Path: ${addressPermutation.slice(0, i + 1).join(' -> ')}`)
            console.log(`Initial Digest: ${initialMetadata}`)
            return
          }

          // Update current digest for next iteration
          currentDigest = ethers.getBytes(computedSubdigest)
          currentMetadata = `subdigest(chain=${chainId},addr=${address},${currentMetadata})`
        }
      }
    }
  }

  if (!found) {
    console.log('\n❌ No matching combination found after trying all possibilities.')
    console.log(`Total attempts: ${attempts}`)
  }
}
