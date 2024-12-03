import type { Argv } from 'yargs'
import * as core from '@0xsequence/core'
import type { CommonOptions, Services } from '../types'

export const command = 'decode <signature>'
export const describe = 'Decode a signature'

export const builder = (yargs: Argv) => {
  return yargs
    .positional('signature', {
      describe: 'The signature',
      type: 'string',
      demandOption: true,
    })
    .option('nested', {
      describe: 'Decode nested signatures',
      type: 'boolean',
      default: false
    })
    .option('failOnError', {
      describe: 'Fail on error when decoding',
      type: 'boolean',
      default: true
    })
}

function attemptDecode(signature: string, failOnError: boolean) {
  try {
    return core.v2.signature.SignatureCoder.decode(signature)
  } catch (e2) {
    try {
      return core.v1.signature.SignatureCoder.decode(signature)
    } catch (e1) {
      if (!failOnError) {
        return { failedToDecode: signature }
      }
      throw new Error(`Failed to decode signature: ${signature}`)
    }
  }
}

function decodeNested(decoded: any, failOnError: boolean): any {
  // If it's a v2 signature with a tree structure
  if (decoded.version === 2 && decoded.decoded?.tree) {
    const tree = decoded.decoded.tree;
    
    // Recursively decode left and right nodes if they have signatures
    if (tree.left?.signature) {
      tree.left.decodedSignature = decodeNested(
        attemptDecode(tree.left.signature, failOnError),
        failOnError
      )
    }
    if (tree.right?.signature) {
      tree.right.decodedSignature = decodeNested(
        attemptDecode(tree.right.signature, failOnError),
        failOnError
      )
    }
  }

  return decoded
}

export const handler = async (argv: CommonOptions & { signature: string, nested?: boolean, failOnError: boolean }) => {
  const decoded = attemptDecode(argv.signature, argv.failOnError)

  if (argv.nested) {
    const nestedDecoded = decodeNested(decoded, argv.failOnError)
    console.log(JSON.stringify(nestedDecoded, null, 2))
  } else {
    console.log(JSON.stringify(decoded, null, 2))
  }
} 
