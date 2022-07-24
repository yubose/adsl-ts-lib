import { DeviceType, Env, PageComponentUrl, RootConfig } from 'noodl-types'
import { LiteralUnion } from 'type-fest'
import { createPlaceholderReplacer } from './noodl-utils'
import get from 'lodash/get'
import * as c from './constants'
import * as t from './types'
import * as u from './_internal'

class NoodlUtilsParser {
  configVersion(
    configObject: RootConfig,
    deviceType: LiteralUnion<DeviceType, string>,
    env: Env,
  ) {
    return get(configObject, [deviceType, 'cadlVersion', env])
  }

  appConfigUrl(
    rootConfig: RootConfig,
    deviceType: LiteralUnion<DeviceType, string>,
    env: Env,
  ): string
  appConfigUrl(baseUrl: string, cadlMain: string, configVersion: string): string
  appConfigUrl(
    baseUrl: string | RootConfig,
    cadlMain?: LiteralUnion<'cadlEndpoint.yml' | DeviceType, string>,
    env?: LiteralUnion<Env, string>,
  ) {
    if (u.isStr(baseUrl)) {
      if (arguments.length < 2) {
        throw new Error(`cadlMain is required when passing in the baseUrl`)
      }
      return (
        createPlaceholderReplacer('\\${cadlVersion}', 'gi')(
          baseUrl || '',
          env || '',
        ) + cadlMain
      )
    }

    if (u.isObj(baseUrl)) {
      if (arguments.length < 3) {
        throw new Error(
          `Both the deviceType and env is required when passing in the root ` +
            `config object`,
        )
      }

      const deviceType = (
        c.deviceTypes.includes(cadlMain as DeviceType) ? cadlMain : 'web'
      ) as DeviceType

      const configVersion = this.configVersion(baseUrl, deviceType, env as Env)

      const endpointFile = baseUrl.cadlMain || ''

      return (
        createPlaceholderReplacer('\\${cadlVersion}', 'gi')(
          baseUrl.cadlBaseUrl || '',
          configVersion,
        ) + endpointFile
      )
    }

    return u.isStr(baseUrl) ? baseUrl : ''
  }

  destination(destination: PageComponentUrl): t.ParsedPageComponentUrlObject

  destination(
    destination: string | undefined,
    args: { denoter?: string; duration?: number },
  ): t.ParsedGotoUrlObject

  destination<D extends string | PageComponentUrl>(
    destination: D,
    {
      denoter = '^',
      duration = 350,
    }: { denoter?: string; duration?: number } = {},
  ) {
    const result: t.ParsedGotoUrlObject = {
      destination: '',
      duration,
      id: '',
    }

    function isPageComponentUrl(str = '') {
      const parts = str.split(/(@|#)/)
      if (parts.length !== 5) return false
      const [_, separator1, __, separator2, ___] = parts
      return separator1 === '@' && separator2 === '#'
    }

    if (u.isStr(destination)) {
      // e.g: "TestSearch@TestTypePage#iframeTag"
      if (isPageComponentUrl(destination)) {
        const [targetPage = '', _, currentPage = '', __, viewTag = ''] =
          destination.split(/(@|#)/)
        return { targetPage, currentPage, viewTag }
      }
      //
      else if (destination.includes(denoter)) {
        const denoterIndex = destination.indexOf(denoter)
        result.isSamePage = denoterIndex === 0
        // "^SignIn"
        if (result.isSamePage) {
          result.destination = ''
          result.id = destination.replace(denoter, '')
        }
        // "SignIn^redTag"
        else {
          const parts = destination.split(denoter)[1]?.split(';')
          let propKey = ''
          let serialized = parts?.[1] || ''
          if (serialized.startsWith(';')) {
            serialized = serialized.replace(';', '')
          }
          result.id = parts?.[0] || ''
          result.destination = destination.substring(0, denoterIndex)
          serialized
            .split(':')
            .forEach((v, index) =>
              index % 2 === 1
                ? (result[propKey] = v)
                : index % 2 === 0
                ? (propKey = v)
                : undefined,
            )
        }
      }
      // "SignIn"
      else {
        result.destination = destination
        result.isSamePage = false
      }
    } else {
      result.destination = ''
    }
    return result
  }

  /**
   * Parses a NOODL destination, commonly received from goto
   * or pageJump actions as a string. The return value (for now) is
   * intended to be directly assigned to page.pageUrl (subject to change)
   * The target string to analyze here is the "destination" which might come
   * in various forms such as:
   *    GotoViewTag#redTag
   *
   * @param { string } pageUrl - Current page url (should be page.pageUrl from the Page instance)
   * @param { string } options.destination - Destination
   * @param { string } options.startPage
   */
  queryString({
    destination = '',
    pageUrl = '',
    startPage = '',
  }: {
    destination: string
    pageUrl: string
    startPage?: string
  }) {
    const base = 'index.html?'
    pageUrl = pageUrl.indexOf(base) !== -1 ? pageUrl : pageUrl + base
    let separator = pageUrl.endsWith('?') ? '' : '-'
    if (destination !== startPage) {
      const questionMarkIndex = pageUrl.indexOf(`?${destination}`)
      const hyphenIndex = pageUrl.indexOf(`-${destination}`)
      if (questionMarkIndex !== -1) {
        pageUrl = pageUrl.substring(0, questionMarkIndex + 1)
        separator = pageUrl.endsWith('?') ? '' : '-'
      } else if (hyphenIndex !== -1) {
        pageUrl = pageUrl.substring(0, hyphenIndex)
        separator = pageUrl.endsWith('?') ? '' : '-'
      }
      pageUrl += `${separator}${destination}`
    } else {
      pageUrl = base
    }
    return pageUrl
  }
}

export default NoodlUtilsParser
