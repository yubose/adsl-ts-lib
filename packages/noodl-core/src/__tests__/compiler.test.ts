import { expect } from 'chai'
import * as p from '../compiler/path'

describe(`compiler`, () => {
  it(`[combine]`, () => {
    expect(p.combine('path', 'to', 'file.ext')).to.eq('path/to/file.ext')
    expect(p.combine('/path', 'to', 'file.ext')).to.eq('/path/to/file.ext')
    expect(p.combine('../path', 'to', '/', 'file.ext')).to.eq('/file.ext')
    expect(p.combine('path', 'dir', '..', 'to', 'file.ext')).to.eq(
      'path/dir/../to/file.ext',
    )
    expect(p.combine('c:/path', 'to', 'file.ext')).to.eq('c:/path/to/file.ext')
    expect(p.combine('file:///path', 'file:///to', 'file.ext')).to.eq(
      'file:///to/file.ext',
    )
    expect(p.combine('/', 'Volumes', 'B')).to.eq('/Volumes/B')
    expect(p.combine('Volumes', 'B')).to.eq('Volumes/B')
    expect(p.combine('.', 'Volumes', 'B')).to.eq('./Volumes/B')
  })

  it(`[ensureTrailingDirSeparator] should append trailing directory separator`, () => {
    const dir = 'file:\\\\.\\hello.how\\are/you\\.mp4'
    expect(p.ensureTrailingDirSeparator(dir)).to.eq(`${dir}/`)
    expect(p.ensureTrailingDirSeparator(`${dir}/`)).to.eq(`${dir}/`)
  })

  it(`[isUrl] should return true`, () => {
    expect(p.isUrl('http://abc/generated')).to.be.true
    expect(p.isUrl('https://abc/generated')).to.be.true
    expect(p.isUrl('file://abc/generated')).to.be.true
    expect(p.isUrl('ws://abc/generated')).to.be.true
  })

  it(`[isUrl] should return false`, () => {
    expect(p.isUrl('http:/abc/generated')).to.be.false
    expect(p.isUrl('https:abc/generated')).to.be.false
    expect(p.isUrl('/abc/generated')).to.be.false
    expect(p.isUrl('abc/generated')).to.be.false
    expect(p.isUrl('.abc/generated')).to.be.false
    expect(p.isUrl('./abc/generated')).to.be.false
  })

  it(`[normalizeSlashes] should convert backslashes to forward slashes`, () => {
    const fpath = 'file:\\\\.\\hello.how\\are/you\\.mp4'
    const result = 'file://./hello.how/are/you/.mp4'
    expect(p.normalizeSlashes(fpath)).to.eq(result)
  })

  it(`[normalizePath]`, () => {
    expect(p.normalizePath('file://generated')).to.eq('file://generated/')
    expect(p.normalizePath('file:/generated')).to.eq('file:/generated')
    expect(p.normalizePath('file:generated')).to.eq('file:generated')
    expect(p.normalizePath('filegenerated')).to.eq('filegenerated')
    expect(p.normalizePath('.filegenerated')).to.eq('.filegenerated')
    expect(p.normalizePath('./filegenerated')).to.eq('filegenerated')
    expect(p.normalizePath('/filegenerated')).to.eq('/filegenerated')
    expect(p.normalizePath('file:/filegenerated')).to.eq('file:/filegenerated')
    expect(p.normalizePath('file://filegenerated')).to.eq(
      'file://filegenerated/',
    )
    expect(p.normalizePath('file:filegenerated')).to.eq('file:filegenerated')
    expect(p.normalizePath('./filegenerated\\web/js\\scripts/\\.js')).to.eq(
      'filegenerated/web/js/scripts/.js',
    )
  })

  it(`[normalizePathAndParts]`, () => {
    expect(p.normalizePathAndParts('file://generated')).to.deep.eq({
      path: 'file://generated',
      parts: [],
    })
    expect(p.normalizePathAndParts('file:/generated')).to.deep.eq({
      path: 'file:/generated',
      parts: ['file:', 'generated'],
    })
    expect(p.normalizePathAndParts('./generated')).to.deep.eq({
      path: 'generated',
      parts: ['generated'],
    })
    expect(p.normalizePathAndParts('../generated')).to.deep.eq({
      path: '../generated',
      parts: ['..', 'generated'],
    })
    expect(p.normalizePathAndParts('file:../generated')).to.deep.eq({
      path: 'file:../generated',
      parts: ['file:..', 'generated'],
    })
    expect(p.normalizePathAndParts('file:../generated/')).to.deep.eq({
      path: 'file:../generated/',
      parts: ['file:..', 'generated'],
    })
    // expect(p.normalizePathAndParts('file:generated')).to.eq('file:generated')
    // expect(p.normalizePathAndParts('filegenerated')).to.eq('filegenerated')
    // expect(p.normalizePathAndParts('.filegenerated')).to.eq('.filegenerated')
    // expect(p.normalizePathAndParts('./filegenerated')).to.eq('filegenerated')
    // expect(p.normalizePathAndParts('/filegenerated')).to.eq('/filegenerated')
    // expect(p.normalizePathAndParts('file:/filegenerated')).to.eq(
    //   'file:/filegenerated',
    // )
    // expect(p.normalizePathAndParts('file://filegenerated')).to.eq(
    //   'file://filegenerated/',
    // )
    // expect(p.normalizePathAndParts('file:filegenerated')).to.eq(
    //   'file:filegenerated',
    // )
    // expect(
    //   p.normalizePathAndParts('./filegenerated\\web/js\\scripts/\\.js'),
    // ).to.eq('filegenerated/web/js/scripts/.js')
  })
})
