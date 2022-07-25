import * as u from '@jsmanifest/utils'
import nock from 'nock'
import fs from 'fs-extra'
import path from 'path'
import { getMockRoot } from 'mock-fs'
import { actionFactory, componentFactory } from 'noodl-ui-test-utils'

export const defaultBaseUrl = 'http://127.0.0.1:3001/'
export const ui = { ...actionFactory, ...componentFactory }

export function getFixturePath(...paths: string[]) {
  return path.join(process.cwd(), 'src', '__tests__', 'fixtures', ...paths)
}

export function getPathToConfig() {
  return getFixturePath('meetd2.yml')
}

export function getPathToCadlEndpoint() {
  return getFixturePath('cadlEndpoint.yml')
}

export function getPathToBaseCss() {
  return getFixturePath('BaseCSS.yml')
}

export function getPathToBaseDataModel() {
  return getFixturePath('BaseDataModel.yml')
}

export function getPathToBasePage() {
  return getFixturePath('BasePage.yml')
}

export function getPathToSignInPage() {
  return getFixturePath('SignIn.yml')
}

export function getRoot() {
  const root = {
    Cereal: {
      formData: {
        user: {
          firstName: `Bob`,
          lastName: `Le`,
          age: 30,
          email: `bob@gmail.com`,
          nicknames: [`Pizza Guy`, `Tooler`, `Framer`],
        },
      },
    },
    get Tiger() {
      const genders = [
        { key: 'gender', value: 'Female' },
        { key: 'gender', value: 'Male' },
        { key: 'gender', value: 'Unknown' },
      ]
      let iteratorVar = 'itemObject'
      let currentEventName = 'Los Angeles County Fair'
      return {
        genders,
        info: {
          currentEventName,
        },
        components: [
          ui.view({
            children: [
              ui.label({ dataKey: `Cereal.formData.user.firstName` }),
              ui.list({
                iteratorVar,
                contentType: 'listObject',
                children: [
                  ui.listItem({
                    [iteratorVar]: '',
                    children: [
                      ui.label({ dataKey: `${iteratorVar}.value` }),
                      ui.textField({
                        dataKey: `${iteratorVar}.value`,
                        placeholder: `Edit gender`,
                      }),
                      ui.divider(),
                      ui.label(`...currentEventName`),
                      ui.button({
                        text: 'Get ticket',
                        style: {
                          left: '0.12',
                          marginTop: '0.5',
                          width: '0.8',
                          height: '0.09',
                          isHidden: false,
                        },
                      }),
                    ],
                  }),
                ],
              }),
              ui.image({ path: 'abc.png' }),
              ui.video({ path: 'movie.mkv' }),
            ],
          }),
        ],
      }
    },
  }

  return root as Record<string, any> & typeof root
}

export function parseMockedFileSystemRoot(root = getMockRoot()) {
  const files = {} as Record<string, any>

  if (u.isObj(root._items)) {
    for (const [name, value] of u.entries(root._items)) {
      if (u.isObj(value)) {
        if ('_items' in value) {
          files[name] = parseMockedFileSystemRoot(value)
        } else if ('_content' in value) {
          files[name] = value._content
        }
      }
    }
  }

  return files
}

export function proxyPageYmls({
  baseUrl = defaultBaseUrl,
  names = [],
}: {
  baseUrl?: string
  names?:
    | (string | { name: string; content: any })[]
    | string
    | { name: string; content: any }
}) {
  const proxiedRoutes = [] as {
    filename: string
    name: string
    ext: string
    route: string
    content: string
  }[]

  u.array(names).forEach((obj) => {
    let ext = path.extname(u.isObj(obj) ? obj.name : obj)
    if (ext.startsWith('.')) ext = ext.substring(1)
    let name = u.isObj(obj) ? obj.name : obj
    let filename = path.basename(name)
    if (name.endsWith(`.${ext}`)) name = name.substring(0, `.${ext}`.length)
    let route = `/${filename}`
    let content = ''

    if (u.isObj(obj) && obj.content) {
      content = obj.content
    } else if (fs.existsSync(getFixturePath(filename))) {
      content = fs.readFileSync(getFixturePath(filename), 'utf8')
    }

    console.log({ baseUrl, route })
    nock(baseUrl).get(route).reply(200, content)
    proxiedRoutes.push({ filename, name, ext, route, content })
  })

  return proxiedRoutes
}
