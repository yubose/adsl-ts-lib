import m from 'noodl-test-utils'
import get from 'lodash/get'
import * as u from '@jsmanifest/utils'
import * as nu from 'noodl-utils'
import * as nt from 'noodl-types'
import type NuiPage from '../Page'
import nui from '../noodl-ui'
import NDOM from '../dom/noodl-ui-dom'
import Viewport from '../Viewport'
import * as c from '../constants'
import * as t from '../types'
import log from './log'

export { nui }

export const baseUrl = 'http://127.0.0.1:3000/'
export const assetsUrl = `${baseUrl}assets/`
export const viewport = new Viewport({ width: 1024, height: 768 })
export const ndom = new NDOM()

export function createOn(
  getRoot = () => ({} as Record<string, Record<string, any>>),
): t.On {
  return {
    // @ts-expect-error
    if: ({ component, page, key, value }) => {
      if (u.isStr(value) && nt.Identify.reference(value)) {
        const datapath = nu.trimReference(value)
        if (nt.Identify.localKey(datapath)) {
          if (page?.page) {
            let value = get(getRoot()?.[page.page], datapath)
            if (nt.Identify.reference(value)) {
            }
          }
        } else {
          return get(getRoot(), datapath)
        }
      }
    },
    reference: (args: any) => {
      const { page, value } = args
      if (nt.Identify.reference(value)) {
        const datapath = nu.trimReference(value)
        if (nt.Identify.localKey(datapath)) {
          if (page?.page) {
            return get(getRoot()?.[page.page], datapath)
          }
        } else {
          return get(getRoot(), datapath)
        }
      }
    },
  }
}

export function createDataKeyReference({
  page = nui.getRootPage(),
  pageName = page.page,
  pageObject,
}: {
  page?: NuiPage
  pageName?: string
  pageObject?: Record<string, any>
}) {
  if (u.isNil(page.viewport.width)) page.viewport.width = 375
  if (u.isNil(page.viewport.height)) page.viewport.height = 667
  pageObject = {
    ...nui.getRoot()[pageName],
    ...pageObject,
  }
  if (page.page !== pageName) page.page = pageName
  const root = { ...nui.getRoot(), [pageName]: pageObject }
  nui.use({ getRoot: () => root })
  return { page }
}

export function getPresetPageObjects(): any {
  const getGenderListObject = () => [
    { key: 'Gender', value: 'Male' },
    { key: 'Gender', value: 'Female' },
    { key: 'Gender', value: 'Other' },
  ]

  return {
    get Cereal() {
      const ifObject = {
        if: [() => {}, '.Donut.thumbnail', '.HelloPage.icon'],
      }
      return {
        data: {
          thumbnail: '.Donut.thumbnail',
        },
        components: [
          m.view({
            style: { shadow: 'true' },
            children: [
              //@ts-ignore
              m.image({ path: ifObject }),
              m.page({
                path: 'Tiger',
                style: {
                  shadow: 'true',
                  width: '0.2',
                  top: '0.1',
                },
              }),
            ],
          }),
        ],
      }
    },
    get Donut() {
      const formData = { password: 'fruits', fullName: 'Mark Twain' }
      return {
        formData,
        thumbnail: 'red.png',
        components: [
          m.view({
            viewTag: 'donutContainer',
            children: [
              m.textField({
                onChange: [
                  m.emitObject({
                    dataKey: 'Donut.formData.password',
                  }),
                ],
              }),
              m.button({
                text: `Go to Donut page`,
                onClick: [m.goto('Donut')],
              }),
              m.divider({ id: 'divider' }),
              m.label({
                text: '..fullName',
              }),
            ],
          }),
        ],
      }
    },
    get Hello() {
      return { formData: { password: 'abc123', components: [] } }
    },
    get Sun() {
      return {
        key: '.Cereal.data.thumbnail',
        formData: {
          profile: {
            user: {
              firstName: 'Henry',
              lastName: 'Gonzalez',
              email: 'henry@gmail.com',
              otherNames: ['mike', 'luke'],
            },
          },
        },
        viewTag: '.Hello.formData.password',
      }
    },
    get Cloud() {
      return {
        mainThumbnail: 'naruto.png',
        messages: [
          {
            text: 'good morning',
            user: 'apple123',
            thumbnail: '...mainThumbnail',
          },
          {
            text: 'it is not morning yet',
            user: 'bob123',
            thumbnail: '.Sun.key',
          },
        ],
      }
    },
    get Tiger() {
      const iteratorVar = 'pencil'
      const listObject = getGenderListObject()
      return {
        icon: 'edit.svg',
        components: [
          m.view({
            children: [
              m.list({
                contentType: 'listObject',
                listObject,
                iteratorVar,
                children: [
                  m.listItem({
                    [iteratorVar]: '',
                    children: [
                      m.label({ dataKey: 'pencil.key' }),
                      m.select({ options: `${iteratorVar}.doc` } as any),
                      m.textField({ dataKey: 'pencil.value' }),
                      m.view({
                        children: [
                          m.button({
                            viewTag: 'updateTag',
                            text: 'Click to update this row',
                            onClick: [
                              m.emitObject(),
                              m.evalObject({
                                // @ts-expect-error
                                object: async () => m.goto('Cloud'),
                              }),
                              m.popUp('abc'),
                              m.builtIn({
                                funcName: 'goto',
                                destination: 'MeetingRoomInvited',
                              }),
                            ],
                          }),
                        ],
                      }),
                    ],
                  }),
                ],
              }),
            ],
          }),
          m.button({
            text: 'Submit',
            onClick: [m.emitObject(), m.evalObject(), m.goto('Abc')],
          }),
          m.textField({ dataKey: `..icon`, placeholder: `Icon URL` }),
        ],
      }
    },
  }
}

