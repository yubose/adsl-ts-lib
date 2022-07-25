import { DiagnosticCode } from '../constants'
import { parsePageComponentUrl, toPageComponentUrl } from '../utils/noodl'
import type {
  DiagnosticLevel,
  DiagnosticObjectMessage,
} from './diagnosticsTypes'
import * as is from '../utils/is'

/**
 * Create a diagnostic message object given a DiagnosticLevel and (optionally)  a DiagnosticCode and/or an args object
 * @param type The DiagnosticLevel
 * @param code The DiagnosticCode
 * @param argsOrMessage An args object or a message string
 */
export function createDiagnosticMessage(
  type: DiagnosticLevel,
  code?: DiagnosticCode,
  argsOrMessage?: Record<string, any> | string,
): DiagnosticObjectMessage

/**
 * Create a diagnostic message object given a DiagnosticCode and (optionally) an args object
 * @param code The DiagnosticCode
 * @param argsOrMessage An args object or a message string
 */
export function createDiagnosticMessage(
  code: DiagnosticCode,
  argsOrMessage?: Record<string, any> | string,
): DiagnosticObjectMessage

/**
 * Create a diagnostic message object given a message string, DiagnosticObjectMessage, or an array of either
 * @param message DiagnosticObjectMessage object or message string
 */
export function createDiagnosticMessage(
  message: DiagnosticObjectMessage | string,
): DiagnosticObjectMessage

/**
 * Create a DiagnosticObjectMessage
 * @param typeOrCode
 * @param argsOrCodeOrMsg
 * @param argsOrMsg
 * @returns
 */
export function createDiagnosticMessage(
  typeOrCode:
    | DiagnosticCode
    | DiagnosticLevel
    | DiagnosticObjectMessage
    | string,
  argsOrCodeOrMsg?: DiagnosticCode | Record<string, any> | string,
  argsOrMsg?: Record<string, any> | string,
) {
  if (isDiagnosticLevel(typeOrCode)) {
    if (is.num(argsOrCodeOrMsg)) {
      return {
        type: typeOrCode,
        ...generateDiagnostic(argsOrCodeOrMsg, argsOrMsg),
      }
    }
    return { type: typeOrCode }
  } else if (is.num(typeOrCode)) {
    return { type: 'info', ...generateDiagnostic(typeOrCode, argsOrCodeOrMsg) }
  } else if (is.str(typeOrCode)) {
    return { type: 'info', message: typeOrCode }
  } else if (is.obj(typeOrCode)) {
    return { ...typeOrCode }
  }
  return { type: 'info' }
}

