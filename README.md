# pg-tables-to-zod

## :evergreen_tree: Purpose

A command-line utility and module to turn postgres tables into Zod schemas

## :seedling: Getting started

You can use this project as a dependency for your project:

```bash
bun add pg-tables-to-zod
```

```typescript
import { convert, type TConfiguration } from 'pg-tables-to-zod';

const configuration: TConfiguration = {
	...
}

const outputSchemas = await convert(configuration);

outputSchemas.map((outputSchema) => {
	console.log(`Schema file: ${outputSchema.path}`);
	console.log(`Schema contents: ${outputSchema.schema}`);
})
```

Or as a CLI command:

```bash
pgtables2zod --pg-host localhost --pg-user admin --pg-password secret --pg-database my-db --pg-schema my_schema -o test/
```

The above example will connect to the Postgresql instance on `localhost` and output Zod schemas for all tables and views in `my_schema` to the `test/` directory.
Calling with -h will provide you with all the possible parameters and options.
Using with the `-c my-config.json` option most convenient.
If there is no password in the configuration file you will be prompted to enter it.

## :hammer: Development

Run:

```bash
# Install dependencies
bun install
```

Please look at `example-config.json` for how to setup a configuration file.
You can then use bun run to test and generate output:

```bash
bun run src/cli.ts -c my-config.json
```

### :cool: Technology stack

* bun
* typescript
* zod
* pg-structure

### :twisted_rightwards_arrows: Branch strategy and protection

The `main` branch has protection enabled against direct pushes.
All changes need to be done through a reviewed pull request.

## :up: Deploying

The package is currently published to npm manually from the `main` branch.
Be sure to run `bun run build` and `bun run release` before publishing.

## Contributing

Please see [CONTRIBUTING.md](./CONTRIBUTING.md) for contribution guidelines.

## License

MIT
