// Matches the words in an identifier, following the word rules of lodash's camelCase.
// \p{Lu} is any upper case letter, \p{Ll} any lower case letter, \p{N} any digit:
// - \p{Lu}?\p{Ll}+                       a lower case word, optionally capitalised (user, User)
// - \p{Lu}+(?=\p{Lu}\p{Ll}|[^\p{L}]|$)  an upper case run, ending before the next capitalised word (HTTPServer -> HTTP).
//                                       Like lodash this splits a plural acronym: IDs -> I, Ds
// - \p{N}*(?:1ST|2ND|3RD|(?![123])\p{N}TH)(?=\b|[\p{Ll}_])  an upper case ordinal (2ND)
// - \p{N}*(?:1st|2nd|3rd|(?![123])\p{N}th)(?=\b|[\p{Lu}_])  a lower case ordinal (2nd)
// - \p{N}+                              a number
// Everything else (underscores, dashes, spaces, punctuation, emoji) separates words
//
const wordPattern =
  /\p{Lu}?\p{Ll}+|\p{Lu}+(?=\p{Lu}\p{Ll}|[^\p{L}]|$)|\p{N}*(?:1ST|2ND|3RD|(?![123])\p{N}TH)(?=\b|[\p{Ll}_])|\p{N}*(?:1st|2nd|3rd|(?![123])\p{N}th)(?=\b|[\p{Lu}_])|\p{N}+/gu;

// Matches combining diacritical marks, which NFD normalisation splits off their letter (Ä -> A + ̈)
//
const diacriticPattern = /[̀-ͯ]/g;

// Upper cases the first character: user -> User
//
export function upperFirst(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

// Converts a postgresql identifier to camel case: organization_user -> organizationUser
// Diacritics are removed like lodash does: Äpfel -> apfel
//
export function camelCase(text: string): string {
  const words = text.normalize("NFD").replace(diacriticPattern, "").match(wordPattern) ?? [];
  return words
    .map((word, index) => (index === 0 ? word.toLowerCase() : upperFirst(word.toLowerCase())))
    .join("");
}

//