export function generateDiagnostic(code: DiagnosticCode, arg?: any) {
  if (!is.obj(arg)) arg = {}

  function generateMessage(code: DiagnosticCode, arg: any) {
    switch (code) {
      case DiagnosticCode.LOCAL_REF_MISSING_ROOT_KEY:
        return `Encountered a local reference "${arg.ref}" but a page name (rootKey) was not found`
      case DiagnosticCode.ROOT_REF_MISSING_ROOT_KEY:
        return (
          `Attemped to resolved a reference "${arg.ref}" but both rootKey and pageName was empty. ` +
          `No root level object could be retrieved`
        )
      case DiagnosticCode.ROOT_MISSING_ROOT_KEY:
        return `Attemped to resolved a reference "${arg.ref}" but the root object did not have "${arg.rootKey}" as a key`
      case DiagnosticCode.ROOT_VALUE_EMPTY:
        return `The value retrieved using the root key "${arg.rootKey}" was empty`
      case DiagnosticCode.TRAVERSAL_REF_INCOMPLETE_MISSING_KEY:
        return (
          `The reference "${arg.ref}" couldn't be resolved fully. ` +
          `Traversal stopped at "${arg.path.join('.')}" ` +
          `because the object at this iteration did not contain this key`
        )
      case DiagnosticCode.REFERENCE_UNRESOLVABLE:
        return `The reference ${arg.ref} is unresolvable`
      case DiagnosticCode.ROOT_REFERENCE_SECOND_LEVEL_KEY_UPPERCASE:
        return (
          `Root reference ${arg.ref} should not have its second level key ` +
          `"${arg.key}" begin with an uppercase`
        )
      case DiagnosticCode.GOTO_PAGE_MISSING_FROM_APP_CONFIG:
        return (
          `The page/destination "${arg.destination}" ` +
          `was not included in the app config (cadlEndpoint)`
        )
      case DiagnosticCode.GOTO_PAGE_COMPONENT_URL_CURRENT_PAGE_INVALID: {
        const { targetPage, viewTag } = parsePageComponentUrl(arg.destination)
        return `The page component url "${
          arg.destination
        }" does not contain the current page "${
          arg.page
        }". Expected "${toPageComponentUrl(arg.page, targetPage, viewTag)}"`
      }
      case DiagnosticCode.GOTO_PAGE_COMPONENT_URL_TARGET_PAGE_INVALID: {
        const { currentPage, viewTag } = parsePageComponentUrl(arg.destination)
        return `The page component url "${
          arg.destination
        }" does not correctly contain a target page. Expected "${toPageComponentUrl(
          currentPage,
          'TARGET_PAGE',
          viewTag,
        )}"`
      }
      case DiagnosticCode.GOTO_PAGE_COMPONENT_URL_VIEW_TAG_INVALID: {
        const { currentPage, targetPage } = parsePageComponentUrl(
          arg.destination,
        )
        return `The page component url "${
          arg.destination
        }" does not correctly contain a viewTag. Expected "${toPageComponentUrl(
          currentPage,
          targetPage,
          'VIEW_TAG',
        )}"`
      }
      case DiagnosticCode.GOTO_PAGE_EMPTY:
        return `Goto destination is empty`
      case DiagnosticCode.GOTO_PAGE_MISSING_FROM_ROOT:
        return `Page "${arg.page}" is missing from root`
      case DiagnosticCode.VIEW_TAG_INVALID:
        return `Invalid viewTag "${arg.viewTag}"`
      case DiagnosticCode.VIEW_TAG_MISSING_COMPONENT_POINTER:
        return `The viewTag "${arg.viewTag}" does not have a pointer to any components`
      case DiagnosticCode.POPUP_VIEW_INVALID:
        return `Invalid popUpView "${arg.popUpView}"`
      case DiagnosticCode.POPUP_VIEW_MISSING_COMPONENT_POINTER:
        return `The popUpView "${arg.popUpView}" does not have a pointer to any components`
      case DiagnosticCode.BUILTIN_FUNCTION_MISSING:
        return `The builtIn ${arg.key} was not found`
      case DiagnosticCode.BUILTIN_FUNCTION_NOT_A_FUNCTION:
        return `Expected builtIn ${arg.key} to be a function but received "${arg.type}"`

      default:
        throw new Error(`Invalid diagnostic code "${code}"`)
    }
  }

  const message = generateMessage(code, arg)
  if (message) return { code, message }
  return { code }
}

export function isDiagnosticLevel(value: unknown): value is DiagnosticLevel {
  return (
    is.str(value) && (value === 'error' || value === 'info' || value === 'warn')
  )
}

// export function getDiagnosticCodeCoverage() {
//   const covered = [] as DiagnosticCode[]
//   const uncovered = [] as any[]

//   for (const code of Object.keys(DiagnosticCode)) {
//     if (generateDiagnosticMessage(DiagnosticCode[code], undefined)) {
//       covered.push(DiagnosticCode[code])
//     } else {
//       uncovered.push(code)
//     }
//   }

//   return {
//     covered,
//     uncovered,
//     coverage: `${covered.length / uncovered.length}%`,
//   }
// }

// export function convertPropertyName(origName: string): string {
//   let result = origName
//     .split('')
//     .map((char) => {
//       if (char === '*') return '_Asterisk'
//       if (char === '/') return '_Slash'
//       if (char === ':') return '_Colon'
//       return /\w/.test(char) ? char : '_'
//     })
//     .join('')
//   // Get rid of all multi-underscores
//   result = result.replace(/_+/g, '_')
//   // Remove any leading underscore, unless it is followed by a number.
//   result = result.replace(/^_([^\d])/, '$1')
//   // Get rid of all trailing underscores.
//   result = result.replace(/_$/, '')
//   return result
// }
