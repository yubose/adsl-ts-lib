import { ValidatorType } from '../constants'

function translateDiagnosticType(
  type: ValidatorType | 'error' | 'info' | 'warn',
) {
  switch (type) {
    case 9000:
      return 'error'
    case 9001:
      return 'warn'
    case 9002:
      return 'info'
    default:
      return 'info'
  }
}

export default translateDiagnosticType
