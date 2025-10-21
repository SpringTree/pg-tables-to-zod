import type { TConfiguration } from './index.js'

export async function readConfigFile(
	filePath: string,
): Promise<TConfiguration> {
	const file = Bun.file(filePath)
	const json = await file.json()
	return json as TConfiguration
}
