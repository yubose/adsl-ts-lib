import { Identify, ReferenceString } from 'noodl-types'
import type { NUIActionObjectInput } from '../types'

function isRealRef(value: unknown): value is ReferenceString {
  return (
    typeof value === 'string' &&
    Identify.reference(value) &&
    // These are not really "real" references because they never change in the runtime
    ['=.builtIn', '.Global._nonce@'].every((str) => !value.startsWith(str))
  )
}

function getActionObjectErrors(obj: NUIActionObjectInput | undefined) {
  const results = [] as string[]

  if (Identify.folds.emit(obj)) {
    //
  } else if (Identify.goto(obj)) {
    //
  } else if (Identify.action.any(obj)) {
    if (obj.actionType === 'anonymous') {
      //
    } else if (Identify.action.builtIn(obj)) {
      //
    } else if (Identify.action.evalObject(obj)) {
      if ('object' in obj) {
        if (isRealRef(obj.object)) {
          results.push(
            `Received a string reference "${obj.object}" as the "object" for action "evalObject"`,
          )
        } else if (obj.object !== null && typeof obj.object === 'object') {
          for (const [key, val] of Object.entries(obj.object)) {
            if (isRealRef(key)) {
              results.push(
                `Received a string reference key "${key}" inside evalObject`,
              )
            }
            if (isRealRef(val)) {
              results.push(
                `Received a string reference value "${key}" inside evalObject`,
              )
            }
          }
        }
      }
    } else if (Identify.action.openCamera(obj)) {
      //
    } else if (Identify.action.openDocumentManager(obj)) {
      //
    } else if (Identify.action.openPhotoLibrary(obj)) {
      //
    } else if (Identify.action.pageJump(obj)) {
      //
    } else if (Identify.action.popUp(obj)) {
      //
    } else if (Identify.action.popUpDismiss(obj)) {
      //
    } else if (Identify.action.refresh(obj)) {
      //
    } else if (Identify.action.removeSignature(obj)) {
      //
    } else if (Identify.action.saveObject(obj)) {
      //
    } else if (Identify.action.saveSignature(obj)) {
      //
    } else if (Identify.action.updateObject(obj)) {
      //
    } else if (Identify.action.getLocationAddress(obj)) {
      //
    } else {
      results.push(
        `Encountered an unsupported action object of type "${obj.actionType}". ` +
          `Check typos or letter casings.`,
      )
    }
  }

  return results
}

export default getActionObjectErrors
