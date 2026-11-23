# pg-tables-to-zod

## :evergreen_tree: Purpose

A command-line utility and module to turn postgres tables into Zod (v4) schemas

## :seedling: Getting started

You can use this project as a dependency for your project:

```bash
# Bun
bun add pg-tables-to-zod

# Node.js
npm install pg-tables-to-zod
```

You can use the converter as a module:

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
You can then use bun run to generate output schemas and validate any code changes:

```bash
bun run src/cli.ts -c my-config.json
```

### :test_tube: Testing

```bash
bun run test
```

Every test run reports coverage and fails when a source file drops below 90% of its lines or functions, see `bunfig.toml`.
The tests do not need a database. They load the fixture database from `test/fixtures/database.json`, the serialized structure of `test/fixtures/database.sql`.
The generated schemas are compared to the snapshots in `test/__snapshots__`. Review a snapshot change like a code change, then update the snapshots with `bun test --update-snapshots`.
After changing `database.sql` or upgrading pg-structure, regenerate `database.json` as described in `test/fixtures/serialize-database.ts`.

### :cool: Technology stack

- bun
- typescript
- zod
- pg-structure

### :twisted_rightwards_arrows: Branch strategy and protection

The `main` branch has protection enabled against direct pushes.
All changes need to be done through a reviewed pull request.

### :lock: Supply chain

- `.npmrc` and `bunfig.toml` refuse package versions published less than 7 days ago (package quarantine)
- Pull requests run the shared [supply-chain gates](https://github.com/SpringTree/springtree-ci-workflows) (secrets, licences, code and package quarantine) from `compliance.yml`
- GitHub Actions are pinned by commit SHA

## :up: Deploying

Releases are fully handled by GitHub Actions; never publish from a laptop.

1. Merge pull requests with [conventional commit](https://www.conventionalcommits.org) messages into `main`
2. [release-please](https://github.com/googleapis/release-please-action) opens or updates a release pull request with the version bump and changelog
3. Merging the release pull request creates the tag and GitHub release, and the release workflow publishes to npm using [trusted publishing](https://docs.npmjs.com/trusted-publishers)

One-time setup:

- npm: trusted publisher for this repository and `release.yml`
- GitHub: an organization GitHub App with contents, pull requests and issues write access on this repository; its client id as the `RELEASE_APP_CLIENT_ID` repository variable and its private key as the `RELEASE_APP_PRIVATE_KEY` repository secret

## Contributing

Please see [CONTRIBUTING.md](./CONTRIBUTING.md) for contribution guidelines.

## License

MIT
