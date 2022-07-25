import * as u from '@jsmanifest/utils'
import { component, EcosDocument, Identify, NameField } from 'noodl-types'
import { classes } from '../constants'
import createTextNode from './createTextNode'

const is = Identify.ecosObj
const getBody = (iframe: HTMLIFrameElement | null) =>
  (iframe?.contentDocument?.body as HTMLBodyElement) || null

export interface CreateEcosDocElementArgs<N extends NameField = NameField> {
  ecosObj: EcosDocument<N>
  width?: number
  height?: number
}

export interface LoadResult {
  event: Event
  iframe: HTMLIFrameElement
  width: number
  height: number
  src: string
  title?: string
}

async function createEcosDocElement<
  N extends NameField = NameField,
  Args extends CreateEcosDocElementArgs<N> = CreateEcosDocElementArgs<N>,
>(container: HTMLElement, opts: Args): Promise<LoadResult>

async function createEcosDocElement<N extends NameField = NameField>(
  container: HTMLElement,
  ecosObj: EcosDocument<N>,
): Promise<LoadResult>

function createEcosDocElement<
  N extends NameField & Record<string, any> = NameField,
>(container: HTMLElement, opts: EcosDocument<N> | CreateEcosDocElementArgs<N>) {
  return new Promise(async (resolve, reject) => {
    const width = Number(container.style.width.replace(/[a-zA-Z]/i, ''))
    const height = Number(container.style.height.replace(/[a-zA-Z]/i, ''))
    const iframe = document.createElement('iframe')
    let iframeContent: any // HTML element, direct child of iframe's contentDocument.body node

    // @ts-expect-error
    let ecosObj: EcosDocument<N> = opts?.ecosObj || opts
    let mimeType = ''

    if (ecosObj?.name?.type) mimeType = ecosObj.name.type

    iframe.classList.add(classes.ECOS_DOC)
    iframe.style.width = '100%'
    iframe.style.height = '100%'
    iframe.style.border = 'none'
    iframe.title = ecosObj?.name?.title || 'eCOS Document'

    if (!is.image(ecosObj)) {
      /** LOADED */
      iframe.onload = async function onLoadEcosDocElement(event) {
        let className = ''
        if (is.doc(ecosObj)) {
          if (/json/i.test(mimeType)) {
            className = classes.ECOS_DOC_NOTE
          } else if (/pdf/i.test(mimeType)) {
            // className added in the render block somewhere below
          }
        } else if (is.text(ecosObj)) {
          if (/css/i.test(mimeType)) {
            className = classes.ECOS_DOC_TEXT_CSS
          } else if (/html/i.test(mimeType)) {
            className = classes.ECOS_DOC_TEXT_HTML
          } else if (/javascript/i.test(mimeType)) {
            className = classes.ECOS_DOC_TEXT_JAVASCRIPT
          } else if (/plain/i.test(mimeType)) {
            className = classes.ECOS_DOC_TEXT_PLAIN
          } else if (/markdown/i.test(mimeType)) {
            className = classes.ECOS_DOC_TEXT_MARKDOWN
          }
        } else if (is.video(ecosObj)) {
          className = classes.ECOS_DOC_VIDEO
        }

        try {
          if (
            // REMINDER: Images aren't running this block.
            // They have their own onload/onerror handlers in their own block
            iframeContent &&
            iframe?.contentDocument?.body &&
            !iframe.contentDocument.body.contains(iframeContent)
          ) {
            getBody(iframe)?.appendChild(iframeContent)
            // TODO - Move this part in their own function somewhere at the end of this file
            getBody(iframe)?.classList?.add(classes.ECOS_DOC_NOTE_DATA)
            // TODO - Move this part in their own function somewhere at the end of this file
            if (/json/i.test(mimeType)) {
              iframeContent.classList.add(classes.ECOS_DOC_NOTE_DATA)
            }
          }
        } catch (error) {
          console.error(error)
        }

        className && getBody(iframe)?.classList.add(className)

        resolve({
          iframe,
          event,
          width,
          height,
          src: ecosObj?.name?.data || '',
          title: ecosObj?.name?.title,
        })
      }

      iframe.addEventListener('error', reject)
    }

    /* -------------------------------------------------------
    ---- IMAGE DOCUMENTS
  -------------------------------------------------------- */
    if (is.image(ecosObj)) {
      iframe.onload = async function (event) {
        if (iframe.contentDocument?.body) {
          try {
            // The result could not be returned
            // const img = await createAsyncImageElement(
            //   iframe.contentDocument.body,
            // )
            const img = document.createElement('img')
            img.src = ecosObj?.name?.data || ''
            img.style.width = '100%'
            img.style.height = '100%'
            iframeContent = img

            getBody(iframe)?.appendChild?.(iframeContent)
            getBody(iframe)?.classList?.add?.(classes.ECOS_DOC_IMAGE)
            resolve({
              iframe,
              event,
              width,
              height,
              src: ecosObj?.name?.data || '',
              title: ecosObj?.name?.title,
            })
          } catch (error) {
            reject(error)
          }
        }
      }
      iframe.addEventListener('error', reject)
    } else if (is.doc(ecosObj)) {
      if (/pdf/i.test(ecosObj.name?.type || '')) {
        iframe.classList.add(classes.ECOS_DOC_PDF)
        /* -------------------------------------------------------
        ---- PDF DOCUMENTS
      -------------------------------------------------------- */
        const url = ecosObj?.name?.data
        if (u.isStr(url)) {
          if (
            url.startsWith('blob') ||
            url.startsWith('data') ||
            url.startsWith('http')
          ) {
            iframe.src = process.env.NODE_ENV === 'test' ? '' : url
          } else {
            console.log(
              `%cThe url is in an unknown format (expected to receive it as ` +
                `one of : "blob:...", "data:...", or "http")`,
              `color:#ec0000;`,
              url,
            )
          }
        } else {
          console.log(
            `%cExpected a URL string as a value for ecosObj.name.data but received "${typeof url}" instead`,
            `color:#ec0000;`,
            url,
          )
        }
      } else if (/json/i.test(ecosObj.name?.type || '')) {
        /* -------------------------------------------------------
      ---- NOTE DOCUMENTS
    -------------------------------------------------------- */
        iframeContent = document.createElement('div')
        if (ecosObj.name?.data) {
          if (u.isStr(ecosObj.name.data) || u.isNum(ecosObj.name.data)) {
            iframe.addEventListener('load', function () {
              if (iframe.contentDocument?.body) {
                if (ecosObj?.name?.data) {
                  if (!iframeContent) {
                    iframeContent = document.createElement('div')
                  }
                  if (
                    !iframeContent.querySelector(
                      `.${classes.ECOS_DOC_NOTE_DATA}`,
                    )
                  ) {
                    iframeContent?.appendChild(
                      createTextNode(ecosObj.name.data, {
                        title: ecosObj.name?.title,
                        name: 'Note',
                        classList: classes.ECOS_DOC_NOTE_DATA,
                      }),
                    )
                  }
                }
              }
            })
          } else {
            console.log(
              `%cExpected a string for a note's "data" but received "${typeof ecosObj
                .name.data}"`,
              `color:#ec0000;`,
              ecosObj,
            )
          }
        } else {
          console.log(
            `%cA note is missing the "data" property. No content will be shown`,
            `color:#ec0000;`,
            component,
          )
        }
      } else {
        throw new Error(
          `Could not handle an unknown ecosObj with mime type "${ecosObj.name?.type}"`,
        )
      }
    } else if (is.text(ecosObj)) {
      /* -------------------------------------------------------
      ---- TEXT DOCUMENTS (HTML/PLAIN/JAVASCRIPT/MARKDOWN/ETC)
    -------------------------------------------------------- */
      iframeContent = document.createElement('div')
      iframeContent.classList.add(classes.ECOS_DOC_TEXT)

      function appendTextNode(label: 'title' | 'content' | 'data') {
        let content = ecosObj?.name?.[label] || ''
        if (
          u.isStr(content) &&
          (content.startsWith('blob:') || content.startsWith('data:'))
        ) {
          const img = document.createElement('img')
          img.title = ecosObj?.name?.title || ''
          img.alt = 'eCOS image'
          img.src = content
          try {
            iframeContent.appendChild(img)
          } catch (error) {
            console.error(error)
          }
        } else {
          try {
            iframeContent.appendChild(
              createTextNode(content, {
                title: label === 'title' ? ecosObj?.name?.[label] : undefined,
                name: label,
                classList:
                  label === 'title'
                    ? classes.ECOS_DOC_TEXT_TITLE
                    : label === 'content'
                    ? classes.ECOS_DOC_TEXT_BODY
                    : label === 'data'
                    ? classes.ECOS_DOC_TEXT_BODY
                    : undefined,
              }),
            )
          } catch (error) {
            console.error(error)
          }
        }
      }

      ecosObj?.name?.title && appendTextNode('title')
      ecosObj?.name?.content && appendTextNode('content')
      ecosObj?.name?.data && appendTextNode('data')

      iframe.addEventListener('load', function () {
        try {
          iframe?.contentDocument?.body?.appendChild?.(iframeContent)
        } catch (error) {
          console.error(error)
        }
      })
    }

    if (iframeContent) {
      iframeContent.style.width = '100%'
      iframeContent.style.height = '100%'
    }

    try {
      container.appendChild(iframe)
    } catch (error) {
      console.error(error)
    }

    return iframe
  })
}

export default createEcosDocElement
