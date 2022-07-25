import * as regex from '../utils/regex'
import * as fp from '../utils/fp'
import * as is from '../utils/is'
import { CharCode, Comparison } from '../constants'

const seperator = {
  dir: '/',
  altDir: '\\',
  urlScheme: '://',
}

/**
 * Combines paths.
 * If a path is absolute, it replaces any previous path.
 * Relative paths are not simplified.
 * @example
 * ```ts
 * // Non-rooted
 * combine("path", "to", "file.ext") === "path/to/file.ext"
 * combine("path", "dir", "..", "to", "file.ext") === "path/dir/../to/file.ext"
 *
 * // POSIX
 * combine("/path", "to", "file.ext") === "/path/to/file.ext"
 * combine("/path", "/to", "file.ext") === "/to/file.ext"
 *
 * // DOS
 * combine("c:/path", "to", "file.ext") === "c:/path/to/file.ext"
 * combine("c:/path", "c:/to", "file.ext") === "c:/to/file.ext"
 *
 * // URL
 * combine("file:///path", "to", "file.ext") === "file:///path/to/file.ext"
 * combine("file:///path", "file:///to", "file.ext") === "file:///to/file.ext"
 * ```
 */
export function combine(
  path: string,
  ...paths: (string | undefined)[]
): string {
  if (path) path = normalizeSlashes(path)
  paths.forEach((relPath) => {
    if (relPath) {
      relPath = normalizeSlashes(relPath)
      if (!path || getRootLength(relPath) !== 0) {
        path = relPath
      } else {
        path = ensureTrailingDirSeparator(path) + relPath
      }
    }
  })

  return path
}

export function createGetCanonicalFileName(
  useCaseSensitiveFileNames: boolean,
): (fileName: string) => string {
  return useCaseSensitiveFileNames ? fp.identity : toFileNameLowerCase
}

function compareComparableValues(
  a: string | undefined,
  b: string | undefined,
): Comparison
function compareComparableValues(
  a: number | undefined,
  b: number | undefined,
): Comparison
function compareComparableValues(
  a: string | number | undefined,
  b: string | number | undefined,
) {
  return a === b
    ? Comparison.EqualTo
    : a === undefined
    ? Comparison.LessThan
    : b === undefined
    ? Comparison.GreaterThan
    : a < b
    ? Comparison.LessThan
    : Comparison.GreaterThan
}

/**
 * Determines whether a `parent` path contains a `child` path using the provide case sensitivity.
 */
export function contains(
  parent: string,
  child: string,
  ignoreCase?: boolean,
): boolean

export function contains(
  parent: string,
  child: string,
  currentDir: string,
  ignoreCase?: boolean,
): boolean

export function contains(
  parent: string,
  child: string,
  currentDir?: string | boolean,
  ignoreCase?: boolean,
) {
  if (is.str(currentDir)) {
    parent = combine(currentDir, parent)
    child = combine(currentDir, child)
  } else if (is.bool(currentDir)) {
    ignoreCase = currentDir
  }
  if (is.und(parent) || is.und(child)) return false
  if (parent === child) return true
  const parentComponents = reducePathComponents(getPathComponents(parent))
  const childComponents = reducePathComponents(getPathComponents(child))
  if (childComponents.length < parentComponents.length) return false
  const componentEqualityComparer = ignoreCase
    ? fp.equateStringsCaseInsensitive
    : fp.equateStringsCaseSensitive
  for (let i = 0; i < parentComponents.length; i++) {
    const equalityComparer =
      i === 0 ? fp.equateStringsCaseInsensitive : componentEqualityComparer
    if (!equalityComparer(parentComponents[i], childComponents[i])) return false
  }
  return true
}

function comparePathsWorker(
  a: string,
  b: string,
  componentComparer: (a: string, b: string) => Comparison,
) {
  if (a === b) return Comparison.EqualTo
  if (a === undefined) return Comparison.LessThan
  if (b === undefined) return Comparison.GreaterThan

  // NOTE: Performance optimization - shortcut if the root segments differ as there would be no eed to perform path reduction.
  const aRoot = a.substring(0, getRootLength(a))
  const bRoot = b.substring(0, getRootLength(b))
  const result = compareStringsCaseInsensitive(aRoot, bRoot)
  if (result !== Comparison.EqualTo) return result
  // NOTE: Performance optimization - shortcut if there are no relative path segments in the non-root portion of the path
  const aRest = a.substring(aRoot.length)
  const bRest = b.substring(bRoot.length)
  if (
    !regex.relativePathSegment.test(aRest) &&
    !regex.relativePathSegment.test(bRest)
  ) {
    return componentComparer(aRest, bRest)
  }
  // The path contains a relative path segment. Normalize the paths and perform a slower component by component comparison.
  const aComponents = reducePathComponents(getPathComponents(a))
  const bComponents = reducePathComponents(getPathComponents(b))
  const sharedLength = Math.min(aComponents.length, bComponents.length)
  for (let i = 1; i < sharedLength; i++) {
    const result = componentComparer(aComponents[i], bComponents[i])
    if (result !== Comparison.EqualTo) return result
  }
  return compareValues(aComponents.length, bComponents.length)
}

