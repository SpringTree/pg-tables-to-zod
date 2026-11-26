# Changelog

## [2.0.2](https://github.com/SpringTree/pg-tables-to-zod/compare/v2.0.1...v2.0.2) (2026-11-26)


### Bug Fixes

* **cli:** exit when a conversion fails instead of hanging on the database connection ([#8](https://github.com/SpringTree/pg-tables-to-zod/issues/8)) ([7ccf9a9](https://github.com/SpringTree/pg-tables-to-zod/commit/7ccf9a95a9c13eb74b73033300eaad98f829316d))

## [2.0.1](https://github.com/SpringTree/pg-tables-to-zod/compare/v2.0.0...v2.0.1) (2026-11-26)


### Bug Fixes

* **package:** allow require() on node.js 22.12 and later ([#6](https://github.com/SpringTree/pg-tables-to-zod/issues/6)) ([6e1fc1e](https://github.com/SpringTree/pg-tables-to-zod/commit/6e1fc1e2413cae93dff7420b4685cbfc3a08b264))

## [2.0.0](https://github.com/SpringTree/pg-tables-to-zod/compare/v1.0.24...v2.0.0) (2026-11-24)


### ⚠ BREAKING CHANGES

* **cli:** the --unwrap (-u) option and the output.unwrap configuration setting are removed. A configuration file that still sets output.unwrap fails the configuration check

### Bug Fixes

* **cli:** convert --pg-port and --strict values before the configuration check ([53d1b56](https://github.com/SpringTree/pg-tables-to-zod/commit/53d1b565ad45b1230a00e319b3193567d657ec7e))
* **cli:** keep the configuration path out of the error format string ([53d1b56](https://github.com/SpringTree/pg-tables-to-zod/commit/53d1b565ad45b1230a00e319b3193567d657ec7e))
* **cli:** let command-line options override configuration file values ([53d1b56](https://github.com/SpringTree/pg-tables-to-zod/commit/53d1b565ad45b1230a00e319b3193567d657ec7e))
* **cli:** remove the --unwrap option, it never unwrapped a single table ([53d1b56](https://github.com/SpringTree/pg-tables-to-zod/commit/53d1b565ad45b1230a00e319b3193567d657ec7e))
* **cli:** run the published cli under node.js ([53d1b56](https://github.com/SpringTree/pg-tables-to-zod/commit/53d1b565ad45b1230a00e319b3193567d657ec7e))
* **converter:** describe columns when no default description is set ([53d1b56](https://github.com/SpringTree/pg-tables-to-zod/commit/53d1b565ad45b1230a00e319b3193567d657ec7e))
* **converter:** escape comments, defaults and enum values in generated code ([53d1b56](https://github.com/SpringTree/pg-tables-to-zod/commit/53d1b565ad45b1230a00e319b3193567d657ec7e))
* **converter:** indent the generated code with tabs only ([53d1b56](https://github.com/SpringTree/pg-tables-to-zod/commit/53d1b565ad45b1230a00e319b3193567d657ec7e))
* **deps:** replace commander, lodash-es, prompts and ts-morph with built-in code ([53d1b56](https://github.com/SpringTree/pg-tables-to-zod/commit/53d1b565ad45b1230a00e319b3193567d657ec7e))
* **deps:** require node.js 22 or later ([53d1b56](https://github.com/SpringTree/pg-tables-to-zod/commit/53d1b565ad45b1230a00e319b3193567d657ec7e))
* **deps:** upgrade zod to 4.6.7 for GHSA-mrhx-c7xc-m3w5 ([53d1b56](https://github.com/SpringTree/pg-tables-to-zod/commit/53d1b565ad45b1230a00e319b3193567d657ec7e))
