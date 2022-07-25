import { expect } from 'chai'
import { entries } from '../utils/fp'
import deref from '../deref'

describe.skip(`deref`, () => {
  const listObject = [{ lastUpdated: '..profile.other.lastUpdated' }]
  const getRoot = () => ({
    SignIn: {
      timestamp: 1651849187780,
      formData: { firstName: 'chris', username: 'abc123' },
      profile: {
        username: '..formData.username',
        avatar: { images: [{ url: 'a.png' }, { url: 'logo.png' }] },
        other: { lastUpdated: '__.timestamp' },
      },
      components: [
        { type: 'label', text: 'Your logo: ' },
        { type: 'label', dataKey: '.Topo.logo' },
        {
          type: 'list',
          listObject,
          children: [
            {
              type: 'listItem',
              itemObject: '',
              children: [
                { type: 'label', text: 'Last updated: ' },
                { type: 'label', text: 'itemObject.lastUpdated' },
              ],
            },
          ],
        },
      ],
    },
    Topo: {
      form: '.SignIn.formData',
      logo: '.SignIn.profile.avatar.images.1.url',
    },
  })

  const tests = {
    '.SignIn.timestamp': 1651849187780,
    '=.SignIn.timestamp': 1651849187780,
    '..timestamp': 1651849187780,
    '..form': undefined,
    '=..components.0.text': 'Your logo: ',
    '.Topo.logo': 'logo.png',
    '..components.2.children.0.children.1.text': 1651849187780,
    '..components.1.dataKey': 'logo.png',
  }

  entries(tests).forEach(([ref, expectedResult]) => {
    it(`should deref ${ref}`, () => {
      expect(
        deref({
          dataObject: listObject[0],
          iteratorVar: 'itemObject',
          ref,
          root: getRoot(),
          rootKey: 'SignIn',
        }),
      ).to.eq(expectedResult)
    })
  })
})