/**
 * Compare two numeric values for their order relative to each other.
 * To compare strings, use any of the `compareStrings` functions.
 */
export function compareValues(
  a: number | undefined,
  b: number | undefined,
): Comparison {
  return compareComparableValues(a, b)
}

export function convertToRelativePath(
  absOrRelPath: string,
  basePath: string,
  getCanonicalFileName: (path: string) => string,
): string {
  return !isRootedDiskPath(absOrRelPath)
    ? absOrRelPath
    : getRelativePathToDirectoryOrUrl(
        basePath,
        absOrRelPath,
        basePath,
        getCanonicalFileName,
        /*isAbsolutePathAnUrl*/ false,
      )
}

/**
 * Compare two paths using the provided case sensitivity.
 */
export function comparePaths(
  a: string,
  b: string,
  ignoreCase?: boolean,
): Comparison
export function comparePaths(
  a: string,
  b: string,
  currentDir: string,
  ignoreCase?: boolean,
): Comparison
export function comparePaths(
  a: string,
  b: string,
  currentDir?: string | boolean,
  ignoreCase?: boolean,
) {
  if (is.str(currentDir)) {
    a = combine(currentDir, a)
    b = combine(currentDir, b)
  } else if (is.bool(currentDir)) {
    ignoreCase = currentDir
  }
  return comparePathsWorker(a, b, getStringComparer(ignoreCase))
}

/**
 * Compare two strings using a case-insensitive ordinal comparison.
 * Ordinal comparisons are based on the difference between the unicode code points of both strings.
 *  Characters with multiple unicode representations are considered unequal. Ordinal comparisons provide predictable ordering, but place "a" after "B".
 * Case-insensitive comparisons compare both strings one code-point at a time using the integer value of each code-point after applying `toUpperCase` to each string. We always map both strings to their upper-case form as some unicode characters do not properly round-trip to lowercase (such as `ẞ` (German sharp capital s)).
 */
export function compareStringsCaseInsensitive(a: string, b: string) {
  if (a === b) return Comparison.EqualTo
  if (is.und(a)) return Comparison.LessThan
  if (is.und(b)) return Comparison.GreaterThan
  a = a.toUpperCase()
  b = b.toUpperCase()
  return a < b
    ? Comparison.LessThan
    : a > b
    ? Comparison.GreaterThan
    : Comparison.EqualTo
}

/**
 * Compare two strings using a case-sensitive ordinal comparison.
 * Ordinal comparisons are based on the difference between the unicode code points of both strings. Characters with multiple unicode representations are considered unequal. Ordinal comparisons provide predictable ordering, but place "a" after "B".
 * Case-sensitive comparisons compare both strings one code-point at a time using the integer value of each code-point.
 */
export function compareStringsCaseSensitive(
  a: string | undefined,
  b: string | undefined,
): Comparison {
  return compareComparableValues(a, b)
}

/**
 * Changes the extension of a path to the provided extension if it has one of the provided extensions.
 *
 * ```ts
 * changeAnyExtension("/path/to/file.ext", ".js", ".ext") === "/path/to/file.js"
 * changeAnyExtension("/path/to/file.ext", ".js", ".ts") === "/path/to/file.ext"
 * changeAnyExtension("/path/to/file.ext", ".js", [".ext", ".ts"]) === "/path/to/file.js"
 * ```
 */
export function changeAnyExtension(
  path: string,
  ext: string,
  extensions?: string | string[],
  ignoreCase?: boolean,
) {
  const pathext =
    !is.und(extensions) && !is.und(ignoreCase)
      ? getExtFromPath(path, extensions, ignoreCase)
      : getExtFromPath(path)
  return pathext
    ? path.slice(0, path.length - pathext.length) +
        (ext.startsWith('.') ? ext : '.' + ext)
    : path
}

/**
 * Ensures a path is either absolute (prefixed with `/` or `c:`) or dot-relative (prefixed with `./` or `../`) so as not to be confused with an unprefixed module name.
 * ```ts
 * ensurePathIsNonModuleName("/path/to/file.ext") === "/path/to/file.ext"
 * ensurePathIsNonModuleName("./path/to/file.ext") === "./path/to/file.ext"
 * ensurePathIsNonModuleName("../path/to/file.ext") === "../path/to/file.ext"
 * ensurePathIsNonModuleName("path/to/file.ext") === "./path/to/file.ext"
 * ```
 */
