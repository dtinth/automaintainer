#!/usr/bin/env node

import yargs from "yargs";

const flag = (description: string) => ({
  type: "boolean" as const,
  description,
});

yargs(process.argv.slice(2))
  .demandCommand()
  .strict()
  .help()
  .command(
    "$0",
    "Runs the automaintainer",
    {
      package: flag(
        "Updates package.json metadata field such as repository, bugs, homepage, etc."
      ),
    },
    async (args) => {
      console.log(args);
    }
  )
  .parse();
