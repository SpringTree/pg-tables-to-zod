export default function escapeSingleQuotes(
	str: string | number | null | boolean | undefined,
): string {
	return (str?.toString() ?? '').replace(/'/g, "\\'");
}