export function ensurePathIsNonModuleName(path: string): string {
  return !isAbsolute(path) && !isRelative(path) ? './' + path : path
}

/**
 * Adds a trailing directory separator to a path if it does not already have one.
 * ```ts
 * ensureTrailingDirSeparator("/path/to/file.ext") === "/path/to/file.ext/"
 * ensureTrailingDirSeparator("/path/to/file.ext/") === "/path/to/file.ext/"
 * ```
 */
export function ensureTrailingDirSeparator(path: string) {
  if (!hasTrailingDirSeparator(path)) return path + seperator.dir
  return path
}

export function extIs(path: string, extension: string) {
  return path.length > extension.length && path.endsWith(extension)
}

export function extIsOneOf(path: string, extensions: string[]) {
  for (const extension of extensions) if (extIs(path, extension)) return true
  return false
}

/**
 * Calls `callback` on `directory` and every ancestor directory it has, returning the first defined result.
 */
export function forEachAncestorDir<T>(
  directory: string,
  callback: (directory: string) => T | undefined,
): T | undefined {
  while (true) {
    const result = callback(directory)
    if (result !== undefined) return result
    const parentPath = getDirectoryPath(directory)
    if (parentPath === directory) return undefined
    directory = parentPath
  }
}

/**
 * Returns the path except for its containing directory name.
 * Semantics align with NodeJS's `path.basename` except that we support URL's as well.
 *
 * ```ts
 * // POSIX
 * getBaseFileName("/path/to/file.ext") === "file.ext"
 * getBaseFileName("/path/to/") === "to"
 * getBaseFileName("/") === ""
 * // DOS
 * getBaseFileName("c:/path/to/file.ext") === "file.ext"
 * getBaseFileName("c:/path/to/") === "to"
 * getBaseFileName("c:/") === ""
 * getBaseFileName("c:") === ""
 * // URL
 * getBaseFileName("http://typescriptlang.org/path/to/file.ext") === "file.ext"
 * getBaseFileName("http://typescriptlang.org/path/to/") === "to"
 * getBaseFileName("http://typescriptlang.org/") === ""
 * getBaseFileName("http://typescriptlang.org") === ""
 * getBaseFileName("file://server/path/to/file.ext") === "file.ext"
 * getBaseFileName("file://server/path/to/") === "to"
 * getBaseFileName("file://server/") === ""
 * getBaseFileName("file://server") === ""
 * getBaseFileName("file:///path/to/file.ext") === "file.ext"
 * getBaseFileName("file:///path/to/") === "to"
 * getBaseFileName("file:///") === ""
 * getBaseFileName("file://") === ""
 * ```
 */
export function getBaseFileName(path: string): string
/**
 * Gets the portion of a path following the last (non-terminal) separator (`/`).
 * Semantics align with NodeJS's `path.basename` except that we support URL's as well.
 * If the base name has any one of the provided extensions, it is removed.
 *
 * ```ts
 * getBaseFileName("/path/to/file.ext", ".ext", true) === "file"
 * getBaseFileName("/path/to/file.js", ".ext", true) === "file.js"
 * getBaseFileName("/path/to/file.js", [".ext", ".js"], true) === "file"
 * getBaseFileName("/path/to/file.ext", ".EXT", false) === "file.ext"
 * ```
 */
export function getBaseFileName(
  path: string,
  extensions: string | string[],
  ignoreCase: boolean,
): string
export function getBaseFileName(
  path: string,
  extensions?: string | string[],
  ignoreCase?: boolean,
) {
  path = normalizeSlashes(path)
  // If the path provided is itself the root, then it has not file name.
  const rootLength = getRootLength(path)
  if (rootLength === path.length) return ''
  // RRturn the trailing portion of the path starting after the last (non-terminal) directory separator but not including any trailing directory separator.
  path = removeTrailingDirSeparator(path)
  const name = path.slice(
    Math.max(getRootLength(path), path.lastIndexOf(seperator.dir) + 1),
  )
  const extension =
    !is.und(extensions) && !is.und(ignoreCase)
      ? getExtFromPath(name, extensions, ignoreCase)
      : undefined
  return extension ? name.slice(0, name.length - extension.length) : name
}

/**
 * Gets the file extension for a path, provided it is one of the provided extensions.
 * ```ts
 * getExtFromPath("/path/to/file.ext", ".ext", true) === ".ext"
 * getExtFromPath("/path/to/file.js", ".ext", true) === ""
 * getExtFromPath("/path/to/file.js", [".ext", ".js"], true) === ".js"
 * getExtFromPath("/path/to/file.ext", ".EXT", false) === ""
 */
