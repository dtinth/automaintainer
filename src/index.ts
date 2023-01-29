import yargs from 'yargs/yargs'
import { hideBin } from 'yargs/helpers'

const args = yargs(hideBin(process.argv))
  .options({
    lib: {
      description: 'Set up an opiniated library project',
      type: 'boolean',
    },
    prettier: {
      description: 'Set up Prettier configuration',
      type: 'boolean',
    },
  })
  .parse()

console.log(args)