export function getDefaultViewportWidthHeight() {
  return { width: 1024, height: 768 }
}

export function getRenderProps(
  opts: {
    clean?: boolean
    pageName?: string
    page?: NuiPage
    root?: Record<string, any>
    viewport?: Viewport | Pick<Viewport, 'width' | 'height'>
  } & Partial<
    Record<
      t.NUITrigger,
      t.Store.ActionObject['fn'] | t.Store.BuiltInObject['fn']
    >
  >,
) {
  let _pageName = opts.pageName
  let _page: NuiPage | undefined
  let _root: Record<string, any> | undefined
  let _viewport = (opts?.viewport || viewport) as Viewport

  if (opts.clean) {
    nui.reset()
    document.head.textContent = ''
    document.body.textContent = ''
  }

  if (opts.page) {
    _page = opts.page
  } else {
    _page = nui.createPage({ viewport: _viewport })
  }

  if (!_pageName && _page.page) _pageName = _page.page
  else if (!_page.page && _pageName) _page.page = _pageName

  if (opts.root) {
    _root = {
      [_page.page]: { components: _page.components },
      ...opts.root,
    }
  } else {
    _root = { [_page.page]: { components: _page.components } }
  }

  log.log({ _viewport })

  if (!_page.viewport) _page.viewport = _viewport
  if (u.isNil(_page.viewport.width) || u.isNil(_page.viewport.height)) {
    _page.viewport.width = _viewport.width
    _page.viewport.height = _viewport.height
  }

  const actionTypes = [
    ...nt.actionTypes,
    'anonymous',
    'emit',
    'goto',
    'getLocationAddress',
  ]

  actionTypes.forEach((actionType) => {
    if (opts[actionType]) {
      nui.use({ [actionType]: opts[actionType] })
    }
  })

  nui.use({
    getAssetsUrl: () => assetsUrl,
    getBaseUrl: () => baseUrl,
    getRoot: () => _root as Record<string, any>,
    getPreloadPages: () => [],
    getPages: () => u.keys(_root || {}),
    transaction: {
      async [c.nuiEmitTransaction.REQUEST_PAGE_OBJECT](page: NuiPage) {
        if (!page.page) throw new Error(`[test-utils] page.page is empty`)
        return _root?.[page?.page]
      },
    },
  })

  return {
    pageName: _page.page,
    page: _page,
    root: _root,
  }
}