export function getExtFromPath(
  path: string,
  extensions?: string | string[],
  ignoreCase?: boolean,
): string {
  // Retrieves any string from the final "." onwards from a base file name.
  // Unlike extensionFromPath, which throws an exception on unrecognized extensions.
  if (extensions) {
    return getAnyExtensionFromPathWorker(
      removeTrailingDirSeparator(path),
      extensions,
      ignoreCase
        ? fp.equateStringsCaseInsensitive
        : fp.equateStringsCaseSensitive,
    )
  }
  const baseFileName = getBaseFileName(path)
  const extensionIndex = baseFileName.lastIndexOf('.')
  if (extensionIndex >= 0) return baseFileName.substring(extensionIndex)
  return ''
}

function getAnyExtensionFromPathWorker(
  path: string,
  extensions: string | readonly string[],
  stringEqComparer: (a: string, b: string) => boolean,
) {
  if (is.str(extensions)) {
    return tryGetExtFromPath(path, extensions, stringEqComparer) || ''
  }
  for (const extension of extensions) {
    const result = tryGetExtFromPath(path, extension, stringEqComparer)
    if (result) return result
  }
  return ''
}

/**
 * Returns the path except for its basename. Semantics align with NodeJS's `path.dirname`
 * except that we support URLs as well.
 *
 * ```ts
 * // POSIX
 * getDirectoryPath("/path/to/file.ext") === "/path/to"
 * getDirectoryPath("/path/to/") === "/path"
 * getDirectoryPath("/") === "/"
 * // DOS
 * getDirectoryPath("c:/path/to/file.ext") === "c:/path/to"
 * getDirectoryPath("c:/path/to/") === "c:/path"
 * getDirectoryPath("c:/") === "c:/"
 * getDirectoryPath("c:") === "c:"
 * // URL
 * getDirectoryPath("http://typescriptlang.org/path/to/file.ext") === "http://typescriptlang.org/path/to"
 * getDirectoryPath("http://typescriptlang.org/path/to") === "http://typescriptlang.org/path"
 * getDirectoryPath("http://typescriptlang.org/") === "http://typescriptlang.org/"
 * getDirectoryPath("http://typescriptlang.org") === "http://typescriptlang.org"
 * getDirectoryPath("file://server/path/to/file.ext") === "file://server/path/to"
 * getDirectoryPath("file://server/path/to") === "file://server/path"
 * getDirectoryPath("file://server/") === "file://server/"
 * getDirectoryPath("file://server") === "file://server"
 * getDirectoryPath("file:///path/to/file.ext") === "file:///path/to"
 * getDirectoryPath("file:///path/to") === "file:///path"
 * getDirectoryPath("file:///") === "file:///"
 * getDirectoryPath("file://") === "file://"
 * ```
 */
export function getDirectoryPath(path: string): string {
  path = normalizeSlashes(path)
  // If the path provided is itself the root, then return it.
  const rootLength = getRootLength(path)
  if (rootLength === path.length) return path
  // return the leading portion of the path up to the last (non-terminal) directory separator
  // but not including any trailing directory separator.
  path = removeTrailingDirSeparator(path)
  return path.slice(0, Math.max(rootLength, path.lastIndexOf(seperator.dir)))
}

/**
 * Returns length of the root part of a path or URL (i.e. length of "/", "x:/", "//server/share/, file:///user/files").
 * If the root is part of a URL, the twos-complement of the root length is returned.
 */
