import * as u from '@jsmanifest/utils'
import ComponentResolver from '../Resolver'
import normalizeProps from '../normalizeProps'
import type { NuiComponent } from '../types'
import log from '../utils/log'

const resolveStyles = new ComponentResolver('resolveStyles')

const getParent = function getParent(
  this: NuiComponent.Instance,
  {
    props = {},
    op,
    opArgs,
  }: Parameters<
    NonNullable<NonNullable<Parameters<typeof normalizeProps>[2]>['getParent']>
  >[0],
) {
  if (props.id) {
    switch (op) {
      case 'traverse': {
        const { depth, ref } = opArgs || {}
        log.log({ depth, ref })

        if (u.isNum(depth)) {
          let parent = this as any
          for (let i = 1; i < depth; i++) {
            parent = parent?.parent
          }
          return parent || null
        }
        if (this.id === props.id) return this.parent?.props
        if (props.id === this.parent?.id) return this.parent?.parent?.props
        const child = this.children.findIndex((ch) => ch?.id === props.id)
        if (child) return this.props
      }
    }
  }
  return this?.parent || null
}

resolveStyles.setResolver(async (component, options, next) => {
  const { context, viewport, getRoot, page, keepVpUnit,getAssetsUrl } = options

  component.edit(
    normalizeProps(component.props, component.blueprint, {
      context,
      getParent: getParent.bind(component),
      keepVpUnit,
      pageName: page?.page,
      root: getRoot(),
      viewport,
      getAssetsUrl
    }),
  )
  // if((component.style.visibility === 'hidden' ||  component.style.display === 'none') && component.children.length>0&&localStorage.getItem('initPageStatus')==='true'){
  //   log.log('test8990',component)
  //   component.removeAllDefaultChild()
  //   component.copyFromChildrenToDefault()
  //   component.children.map(child=>{
  //     component.removeChild(child)
  //   })
  //   log.log('test8991',component)
  // }

  return next?.()
})

export default resolveStyles
