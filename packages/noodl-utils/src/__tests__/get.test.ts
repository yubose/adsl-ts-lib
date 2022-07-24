import * as u from '@jsmanifest/utils'
import chalk from 'chalk'
import sinon from 'sinon'
import { isActionChain } from 'noodl-action-chain'
import { userEvent } from 'noodl-types'
import { expect } from 'chai'
import createGet, { Options, PathItem } from '../get'
import * as c from '../constants'
import * as t from '../types'

let root: Record<string, any>
let get: (path: PathItem | PathItem[]) => any

function getRoot() {
  return root
}

beforeEach(() => {
  console.clear()
  root = {
    get Cereal() {
      const ifObject = {
        if: [() => {}, '.Donut.thumbnail', '.HelloPage.icon'],
      }
      return {
        data: {
          thumbnail: '.Tiger.thumbnails.0.src',
        },
        components: [
          {
            type: 'view',
            style: { shadow: 'true' },
            children: [
              { type: 'image', path: ifObject },
              {
                type: 'page',
                path: 'Tiger',
                style: {
                  shadow: 'true',
                  width: '0.2',
                  top: '0.1',
                },
              },
            ],
          },
        ],
      }
    },
    Forest: {
      key: '.Cereal.data.thumbnail',
      formData: {
        profile: '..profile',
      },
      Stars: 5,
      profile: {
        user: {
          firstName: '..currentFirstName',
          lastName: '..currentLastName',
          email: '..currentEmail',
          otherNames: ['mike', 'luke'],
        },
      },
      currentFirstName: 'henry',
      currentLastName: 'Gonzalez',
      currentEmail: 'henry@gmail.com',
    },
    get Tiger() {
      const iteratorVar = 'pencil'
      const listObject = [
        { key: 'Gender', value: 'Male' },
        { key: 'Gender', value: 'Female' },
        { key: 'Gender', value: 'Other' },
      ]
      return {
        icon: 'edit.svg',
        thumbnails: [{ src: 'password.jpg' }],
        components: [
          {
            type: 'view',
            children: [
              {
                type: 'list',
                contentType: 'listObject',
                listObject,
                iteratorVar,
                children: [
                  {
                    type: 'listItem',
                    [iteratorVar]: '',
                    children: [
                      { type: 'label', dataKey: 'pencil.key' },
                      { type: 'select', options: `${iteratorVar}.doc` } as any,
                      { type: 'textField', dataKey: 'pencil.value' },
                    ],
                  },
                ],
              },
            ],
          },
          {
            type: 'button',
            text: 'Submit',
            onClick: [
              { emit: { dataKey: {}, actions: [{}, {}, {}] } },
              { actionType: 'evalObject' },
              { goto: 'Abc' },
            ],
          },
        ],
      }
    },
  }
  get = createGet({ root: getRoot, rootKey: 'Forest' })
})

describe(chalk.keyword('navajowhite')('getValue'), () => {
  it(`should always return the reference if it encounters one`, () => {
    expect(
      getValue(getRoot().Forest, '..formData.profile.user.email'.split('.')),
    ).to.have.property('currentValue', '..profile')
    expect(
      getValue(getRoot(), 'Forest.formData.profile.user.email'.split('.')),
    ).to.have.property('currentValue', '..profile')
  })

  it(`should return the currentValue as the value being returned`, () => {
    expect(
      getValue(getRoot().Forest, '..formData.profile.user.email'.split('.')),
    ).to.have.property('currentValue', '..profile')
    expect(
      getValue(getRoot(), 'Forest.formData.profile.user.email'.split('.')),
    ).to.have.property('currentValue', '..profile')
  })

  it(`should return the currentKey as the key to the value being returned`, () => {
    expect(
      getValue(getRoot().Forest, '..formData.profile.user.email'.split('.')),
    ).to.have.property('currentKey', 'profile')
    expect(
      getValue(getRoot(), 'Forest.formData.profile.user.email'.split('.')),
    ).to.have.property('currentKey', 'profile')
  })

  it(`should return the currentPath as the path to the value being returned`, () => {
    expect(
      getValue(getRoot().Forest, '..formData.profile.user.email'.split('.')),
    )
      .to.have.property('currentPath')
      .to.deep.eq(['formData', 'profile'])
    expect(getValue(getRoot(), 'Forest.formData.profile.user.email'.split('.')))
      .to.have.property('currentPath')
      .to.deep.eq(['Forest', 'formData', 'profile'])
  })

  it(`should return the original path`, () => {
    expect(
      getValue(getRoot().Forest, '..formData.profile.user.email'.split('.')),
    )
      .to.have.property('path')
      .to.eq('formData.profile.user.email')
  })

  it(`should return the lastValue as the previous value before the current value`, () => {
    expect(
      getValue(getRoot().Forest, '..formData.profile.user.email'.split('.')),
    )
      .to.have.property('lastValue')
      .to.deep.eq({ profile: '..profile' })
    expect(getValue(getRoot(), 'Forest.formData.profile.user.email'.split('.')))
      .to.have.property('lastValue')
      .to.deep.eq({
        profile: '..profile',
      })
  })
})

describe(chalk.keyword('navajowhite')('get'), () => {
  it(`should resolve cross references in path order`, () => {
    root = {
      SignIn: {
        formData: { gender: 'Male', profile: '..profile' },
        profile: { user: { email: 'abc@gmail.com' } },
      },
    }
    process.stdout.write('\x1Bc')
    get = createGet({ root, rootKey: 'SignIn' })
    expect(get('.SignIn.formData.profile.user.email')).to.eq(
      root.SignIn.profile.user.email,
    )
    // expect(get('.SignIn.profile.formData.profile.user.email')).to.not.eq(
    // 	root.SignIn.profile.user.email,
    // )
  })

  it(`should be able to retrieve local references`, () => {
    expect(get('..currentFirstName')).to.eq(root.Forest.currentFirstName)
    expect(get('.Forest.formData.profile')).to.deep.eq(root.Forest.profile)
  })

  it(`should be able to retrieve root references`, () => {
    expect(get('.Forest.Stars')).to.eq(root.Forest.Stars)
  })

  it(`should support single dots "." deeply`, () => {
    expect(get('.Forest.formData.profile.user.email')).to.eq('henry@gmail.com')
  })

  it.only(`should be able to deeply retrieve nested cross references`, () => {
    expect(get('.Forest.key')).to.eq('password.jpg')
  })

  it(`should fallback to retrieving locally if starts with double dot and first letter is uppercased`, () => {
    expect(get('..Stars', 'Forest')).to.eq(5)
  })
})