function getEncodedRootLength(path: string): number {
  if (!path) return 0
  const ch0 = path.charCodeAt(0)
  // POSIX or UNC
  if (ch0 === CharCode.Slash || ch0 === CharCode.Backslash) {
    if (path.charCodeAt(1) !== ch0) return 1 // POSIX: "/" (or non-normalized "\")
    const p1 = path.indexOf(
      ch0 === CharCode.Slash ? seperator.dir : seperator.altDir,
      2,
    )
    if (p1 < 0) return path.length // UNC: "//server" or "\\server"
    return p1 + 1 // UNC: "//server/" or "\\server\"
  }
  // DOS
  if (isVolumeCharacter(ch0) && path.charCodeAt(1) === CharCode.Colon) {
    const ch2 = path.charCodeAt(2)
    if (ch2 === CharCode.Slash || ch2 === CharCode.Backslash) return 3 // DOS: "c:/" or "c:\"
    if (path.length === 2) return 2 // DOS: "c:" (but not "c:d")
  }
  // URL
  const schemeEnd = path.indexOf(seperator.urlScheme)
  if (schemeEnd !== -1) {
    const authorityStart = schemeEnd + seperator.urlScheme.length
    const authorityEnd = path.indexOf(seperator.dir, authorityStart)
    if (authorityEnd !== -1) {
      // URL: "file:///", "file://server/", "file://server/path"
      // For local "file" URLs, include the leading DOS volume (if present).
      // Per https://www.ietf.org/rfc/rfc1738.txt, a host of "" or "localhost" is a
      // special case interpreted as "the machine from which the URL is being interpreted".
      const scheme = path.slice(0, schemeEnd)
      const authority = path.slice(authorityStart, authorityEnd)
      if (
        scheme === 'file' &&
        (authority === '' || authority === 'localhost') &&
        isVolumeCharacter(path.charCodeAt(authorityEnd + 1))
      ) {
        const volumeSeparatorEnd = getFileUrlVolumeSeparatorEnd(
          path,
          authorityEnd + 2,
        )
        if (volumeSeparatorEnd !== -1) {
          if (path.charCodeAt(volumeSeparatorEnd) === CharCode.Slash) {
            // URL: "file:///c:/", "file://localhost/c:/", "file:///c%3a/", "file://localhost/c%3a/"
            return ~(volumeSeparatorEnd + 1)
          }
          if (volumeSeparatorEnd === path.length) {
            // URL: "file:///c:", "file://localhost/c:", "file:///c$3a", "file://localhost/c%3a"
            // but not "file:///c:d" or "file:///c%3ad"
            return ~volumeSeparatorEnd
          }
        }
      }
      return ~(authorityEnd + 1) // URL: "file://server/", "http://server/"
    }
    return ~path.length // URL: "file://server", "http://server"
  }
  // Relative
  return 0
}

function getFileUrlVolumeSeparatorEnd(url: string, start: number) {
  const ch0 = url.charCodeAt(start)
  if (ch0 === CharCode.Colon) return start + 1
  if (ch0 === CharCode.Percent && url.charCodeAt(start + 1) === CharCode._3) {
    const ch2 = url.charCodeAt(start + 2)
    if (ch2 === CharCode.a || ch2 === CharCode.A) return start + 3
  }
  return -1
}

export function getNormalizedAbsolutePath(
  fileName: string,
  currentDir: string | undefined,
) {
  return getPathFromPathComponents(
    getNormalizedPathComponents(fileName, currentDir),
  )
}

/**
 * Parse a path into an array containing a root component (at index 0) and zero or more path
 * components (at indices > 0). The result is normalized.
 * If the path is relative, the root component is `""`.
 * If the path is absolute, the root component includes the first path separator (`/`).
 *
 * ```ts
 * getNormalizedPathComponents("to/dir/../file.ext", "/path/") === ["/", "path", "to", "file.ext"]
 * ```
 */
export function getNormalizedPathComponents(
  path: string,
  currentDir: string | undefined,
) {
  return reducePathComponents(getPathComponents(path, currentDir))
}

/**
 * Determines whether a path has a trailing separator (`/` or `\\`).
 */
export function hasTrailingDirSeparator(path: string) {
  return path.length > 0 && isDirSeparator(path.charCodeAt(path.length - 1))
}

export function hasExt(fileName: string): boolean {
  return getBaseFileName(fileName).includes('.')
}

export function isNodeModulesDirectory(dirPath: string) {
  return dirPath.endsWith('/node_modules')
}

/**
 * Returns the last element of an array if non-empty, `undefined` otherwise.
 */
export function lastOrUndefined<T>(array: T[]): T | undefined {
  return array.length === 0 ? undefined : array[array.length - 1]
}

function pathComponents(path: string, rootLength: number) {
  const root = path.substring(0, rootLength)
  const rest = path.substring(rootLength).split(seperator.dir)
  if (rest.length && !lastOrUndefined(rest)) rest.pop()
  return [root, ...rest]
}

/**
 * Parse a path into an array containing a root component (at index 0) and zero or more path components (at indices > 0). The result is not normalized.
 * If the path is relative, the root component is `""`.
 * If the path is absolute, the root component includes the first path separator (`/`).
 * ```ts
 * // POSIX
 * getPathComponents("/path/to/file.ext") === ["/", "path", "to", "file.ext"]
 * getPathComponents("/path/to/") === ["/", "path", "to"]
 * getPathComponents("/") === ["/"]
 * // DOS
 * getPathComponents("c:/path/to/file.ext") === ["c:/", "path", "to", "file.ext"]
 * getPathComponents("c:/path/to/") === ["c:/", "path", "to"]
 * getPathComponents("c:/") === ["c:/"]
 * getPathComponents("c:") === ["c:"]
 * // URL
 * getPathComponents("http://typescriptlang.org/path/to/file.ext") === ["http://typescriptlang.org/", "path", "to", "file.ext"]
 * getPathComponents("http://typescriptlang.org/path/to/") === ["http://typescriptlang.org/", "path", "to"]
 * getPathComponents("http://typescriptlang.org/") === ["http://typescriptlang.org/"]
 * getPathComponents("http://typescriptlang.org") === ["http://typescriptlang.org"]
 * getPathComponents("file://server/path/to/file.ext") === ["file://server/", "path", "to", "file.ext"]
 * getPathComponents("file://server/path/to/") === ["file://server/", "path", "to"]
 * getPathComponents("file://server/") === ["file://server/"]
 * getPathComponents("file://server") === ["file://server"]
 * getPathComponents("file:///path/to/file.ext") === ["file:///", "path", "to", "file.ext"]
 * getPathComponents("file:///path/to/") === ["file:///", "path", "to"]
 * getPathComponents("file:///") === ["file:///"]
 * getPathComponents("file://") === ["file://"]
 */
