import * as u from '@jsmanifest/utils'
import * as nc from 'noodl-common'
import * as nt from 'noodl-types'
import sinon from 'sinon'
import { prettyDOM, waitFor } from '@testing-library/dom'
import { expect } from 'chai'
import { flatten, Page as NuiPage, NUI, nuiEmitTransaction } from 'noodl-ui'
import {
  findFirstByClassName,
  findFirstByElementId,
  findFirstByViewTag,
  findFirstByGlobalId,
} from '../utils'
import { ndom, createRender, ui, waitMs } from '../test-utils'
import GlobalComponentRecord from '../global/GlobalComponentRecord'

describe(nc.coolGold(`noodl-ui-dom`), () => {
  describe(nc.italic(`createGlobalRecord`), () => {
    it(`should add the GlobalComponentRecord to the global store`, async () => {
      const { render } = createRender({
        components: [ui.popUpComponent({ global: true })],
      })
      const component = await render()
      const globalId = component.get('data-globalid')
      expect(ndom.global.components.has(globalId)).to.be.true
      expect(ndom.global.components.get(globalId)).to.be.instanceOf(
        GlobalComponentRecord,
      )
    })
  })

  describe(nc.italic(`createPage`), () => {
    it(`should set the base/main "page" property if it is empty`, () => {
      ndom.reset().resync()
      expect(ndom.page).to.be.undefined
      const page = ndom.createPage('')
      expect(ndom.page).to.eq(page)
    })

    it(`should also add to the global store of pages`, () => {
      ndom.reset().resync()
      expect(ndom.page).to.be.undefined
      const page = ndom.createPage('')
      expect(ndom.global.pages[page.id]).to.exist
    })

    describe(`when passing a NuiPage instance`, () => {
      it.skip(
        `should not create a new NOODLDOMPage instance if it already ` +
          `exists, and returns that instance instead`,
        () => {
          const nuiPage = ndom.createPage('SignIn')
          const ndomPage = ndom.createPage(nuiPage)
          const anotherNdomPage = ndom.createPage(nuiPage) as any
          expect(ndomPage === anotherNdomPage).to.be.true
        },
      )
    })
  })

  describe(nc.italic(`draw`), () => {
    it(`should have all components in the component cache`, async () => {
      const rawComponents = [
        ui.list({
          children: [
            ui.listItem({
              children: [
                ui.label({ text: 'red' }),
                ui.textField(),
                ui.label({ text: 'blue' }),
              ],
            }),
          ],
        }),
      ]
      const { ndom, request } = createRender({ components: rawComponents })
      const req = await request('Cereal')
      const flattened = flatten(req?.render()[0])
      flattened.forEach((c) => expect(ndom.cache.component.has(c)).to.be.true)
    })

    describe(`when drawing components with global: true`, () => {
      it(
        `should create a global component object to the global store if it ` +
          `doesn't exist`,
        async () => {
          const pageName = 'Hello'
          const popUpComponentObj = ui.popUpComponent({
            popUpView: 'cerealView',
            global: true,
          })
          const { page, ndom, render } = createRender({
            pageName,
            components: [popUpComponentObj],
          })
          const component = await render()
          const globalId = component?.get('data-globalid')
          const globalObj = ndom.global.components.get(globalId)
          expect(globalId).to.exist
          expect(globalObj).to.exist
          expect(globalObj).to.have.property('globalId', globalId)
          expect(globalObj).to.have.property('componentId', component.id)
          expect(globalObj).to.have.property('pageId', page.id)
          expect(globalObj).to.have.property(
            'nodeId',
            findFirstByGlobalId(globalId).id,
          )
        },
      )

      xit(
        `should replace the previous nodeId with the new one if the new ` +
          `node is referencing the same global id`,
        async () => {
          const { ndom, render } = createRender({
            pageName: 'Abc',
            components: [
              ui.popUpComponent({
                popUpView: 'cerealView',
                global: true,
              }),
            ],
          })
          let component = await render()
          const globalId = component.get('data-globalid')
          const prevNode = findFirstByGlobalId(globalId)
          const globalObject = ndom.global.components.get(
            globalId,
          ) as GlobalComponentRecord
          expect(globalObject.nodeId).to.eq(prevNode.id)
          component = await render('Hello')
          await waitFor(() => {
            const newNode = findFirstByGlobalId(`cerealView`)
            expect(globalObject.nodeId).not.to.eq(prevNode.id)
            expect(globalObject.nodeId).to.eq(newNode.id)
          })
        },
      )

      describe(`when the globalId already exists in the global component store`, () => {
        xit(
          `should replace the previous componentId with the new one if the new ` +
            `component is referencing the same global id`,
          async () => {
            //
          },
        )
      })

      xit(
        `should update the componentId and nodeId in the global object it if ` +
          `drawing the same global component`,
        async () => {
          const globalPopUpComponent = ui.popUpComponent({
            popUpView: 'cerealView',
            global: true,
          })
          const pageName = 'Hello'
          const { page, ndom, request, render } = createRender({
            pageName,
            pageObject: {
              components: [ui.select(), ui.button(), globalPopUpComponent],
            },
          })
          const req = await request()
          const [select, button, popUp] = req.render()
          const globalPopUpNode = findFirstByGlobalId('cerealView')
          const globalRecord = ndom.global.components.get('cerealView')
          expect(document.body.contains(globalPopUpNode)).to.be.true
          expect(globalRecord).to.have.property('componentId', popUp.id)
          expect(globalRecord).to.have.property('nodeId', globalPopUpNode.id)
          page.components = [
            ui.popUpComponent({
              popUpView: 'cerealView',
              global: true,
            }),
          ]
          const newPopUp = await render()
          const newPopUpNode = findFirstByGlobalId('cerealView')
          expect(globalRecord).to.have.property('componentId').not.eq(popUp.id)
          expect(globalRecord)
            .to.have.property('nodeId')
            .not.eq(globalPopUpNode.id)
          expect(globalRecord).to.have.property('componentId').eq(newPopUp.id)
        },
      )

      xit(
        `should remove the old nodes/components from the DOM/cache and replace ` +
          `them with the new one if encountering the same global component object`,
        async () => {
          const globalPopUpComponent = ui.popUpComponent({
            popUpView: 'cerealView',
            global: true,
          })
          const pageName = 'Hello'
          const { page, ndom, request, render } = createRender({
            pageName,
            pageObject: {
              components: [ui.select(), ui.button(), globalPopUpComponent],
            },
          })
          const req = await request()
          const [select, button, popUp] = req.render()
          const globalPopUpNode = findFirstByGlobalId('cerealView')
          expect(document.body.contains(globalPopUpNode)).to.be.true
          expect(ndom.cache.component.has(popUp)).to.be.true
          page.components = [
            ui.popUpComponent({
              popUpView: 'cerealView',
              global: true,
            }),
          ]
          const newPopUp = await render()
          const newPopUpNode = findFirstByGlobalId('cerealView')
          expect(document.body.contains(globalPopUpNode)).to.be.false
          expect(ndom.cache.component.has(popUp)).to.be.false
          expect(document.body.contains(newPopUpNode)).to.be.true
          expect(ndom.cache.component.has(newPopUp)).to.be.true
        },
      )
    })
  })

  describe(nc.italic(`request`), () => {
    xit(
      `should throw if the ${nuiEmitTransaction.REQUEST_PAGE_OBJECT} transaction ` +
        `doesn't exist`,
      async () => {
        const { page, ndom } = createRender({
          components: ui.textField(),
        })
        ndom.reset('transactions')
        return expect(await ndom.request(page)).to.be.rejectedWith(
          /transaction/i,
        )
      },
    )

    it(`should update the previous/page/requesting state correctly`, async () => {
      const pageName = 'Hello'
      const newPage = 'Cereal'
      const { page, ndom } = createRender({
        pageName,
        components: [ui.popUpComponent()],
      })
      expect(page.previous).to.eq('')
      expect(page.requesting).to.eq(pageName)
      expect(page.page).not.to.eq(newPage)
      page.page = newPage
      expect(page.page).to.eq(newPage)
      await ndom.request(page)
      expect(page.previous).to.eq(newPage)
      expect(page.requesting).to.eq('')
      expect(page.page).to.eq(pageName)
    })
  })

  describe(nc.italic(`redraw`), () => {
    xit(`should delete all components involved in the redraw from the component cache`, async () => {
      const rawComponents = [
        ui.list({
          children: [
            ui.listItem({
              children: [
                ui.label({ text: 'red' }),
                ui.textField(),
                ui.label({ text: 'blue' }),
              ],
            }),
          ],
        }),
      ]
      const { getPageObject, ndom, page, request, render } = createRender({
        components: rawComponents,
      })
      page.components = rawComponents
      const req = await request('Hat')
      const list = req?.render()?.[0]
      const listItem = list?.child()
      const label1 = listItem?.child()
      const textField = listItem?.child(1)
      const label2 = listItem?.child(2)
      const components = [list, listItem, label1, textField, label2]
      components.forEach((c) => {
        expect(ndom.cache.component.has(c as any)).to.be.true
      })
    })
  })

  describe(nc.italic(`render`), () => {
    it(`should render noodl components to the DOM`, async () => {
      const { render } = createRender({
        components: [ui.button(), ui.textField(), ui.select(), ui.video()],
      })
      const elemTypes = ['input', 'button', 'select', 'video']
      elemTypes.forEach((t) => {
        expect(document.getElementsByTagName(t)[0]).not.to.exist
      })
      await render()
      await waitFor(() => {
        elemTypes.forEach((t) => {
          expect(document.body.contains(document.getElementsByTagName(t)[0])).to
            .be.true
        })
      })
    })

    it(`should not remove components with global: true`, async () => {
      const { page, ndom } = createRender({
        pageObject: {
          formData: { password: 'hello123' },
          components: [
            ui.button(),
            ui.textField(),
            ui.select(),
            ui.video({ global: true }),
          ],
        },
      })
      const req = await ndom.request(page)
      req?.render()
    })
  })

  describe(`when calling redraw/goto multiple times with multiple page components`, async () => {
    let createRenderProps: ReturnType<typeof createRender>
    let iteratorVar = 'itemObject'
    let listObject: { title: string; pageName: string }[]
    let root: Record<string, any>
    let pages = [
      'ScheduleManagementRoom',
      'PatientInfo',
      'VisitQuestionnaire',
      'MedicalRecords',
    ]

    const INFO_VIEWTAG = 'infoView'
    const PATIENT_INFO_PAGE = 'patientInfoPage'
    const PATIENT_INFO_VIEWTAG = 'patientInfoView'
    const TITLE_VIEWTAG = 'titleView'
    const PROVIDER_LIST_POPUPVIEW = 'ProviderListTag'
    const PROVIDER_DATA_POPUPVIEW = 'ProvidrDataTag'
    const CONTACTS_VIEWTAG_VIEW = 'Contacts'
    const CONTACTS_VIEWTAG_VIEW_CHILD = 'ContactsTag'
    const APPOINTMENT_VIEWTAG = 'appointmentTag'
    const CALENDAR_TABLE_VIEWTAG = 'calenderTableView'

    beforeEach(() => {
      listObject = [
        { title: 'Go to patient info', pageName: 'PatientInfo' },
        { title: 'Go to questionnaire', pageName: 'VisitQuestionnaire' },
        { title: 'Go to medical records', pageName: 'MedicalRecords' },
      ]
      root = {
        ScheduleManagementRoom: {
          [PATIENT_INFO_PAGE]: '',
          formData: {
            appointment: [
              {
                patientName: 'Lisa Tan',
                visitType: 'covid19',
                stime: new Date().toISOString(),
              },
            ],
            pageName: '',
          },
          titleData: listObject,
          providerList: {
            list: {
              doc: [
                {
                  name: {
                    data: {
                      fullName: 'Johnathan Gonzalez',
                      userName: 'abc123',
                    },
                  },
                  ctime: Date.now(),
                },
              ],
            },
          },
          components: [
            ui.view({
              children: [
                ui.popUpComponent({
                  children: [
                    ui.view({ children: [ui.label('Appointment Details')] }),
                    ui.button({
                      text: 'Close',
                      onClick: [ui.popUpDismiss('inviteSuccess')],
                    }),
                  ],
                }),
                ui.view({
                  viewTag: APPOINTMENT_VIEWTAG,
                  children: [
                    ui.view({ children: [ui.label('Room Appointments')] }),
                    ui.view({
                      children: [
                        ui.view({
                          viewTag: 'appointmentLengthTag',
                          children: [
                            ui.label('Appointment Request'),
                            ui.label({ dataKey: 'formData.appointmentLength' }),
                            ui.label('Pending Request'),
                            ui.view({ viewTag: 'imgView' }),
                          ],
                        }),
                        ui.scrollView({
                          children: [
                            ui.list({
                              contentType: 'listObject',
                              iteratorVar,
                              listObject: '..formData.appointment',
                              children: [
                                ui.listItem({
                                  [iteratorVar]: '',
                                  children: [
                                    ui.label({
                                      dataKey: `${iteratorVar}.name.patientName`,
                                      onClick: [
                                        ui.emitObject({
                                          dataKey: { var: iteratorVar },
                                        }),
                                        ui.builtIn({
                                          funcName: 'hide',
                                          viewTag: CALENDAR_TABLE_VIEWTAG,
                                        }),
                                        ui.builtIn({
                                          funcName: 'show',
                                          viewTag: PATIENT_INFO_VIEWTAG,
                                        }),
                                        ui.builtIn({
                                          funcName: 'redraw',
                                          viewTag: PATIENT_INFO_VIEWTAG,
                                        }),
                                        ui.builtIn({
                                          funcName: 'redraw',
                                          viewTag: 'MeetingDocTag',
                                        }),
                                      ],
                                    }),
                                    ui.label({
                                      dataKey: `${iteratorVar}.name.visitType`,
                                    }),
                                    ui.image('schedule.svg'),
                                    // @ts-expect-error
                                    ui.label({
                                      'text=func': (s) => s,
                                      dataKey: `${iteratorVar}.stime`,
                                    }),
                                    ui.image('history.svg'),
                                    // @ts-expect-error
                                    ui.label({
                                      'text=func': (s) => s,
                                      dataKey: `${iteratorVar}.stime`,
                                    }),
                                    ui.label({
                                      text: 'Visit Questionnaire',
                                      onClick: [
                                        ui.popUpDismiss('MeetingDocTag'),
                                        ui.emitObject({
                                          dataKey: { var: iteratorVar },
                                          actions: [],
                                        }),
                                        ui.evalObject({
                                          object: async () => {
                                            try {
                                              getPageObject().patientInfoPage =
                                                'VisitQuestionnaire'
                                            } catch (error) {
                                              console.error(error)
                                              throw error
                                            }
                                          },
                                        }),
                                        ui.builtIn({
                                          funcName: 'hide',
                                          viewTag: CALENDAR_TABLE_VIEWTAG,
                                        }),
                                        ui.builtIn({
                                          funcName: 'show',
                                          viewTag: PATIENT_INFO_VIEWTAG,
                                        }),
                                        ui.builtIn({
                                          funcName: 'redraw',
                                          viewTag: TITLE_VIEWTAG,
                                        }),
                                        ui.builtIn({
                                          funcName: 'redraw',
                                          viewTag: INFO_VIEWTAG,
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
                  ],
                }),
                ui.scrollView({
                  children: [
                    ui.view({}),
                    ui.view({
                      viewTag: PATIENT_INFO_VIEWTAG,
                      children: [
                        ui.label({ dataKey: 'patdInfo.fullName' }),
                        ui.image({
                          path: 'goBack.svg',
                          onClick: [ui.builtIn('show'), ui.builtIn('hide')],
                        }),
                        ui.view({
                          viewTag: TITLE_VIEWTAG,
                          children: [
                            ui.list({
                              contentType: 'listObject',
                              iteratorVar,
                              listObject,
                              children: [
                                ui.listItem({
                                  [iteratorVar]: '',
                                  onClick: [
                                    ui.emitObject({
                                      dataKey: { var: iteratorVar },
                                      actions: ['hello'],
                                    }),
                                    ui.evalObject(),
                                    ui.builtIn({
                                      funcName: 'redraw',
                                      viewTag: TITLE_VIEWTAG,
                                    }),
                                    ui.builtIn({
                                      funcName: 'redraw',
                                      viewTag: INFO_VIEWTAG,
                                    }),
                                  ],
                                  children: [
                                    ui.label({
                                      dataKey: `${iteratorVar}.title`,
                                    }),
                                  ],
                                }),
                              ],
                            }),
                          ],
                        }),
                        ui.view({
                          viewTag: INFO_VIEWTAG,
                          children: [
                            ui.page({
                              path: {
                                if: [
                                  true,
                                  `..${PATIENT_INFO_PAGE}`,
                                  `..${PATIENT_INFO_PAGE}`,
                                ],
                              },
                            }),
                          ],
                        }),
                      ],
                    }),
                  ],
                }),
                ui.popUpComponent({
                  viewTag: PROVIDER_LIST_POPUPVIEW,
                  children: [
                    ui.view({
                      children: [
                        ui.label('Invite'),
                        ui.button({
                          onClick: [
                            ui.popUpDismiss({
                              popUpView: PROVIDER_LIST_POPUPVIEW,
                            }),
                          ],
                        }),
                      ],
                    }),
                    ui.view({
                      viewTag: PROVIDER_DATA_POPUPVIEW,
                      children: [
                        ui.view({
                          children: [
                            ui.textField({ placeholder: 'Search' }),
                            ui.button({ text: 'Search' }),
                          ],
                        }),
                        ui.label('Provider List'),
                        ui.list({
                          contentType: 'listObject',
                          iteratorVar,
                          listObject: '..providerList.list.doc',
                          children: [
                            ui.listItem({
                              onClick: [
                                ui.emitObject({
                                  dataKey: { var: iteratorVar },
                                }),
                                ui.popUpDismiss(PROVIDER_LIST_POPUPVIEW),
                                ui.builtIn({
                                  funcName: 'redraw',
                                  viewTag: 'Next2',
                                }),
                                ui.popUp('Next2'),
                              ],
                            }),
                          ],
                        }),
                      ],
                    }),
                  ],
                }),
                ui.view({
                  viewTag: CONTACTS_VIEWTAG_VIEW,
                  children: [
                    ui.view({
                      children: [
                        ui.label('Invite'),
                        ui.button({
                          text: 'Close',
                          onClick: [ui.popUpDismiss(CONTACTS_VIEWTAG_VIEW)],
                        }),
                      ],
                    }),
                    ui.view({
                      viewTag: CONTACTS_VIEWTAG_VIEW_CHILD,
                      children: [
                        ui.view({
                          children: [ui.textField({ placeholder: 'Search' })],
                        }),
                      ],
                    }),
                  ],
                }),
                ui.label('Patient List'),
              ],
            }),
          ],
        },
        PatientInfo: {
          profile: {
            name: {
              data: {
                birth: '10/09/1985',
                email: 'pfftd@gmail.com',
                fullName: 'Joe Carolina',
                gender: 'Male',
                phone: '+1 8882465555',
              },
            },
          },
          components: [
            ui.view({
              children: [
                ui.view({
                  children: [
                    ui.label('Basic Info'),
                    ui.view({
                      children: [
                        ui.label('Patient Name'),
                        ui.label({ dataKey: 'profile.name.data.fullName' }),
                        ui.label('PhoneNumber'),
                        ui.label({ dataKey: 'profile.name.data.phone' }),
                        ui.label('Date of Birth'),
                        ui.label({ dataKey: 'profile.name.data.birth' }),
                        ui.label('Gender'),
                        ui.label({ dataKey: 'profile.name.data.gender' }),
                        ui.label('Email'),
                        ui.label({ dataKey: 'profile.name.data.email' }),
                        ui.label('Address'),
                        ui.textView({
                          isEditable: false,
                          dataKey: 'profile.name.data.Address.St',
                        }),
                        ui.label('City,State,Zip code'),
                      ],
                    }),
                  ],
                }),
              ],
            }),
          ],
        },
        VisitQuestionnaire: {
          components: [
            ui.view({
              children: [
                ui.view({
                  children: [
                    ui.label("Today's Visit"),
                    ui.scrollView({
                      children: [
                        ui.view({
                          viewTag: 'sunTag',
                          children: [],
                        }),
                      ],
                    }),
                  ],
                }),
              ],
            }),
          ],
        },
        MedicalRecords: {
          formData: { docList: [ui.ecosDoc(), ui.ecosDoc()] },
          components: [
            ui.view({
              children: [
                ui.scrollView({
                  children: [
                    ui.list({
                      contentType: 'listObject',
                      iteratorVar,
                      listObject: '..formData.docList',
                      children: [
                        ui.listItem({
                          [iteratorVar]: '',
                          onClick: [
                            ui.updateObject(),
                            ui.evalObject(),
                            ui.emitObject({
                              dataKey: { var: iteratorVar },
                              actions: [{ if: [true, '', ''] }],
                            }),
                          ],
                          children: [
                            ui.view({
                              children: [
                                ui.label({
                                  dataKey: `${iteratorVar}.name.title`,
                                }),
                                ui.label({
                                  dataKey: `${iteratorVar}.ctime`,
                                }),
                                ui.image('enterIn.svg'),
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
          ],
        },
      }
      createRenderProps = createRender({
        pageName: 'ScheduleManagementRoom',
        root,
      })
      const { nui } = createRenderProps
      nui.use({
        getPages: () => pages,
        builtIn: {
          hide: async (a, o) => {
            const node = findFirstByViewTag(a.original.viewTag)
            node.style.visibility = 'hidden'
            console.info(`[${u.blue('builtIn')} - hide]`, {
              viewTag: a.original.viewTag,
              hidden: node.style.visibility === 'hidden',
            })
          },
          show: async (a, o) => {
            const node = findFirstByViewTag(a.original.viewTag)
            node.style.visibility = 'visible'
            console.info(`[${u.blue('builtIn')} - show]`, {
              viewTag: a.original.viewTag,
              hidden: node.style.visibility === 'hidden',
            })
          },
          redraw: async (a, o) => {
            try {
              console.info(
                `[${u.blue('builtIn')} - redraw]`,
                a.original.viewTag,
              )
              const components = u.reduce(
                [...o.cache.component],
                (acc, obj) =>
                  obj.component.get('data-viewtag') === a.original.viewTag
                    ? acc.concat(obj.component)
                    : acc,
                [],
              )
              await Promise.all(
                components.map(async (c) =>
                  ndom.redraw(findFirstByViewTag(a.original.viewTag), c),
                ),
              )
            } catch (error) {
              console.error(error)
              throw new Error(error)
            }
          },
        },
        emit: {
          onClick: async (a, o) => {
            try {
              if (
                o.component.get('data-key') ===
                `${iteratorVar}.name.patientName`
              ) {
                console.info(
                  `[${u.magenta(
                    'emit',
                  )}] changing "..patientInfoPage" to PatientInfo`,
                )
                root[o.page.page].patientInfoPage = 'PatientInfo'
              } else if (
                o.component.parent.parent.get('data-viewtag') === TITLE_VIEWTAG
              ) {
                console.info(`[${u.magenta('emit')} - ${TITLE_VIEWTAG}] called`)
                root.ScheduleManagementRoom.patientInfoPage =
                  'VisitQuestionnaire'
              }
            } catch (error) {
              console.error(error)
              throw error
            }
          },
        },
        evalObject: async (a, o) => {
          try {
            if (o.context.dataObject.pageName === 'VisitQuestionnaire') {
              getPageObject().patientInfoPage = 'VisitQuestionnaire'
            }
            console.info(`[${u.yellow('evalObject')}]`, o.context)
          } catch (error) {
            console.error(error)
            throw error
          }
        },
      })
      root = nui.getRoot()
    })

    const getPageCount = () => ndom.global.pageIds.length
    const getPageObject = () => root.ScheduleManagementRoom as nt.PageObject
    const getPatientInfoPage = () => getPageObject().patientInfoPage
    const getPageEl = () => findFirstByClassName('page') as HTMLIFrameElement
    const getPageBody = () =>
      (findFirstByClassName('page') as HTMLIFrameElement).contentDocument
        .body as HTMLBodyElement
    const getTitleViewTagEl = () =>
      findFirstByViewTag(TITLE_VIEWTAG) as HTMLElement
    const getInfoViewEl = () => findFirstByViewTag(INFO_VIEWTAG) as HTMLElement
    const getPatientInfoViewTagEl = () =>
      findFirstByViewTag(PATIENT_INFO_VIEWTAG)

    it.skip(`should not set the page component's current page to an empty string`, async () => {
      const { nui, ndom, render } = createRenderProps
      getPageObject().patientInfoPage = 'Tiger'
      const view = await render()
      const pageComponent = nui.cache.component
        .find((o) => o.component.blueprint.viewTag === INFO_VIEWTAG)
        .component.child()
      const nuiPage = pageComponent.get('page') as NuiPage
      const page = ndom.findPage(nuiPage)
      page.page = 'Tiger'
      console.info(page)
      expect(page.page).not.to.eq('')
    })

    xit(
      `should reuse existing page instances and their existing ids ` +
        `for new components in rerenders when providing the NuiPage ` +
        `as args`,
      async () => {
        const { nui, ndom, render } = createRenderProps

        let view = await render()
        let patientInfoViewTagComponent = view.child(2).child(1)
        let titleViewTagComponent = patientInfoViewTagComponent.child(2)
        let titleDataListComponent = titleViewTagComponent.child()
        let [
          patientInfoGotoTitle,
          visitQuestionnaireGotoTitle,
          medicalRecordsGotoTitle,
        ] = titleDataListComponent.children
        let appointmentViewTagComponent = view.child(1)
        let appointmentsListComponent = appointmentViewTagComponent
          .child(1)
          .child(1)
          .child()
        let listItemPatientNameLabelGotoPatientInfo = appointmentsListComponent
          .child()
          .child()
        let listItemVisitQuestionnaireGoto = appointmentsListComponent
          .child()
          .child(6)
        let infoViewTagComponent = patientInfoViewTagComponent.child(3)
        let pageComponent = infoViewTagComponent.child()
        let nuiPage = pageComponent.get('page')
        let ndomPage = ndom.findPage(nuiPage)

        expect(getPageCount()).to.eq(2)

        findFirstByElementId(listItemPatientNameLabelGotoPatientInfo).click()

        await waitFor(() => {
          expect(getPatientInfoPage()).to.eq('PatientInfo')
          expect(getPageBody().children).to.have.length.greaterThan(0)
        })

        expect(getPageCount()).to.eq(2)

        await waitFor(() => {
          let listEl = getTitleViewTagEl().firstElementChild
          expect(listEl).to.have.property('children').length.greaterThan(2)
          ;(
            listEl.querySelectorAll('li').item(1)
              .lastElementChild as HTMLDivElement
          ).click()
        })

        expect(getPageCount()).to.eq(2)

        await waitFor(() => {
          expect(getPatientInfoPage()).to.eq('VisitQuestionnaire')
          expect(findFirstByViewTag('sunTag')).to.exist
        })

        expect(getPageCount()).to.eq(3)

        console.info(
          `[${u.cyan('patientInfoPage')}]: ${u.green(getPatientInfoPage())}`,
        )

        await waitFor(() => {
          root.ScheduleManagementRoom.patientInfoPage = 'PatientInfo'
          findFirstByElementId(listItemVisitQuestionnaireGoto).click()
          expect(getPatientInfoPage()).to.eq('PatientInfo')
        })

        expect(getPageCount()).to.eq(3)

        // console.info(ndom.pages)

        // // findFirstByElementId(visitQuestionnaireGotoTitle).click()
        // // findFirstByElementId(medicalRecordsGotoTitle).click()
        // await delay(100)

        // console.info(prettyDOM())

        // let listEl = findFirstByClassName('list') as HTMLUListElement
        // let pageEl = findFirstByViewTag(INFO_VIEWTAG) as HTMLIFrameElement

        // const { default: path } = await import('path')
        // const { writeJson } = await import('fs-extra')

        // await writeJson(
        //   path.resolve(path.join('src/__tests__/ScheduleManagementRoom.json')),
        //   ndom.pages,
        //   { spaces: 2 },
        // )
      },
    )
  })
})
