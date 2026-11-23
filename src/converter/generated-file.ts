import { dirname, relative, sep } from "node:path";

// Indentation of the continuation lines of a multi-line declaration, as the generated code has always been laid out
//
export const continuationIndent = "    ";

// A TypeScript file being generated: named imports followed by statements.
// Renders as:
// - one import declaration per named import, without blank lines in between
// - a blank line between the imports and between the statements
//
export class GeneratedFile {
  readonly #imports: { name: string; moduleSpecifier: string }[] = [];
  readonly #statements: string[] = [];
  readonly #declaredNames = new Set<string>();

  // filePath is absolute
  //
  constructor(readonly filePath: string) {}

  // Adds: import { name } from "moduleSpecifier"; unless name is already imported
  //
  addNamedImport(name: string, moduleSpecifier: string) {
    if (!this.#imports.some((namedImport) => namedImport.name === name)) {
      this.#imports.push({ name, moduleSpecifier });
    }
  }

  // Adds the statements that declare name, unless name is already declared
  //
  addDeclaration(name: string, statements: string[]) {
    if (!this.#declaredNames.has(name)) {
      this.#declaredNames.add(name);
      this.#statements.push(...statements);
    }
  }

  // The module specifier to import the other file from this one: ../pg-types.js
  //
  getModuleSpecifierTo(otherFile: GeneratedFile): string {
    // Use / on every platform and the .js extension the compiled file is imported by: \.ts$ is the extension at the end
    //
    const relativePath = relative(dirname(this.filePath), otherFile.filePath)
      .split(sep)
      .join("/")
      .replace(/\.ts$/, ".js");
    return relativePath.startsWith(".") ? relativePath : `./${relativePath}`;
  }

  getFullText(): string {
    const importDeclarations = this.#imports.map(
      (namedImport) => `import { ${namedImport.name} } from "${namedImport.moduleSpecifier}";`,
    );
    const sections = [importDeclarations.join("\n"), ...this.#statements];
    return `${sections.filter((section) => section !== "").join("\n\n")}\n`;
  }
}

//