export function getPathComponents(path: string, currentDir = '') {
  path = combine(currentDir, path)
  return pathComponents(path, getRootLength(path))
}

export function getPathComponentsRelativeTo(
  from: string,
  to: string,
  stringEqComparer: (a: string, b: string) => boolean,
  getCanonicalFileName: (fileName: string) => string,
) {
  const fromComponents = reducePathComponents(getPathComponents(from))
  const toComponents = reducePathComponents(getPathComponents(to))
  let start: number
  for (
    start = 0;
    start < fromComponents.length && start < toComponents.length;
    start++
  ) {
    const fromComponent = getCanonicalFileName(fromComponents[start])
    const toComponent = getCanonicalFileName(toComponents[start])
    const comparer =
      start === 0 ? fp.equateStringsCaseInsensitive : stringEqComparer
    if (!comparer(fromComponent, toComponent)) break
  }

  if (start === 0) return toComponents

  const components = toComponents.slice(start)
  const relative: string[] = []
  for (; start < fromComponents.length; start++) relative.push('..')
  return ['', ...relative, ...components]
}

function getPathWithoutRoot(pathComponents: string[]) {
  if (pathComponents.length === 0) return ''
  return pathComponents.slice(1).join(seperator.dir)
}

/**
 * Formats a parsed path consisting of a root component (at index 0) and zero or more path
 * segments (at indices > 0).
 *
 * ```ts
 * getPathFromPathComponents(["/", "path", "to", "file.ext"]) === "/path/to/file.ext"
 * ```
 */
export function getPathFromPathComponents(pathComponents: string[]) {
  if (pathComponents.length === 0) return ''
  const root =
    pathComponents[0] && ensureTrailingDirSeparator(pathComponents[0])
  return root + pathComponents.slice(1).join(seperator.dir)
}

/**
 * Gets a relative path that can be used to traverse between `from` and `to`.
 */
export function getRelativePathFromDirectory(
  from: string,
  to: string,
  ignoreCase: boolean,
): string
/**
 * Gets a relative path that can be used to traverse between `from` and `to`.
 */
export function getRelativePathFromDirectory(
  fromDirectory: string,
  to: string,
  getCanonicalFileName: (fileName: string) => string,
): string // eslint-disable-line @typescript-eslint/unified-signatures
export function getRelativePathFromDirectory(
  fromDirectory: string,
  to: string,
  getCanonicalFileNameOrIgnoreCase: ((fileName: string) => string) | boolean,
) {
  if (getRootLength(fromDirectory) <= 0 || getRootLength(to) <= 0) {
    throw new Error('Paths must either both be absolute or both be relative')
  }
  const getCanonicalFileName = is.fnc(getCanonicalFileNameOrIgnoreCase)
    ? getCanonicalFileNameOrIgnoreCase
    : fp.identity
  const ignoreCase = is.bool(getCanonicalFileNameOrIgnoreCase)
    ? getCanonicalFileNameOrIgnoreCase
    : false
  const pathComponents = getPathComponentsRelativeTo(
    fromDirectory,
    to,
    ignoreCase
      ? fp.equateStringsCaseInsensitive
      : fp.equateStringsCaseSensitive,
    getCanonicalFileName,
  )
  return getPathFromPathComponents(pathComponents)
}

export function getRelativePathFromFile(
  from: string,
  to: string,
  getCanonicalFileName: (fileName: string) => string,
) {
  return ensurePathIsNonModuleName(
    getRelativePathFromDirectory(
      getDirectoryPath(from),
      to,
      getCanonicalFileName,
    ),
  )
}

