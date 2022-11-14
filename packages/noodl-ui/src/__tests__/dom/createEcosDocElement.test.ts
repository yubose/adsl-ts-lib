// @ts-nocheck
import * as u from '@jsmanifest/utils'
import m from 'noodl-test-utils'
import { NuiComponent } from 'noodl-ui'
import { waitFor } from '@testing-library/dom'
import { expect } from 'chai'
import { coolGold, italic, white } from 'noodl-common'
import {
  ComponentObject,
  EcosDocComponentObject,
  EcosDocument,
  NameField,
} from 'noodl-types'
import { classes } from '../constants'
import createEcosDocElement from '../utils/createEcosDocElement'
import { nui } from '../nui'
import * as c from '../constants'

async function getEcosDocLoadResult(
  componentObject:
    | NuiComponent.Instance
    | ComponentObject
    | undefined
    | null = m.ecosDocComponent('image'),
  container = document.body,
) {
  return createEcosDocElement(
    container,
    componentObject?.get?.('ecosObj') ||
      componentObject?.blueprint?.['ecosObj'] ||
      componentObject?.['ecosObj'],
  )
}

async function getEcosDocRenderResults<N extends NameField = NameField>({
  ecosObj = m.ecosDoc(),
  component: componentProp = m.ecosDocComponent({
    id: 'hello',
    ecosObj,
  }),
  node = document.createElement('div'),
}: {
  component?: EcosDocComponentObject
  ecosObj?: EcosDocument<N>
  node?: HTMLElement
} = {}) {
  const component = await nui.resolveComponents(componentProp)
  node.id = component.id
  const { iframe } = await getEcosDocLoadResult(component)
  document.body.appendChild(node)
  return {
    componentObject: componentProp,
    component,
    ecosObj,
    node,
    iframe,
  }
}

describe(coolGold(`createEcosDocElement`), () => {
  it(`should create an iframe element`, async () => {
    const { iframe } = await getEcosDocLoadResult()
    expect(iframe).to.have.property('tagName', 'IFRAME')
    expect(iframe).to.be.instanceOf(HTMLIFrameElement)
  })

  describe(italic('Rendering'), () => {
    describe(white(`image documents`), () => {
      it(`should render the image element into its body and set the src`, async () => {
        const customEcosObj = m.ecosDoc({
          name: {
            data: 'blob:https://www.google.com/abc.png',
          },
          subtype: { mediaType: 4 },
        })
        const componentObject = m.ecosDocComponent({
          ecosObj: customEcosObj,
        })
        const { iframe } = await getEcosDocLoadResult(componentObject)
        await waitFor(() => {
          const body = iframe.contentDocument?.body
          expect(body?.classList.contains(c.classes.ECOS_DOC_IMAGE)).to.be.true
          expect(body?.querySelector('img')).to.exist
          expect(body?.querySelector('img')).to.have.property(
            'src',
            customEcosObj.name?.data,
          )
        })
      })
    })

    describe(white(`pdf documents`), () => {
      it(`should render the pdf element into its body and set the src`, async () => {
        const ecosObj = m.ecosDoc('pdf')
        const component = await nui.resolveComponents(m.ecosDocComponent('pdf'))
        const node = document.createElement('div')
        node.id = component.id
        const { iframe } = await getEcosDocLoadResult(component)
        await waitFor(() => {
          expect(ecosObj.name?.data).to.exist
          expect(iframe).to.have.property('src', 'http://127.0.0.1:3000/')
        })
      })
    })

    describe(white(`text documents`), () => {
      describe(white(`plain text`), async () => {
        it(`should show the title and content`, async () => {
          const customEcosObj = m.ecosDoc({
            name: {
              type: 'text/plain',
              title: 'my title',
              content: 'hello123',
            },
            subtype: {
              mediaType: 8,
            },
          })
          const { iframe, node } = await getEcosDocRenderResults({
            component: m.ecosDocComponent({ ecosObj: customEcosObj }),
            ecosObj: customEcosObj,
          })
          await waitFor(() => {
            const body = iframe.contentDocument?.body
            const title = body?.getElementsByClassName(
              classes.ECOS_DOC_TEXT_TITLE,
            )[0]
            const content = body?.getElementsByClassName(
              classes.ECOS_DOC_TEXT_BODY,
            )[0]
            expect(title).to.exist
            expect(content).to.exist
            expect(body?.contains(title as HTMLElement)).to.be.true
            expect(body?.contains(content as HTMLElement)).to.be.true
            expect(title?.textContent).to.match(/my title/i)
            expect(content?.textContent).to.match(/hello123/i)
          })
        })
      })
    })
  })

  describe(italic(`Classes`), () => {
    it(`should attach the class name "${c.classes.ECOS_DOC}" on the iframe`, async () => {
      expect(
        (await getEcosDocLoadResult()).iframe.classList.contains(
          c.classes.ECOS_DOC,
        ),
      ).to.be.true
    })

    describe(white(`image`), () => {
      it(`should attach the class name "${c.classes.ECOS_DOC_IMAGE}"`, async () => {
        const { iframe } = await getEcosDocLoadResult(
          m.ecosDocComponent('image'),
        )
        await waitFor(() => {
          expect(
            iframe.contentDocument?.body?.classList.contains(
              c.classes.ECOS_DOC_IMAGE,
            ),
          ).to.be.true
        })
      })
    })

    describe(white(`note`), () => {
      it(
        `should attach the class name "${c.classes.ECOS_DOC_NOTE}" on note ` +
          `elements`,
        async () => {
          let iframe: HTMLIFrameElement
          iframe = (
            await getEcosDocLoadResult(
              m.ecosDocComponent('note'),
              document.body,
            )
          ).iframe
          await waitFor(() => {
            expect(
              iframe.contentDocument?.getElementsByClassName(
                c.classes.ECOS_DOC_NOTE,
              )[0],
            ).to.exist
          })
        },
      )

      it(
        `should attach the class name "${c.classes.ECOS_DOC_NOTE_DATA}" on ` +
          `note body elements`,
        async () => {
          let loadResult = await getEcosDocLoadResult(
            m.ecosDocComponent('note'),
          )
          await waitFor(() => {
            expect(
              loadResult.iframe.contentDocument?.getElementsByClassName(
                c.classes.ECOS_DOC_NOTE_DATA,
              )[0],
            ).to.exist
          })
        },
      )
    })

    describe(white(`pdf`), () => {
      it(
        `should attach the class name "${c.classes.ECOS_DOC_PDF}" on ` +
          `the iframe`,
        async () => {
          let loadResult = await getEcosDocLoadResult(
            m.ecosDocComponent('pdf'),
            document.body,
          )
          await waitFor(() => {
            expect(loadResult.iframe.classList.contains(c.classes.ECOS_DOC_PDF))
              .to.be.true
          })
        },
      )
    })
  })
})
