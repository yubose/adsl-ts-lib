export const defaultConfigHostname = 'public.aitmed.com'

export const configKeySet = 'CONFIG_KEY'
export const rootConfigIsBeingRetrieved = 'RETRIEVING_ROOT_CONFIG'
export const rootConfigRetrieved = 'ROOT_CONFIG_RETRIEVED'
export const rootConfigNotFound = 'ROOT_CONFIG_NOT_FOUND'
export const rootBaseUrlPurged = 'RETRIEVED_ROOT_BASE_URL'
export const configVersionReceived = 'RETRIEVED_CONFIG_VERSION'
export const configVersionSet = 'CONFIG_VERSION'
export const placeholderPurged = 'PLACEHOLDER_PURGED'
export const appBaseUrlPurged = 'PURGED_APP_BASE_URL'
export const appEndpointPurged = 'PURGED_APP_ENDPOINT'
export const appConfigIsBeingRetrieved = 'RETRIEVING_APP_CONFIG'
export const appConfigNotFound = 'APP_CONFIG_NOT_FOUND'
export const appConfigRetrieved = 'RETRIEVED_APP_CONFIG'
export const appConfigParsed = 'PARSED_APP_CONFIG'
export const appPageNotFound = 'APP_PAGE_DOES_NOT_EXIST'
export const appPageRetrieved = 'RETRIEVED_APP_PAGE'
export const appPageRetrieveFailed = 'RETRIEVE_APP_PAGE_FAILED'

export const _id = {
  strategy: Symbol.for(`noodl-loader:strategy`),
} as const