export function getRelativePathToDirectoryOrUrl(
  directoryPathOrUrl: string,
  relativeOrAbsolutePath: string,
  currentDir: string,
  getCanonicalFileName: (fileName: string) => string,
  isAbsolutePathAnUrl: boolean,
) {
  const pathComponents = getPathComponentsRelativeTo(
    resolvePath(currentDir, directoryPathOrUrl),
    resolvePath(currentDir, relativeOrAbsolutePath),
    fp.equateStringsCaseSensitive,
    getCanonicalFileName,
  )

  const firstComponent = pathComponents[0]
  if (isAbsolutePathAnUrl && isRootedDiskPath(firstComponent)) {
    const prefix =
      firstComponent.charAt(0) === seperator.dir ? 'file://' : 'file:///'
    pathComponents[0] = prefix + firstComponent
  }
  return getPathFromPathComponents(pathComponents)
}

/**
 * Returns length of the root part of a path or URL (i.e. length of "/", "x:/", "//server/share/, file:///user/files").
 *
 * For example:
 * ```ts
 * getRootLength("a") === 0                   // ""
 * getRootLength("/") === 1                   // "/"
 * getRootLength("c:") === 2                  // "c:"
 * getRootLength("c:d") === 0                 // ""
 * getRootLength("c:/") === 3                 // "c:/"
 * getRootLength("c:\\") === 3                // "c:\\"
 * getRootLength("//server") === 7            // "//server"
 * getRootLength("//server/share") === 8      // "//server/"
 * getRootLength("\\\\server") === 7          // "\\\\server"
 * getRootLength("\\\\server\\share") === 8   // "\\\\server\\"
 * getRootLength("file:///path") === 8        // "file:///"
 * getRootLength("file:///c:") === 10         // "file:///c:"
 * getRootLength("file:///c:d") === 8         // "file:///"
 * getRootLength("file:///c:/path") === 11    // "file:///c:/"
 * getRootLength("file://server") === 13      // "file://server"
 * getRootLength("file://server/path") === 14 // "file://server/"
 * getRootLength("http://server") === 13      // "http://server"
 * getRootLength("http://server/path") === 14 // "http://server/"
 * ```
 */
export function getRootLength(path: string) {
  const rootLength = getEncodedRootLength(path)
  return rootLength < 0 ? ~rootLength : rootLength
}

export function getStringComparer(ignoreCase?: boolean) {
  return ignoreCase
    ? compareStringsCaseInsensitive
    : compareStringsCaseSensitive
}

/**
 * Determines whether a path starts with an absolute path component (i.e. `/`, `c:/`, `file://`, etc.).
 *
 * ```ts
 * // POSIX
 * isAbsolute("/path/to/file.ext") === true
 * // DOS
 * isAbsolute("c:/path/to/file.ext") === true
 * // URL
 * isAbsolute("file:///path/to/file.ext") === true
 * // Non-absolute
 * isAbsolute("path/to/file.ext") === false
 * isAbsolute("./path/to/file.ext") === false
 * ```
 */
export function isAbsolute(path: string): boolean {
  return getEncodedRootLength(path) !== 0
}

/**
 * Determines whether a path starts with a relative path component (i.e. `.` or `..`).
 */
export function isRelative(path: string): boolean {
  return /^\.\.?($|[\\/])/.test(path)
}

/**
 * Determines whether a path is neither relative nor absolute, e.g. "path/to/file".
 * Also known misleadingly as "non-relative".
 */
export function isBareSpecifier(path: string): boolean {
  return !isAbsolute(path) && !isRelative(path)
}

/**
 * Determines whether a charCode corresponds to `/` or `\`.
 */
export function isDirSeparator(charCode: number): boolean {
  return charCode === CharCode.Slash || charCode === CharCode.Backslash
}

function isVolumeCharacter(charCode: number) {
  return (
    (charCode >= CharCode.a && charCode <= CharCode.z) ||
    (charCode >= CharCode.A && charCode <= CharCode.Z)
  )
}

/**
 * Determines whether a path starts with a URL scheme (e.g. starts with `http://`, `ftp://`, `file://`, etc.).
 */
export function isUrl(path: string) {
  return getEncodedRootLength(path) < 0
}

/**
 * Determines whether a path is an absolute disk path (e.g. starts with `/`, or a dos path
 * like `c:`, `c:\` or `c:/`).
 */
export function isRootedDiskPath(path: string) {
  return getEncodedRootLength(path) > 0
}

export function normalizePath(path: string): string {
  path = normalizeSlashes(path)
  const normalized = getPathFromPathComponents(
    reducePathComponents(getPathComponents(path)),
  )
  return normalized && hasTrailingDirSeparator(path)
    ? ensureTrailingDirSeparator(normalized)
    : normalized
}

export function normalizePathAndParts(path: string): {
  path: string
  parts: string[]
} {
  path = normalizeSlashes(path)
  const [root, ...parts] = reducePathComponents(getPathComponents(path))
  if (parts.length) {
    const joinedParts = root + parts.join(seperator.dir)
    return {
      path: hasTrailingDirSeparator(path)
        ? ensureTrailingDirSeparator(joinedParts)
        : joinedParts,
      parts,
    }
  } else {
    return { path: root, parts }
  }
}

/**
 * Normalize path separators, converting `\` into `/`.
 */
export function normalizeSlashes(path: string): string {
  return path.replace(regex.backslash, seperator.dir)
}

/**
 * Reduce an array of path components to a more simplified path by navigating any
 * `"."` or `".."` entries in the path.
 */
export function reducePathComponents(components: string[]) {
  if (!fp.some(components)) return []
  const reduced = [components[0]]
  for (let i = 1; i < components.length; i++) {
    const component = components[i]
    if (!component) continue
    if (component === '.') continue
    if (component === '..') {
      if (reduced.length > 1) {
        if (reduced[reduced.length - 1] !== '..') {
          reduced.pop()
          continue
        }
      } else if (reduced[0]) continue
    }
    reduced.push(component)
  }
  return reduced
}

/**
 * Combines and resolves paths. If a path is absolute, it replaces any previous path. Any
 * `.` and `..` path components are resolved. Trailing directory separators are preserved.
 *
 * ```ts
 * resolvePath("/path", "to", "file.ext") === "path/to/file.ext"
 * resolvePath("/path", "to", "file.ext/") === "path/to/file.ext/"
 * resolvePath("/path", "dir", "..", "to", "file.ext") === "path/to/file.ext"
 * ```
 */
export function resolvePath(
  path: string,
  ...paths: (string | undefined)[]
): string {
  return normalizeSlashes(
    fp.some(paths) ? combine(path, ...paths) : normalizeSlashes(path),
  )
}

/**
 * Removes a trailing directory separator from a path, if it does not already have one.
 *
 * ```ts
 * removeTrailingDirSeparator("/path/to/file.ext") === "/path/to/file.ext"
 * removeTrailingDirSeparator("/path/to/file.ext/") === "/path/to/file.ext"
 * ```
 */
export function removeTrailingDirSeparator(path: string) {
  if (hasTrailingDirSeparator(path)) {
    return path.substr(0, path.length - 1)
  }
  return path
}

/**
 * Determines whether `fileName` starts with the specified `directoryName` using the provided path canonicalization callback.
 * Comparison is case-sensitive between the canonical paths.
 *
 * Use `contains` if file names are not already reduced and absolute.
 */
export function startsWithDir(
  filename: string,
  dir: string,
  getCanonicalFileName: (filename: string) => string,
): boolean {
  filename = getCanonicalFileName(filename)
  dir = getCanonicalFileName(dir)
  return (
    fp.startsWith(filename, dir + '/') || fp.startsWith(filename, dir + '\\')
  )
}

export function toPath(
  fileName: string,
  basePath: string | undefined,
  getCanonicalFileName: (path: string) => string,
) {
  const nonCanonicalizedPath = isRootedDiskPath(fileName)
    ? normalizePath(fileName)
    : getNormalizedAbsolutePath(fileName, basePath)
  return <string>getCanonicalFileName(nonCanonicalizedPath)
}

function tryGetExtFromPath(
  path: string,
  extension: string,
  stringEqComparer: (a: string, b: string) => boolean,
) {
  if (!extension.startsWith('.')) extension = '.' + extension
  if (
    path.length >= extension.length &&
    path.charCodeAt(path.length - extension.length) === CharCode.Dot
  ) {
    const pathExtension = path.slice(path.length - extension.length)
    if (stringEqComparer(pathExtension, extension)) return pathExtension
  }
}

/**
 * Case insensitive file systems have descripencies in how they handle fp.some characters (eg. turkish Upper case I with dot on top - \u0130)
 * This function is used in places where we want to make file name as a key on these systems
 * It is possible on mac to be able to refer to file name with I with dot on top as a fileName with its lower case form
 * But on windows we cannot. Windows can have fileName with I with dot on top next to its lower case and they can not each be referred with the lowercase forms
 * Technically we would want this function to be platform sepcific as well but
 * our api has till now only taken caseSensitive as the only input and just for fp.some characters we dont want to update API and ensure all customers use those api
 * We could use upper case and we would still need to deal with the descripencies but
 * we want to continue using lower case since in most cases filenames are lowercasewe and wont need any case changes and avoid having to store another string for the key
 * So for this function purpose, we go ahead and assume character I with dot on top it as case sensitive since its very unlikely to use lower case form of that special character
 */
export function toFileNameLowerCase(x: string) {
  return regex.filenameLowerCase.test(x)
    ? x.replace(regex.filenameLowerCase, fp.lowercase)
    : x
}
