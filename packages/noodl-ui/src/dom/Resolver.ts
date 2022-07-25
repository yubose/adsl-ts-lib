import * as u from '@jsmanifest/utils'
import * as nt from 'noodl-types'
import SignaturePad from 'signature_pad'
import type { LiteralUnion } from 'type-fest'
import type { OrArray } from '@jsmanifest/typefest'
import type NDOM from './noodl-ui-dom'
import type NDOMPage from './Page'
import { getPageAncestor } from './utils'
import attributesResolver from './resolvers/attributes'
import componentsResolver from './resolvers/components'
import cache from '../_cache'
import nui from '../noodl-ui'
import * as t from '../types'

export default class NDOMResolver {
  createStyleEditor(component: t.NuiComponent.Instance) {
    function editComponentStyles(
      styles: Record<string, any> | undefined,
      { remove }: { remove?: string | string[] | false } = {},
    ) {
      styles && component?.edit?.(() => ({ style: styles }))
      if (u.isArr(remove)) {
        u.forEach((k) => k && delete component.style[k], remove)
      } else if (remove && u.isStr(remove)) delete component.style[remove]
    }
    return editComponentStyles
  }

  getOptions<
    T extends string = string,
    N extends t.NDOMElement<T> = t.NDOMElement<T>,
  >(
    args: t.Resolve.BaseOptions<T, N> & {
      on?: t.ResolveComponentOptions<any>['on']
      ndom: NDOM
    },
  ) {
    if (nt.Identify.component.canvas(args.component)) {
      args.component.edit(
        'signaturePad',
        new SignaturePad(args.node as HTMLCanvasElement, {
          dotSize: 0.2,
        }),
      )
    }

    return {
      cache,
      component: args.component,
      createPage: args.ndom.createPage.bind(args.ndom) as NDOM['createPage'],
      draw: args.ndom.draw.bind(args.ndom) as NDOM['draw'],
      editStyle: this.createStyleEditor(args.component),
      findPage: args.ndom.findPage.bind(args.ndom) as NDOM['findPage'],
      global: args.ndom.global,
      // @ts-expect-error
      on: args.on || args.ndom.renderState.options.on,
      node: args.node,
      nui,
      get page() {
        return (
          args.page ||
          args.ndom.findPage(getPageAncestor(args.component)?.get?.('page')) ||
          args.ndom.page
        )
      },
      redraw: args.ndom.redraw.bind(args.ndom) as NDOM['redraw'],
      renderPage: args.ndom.render.bind(args.ndom) as NDOM['render'],
      /**
       * REMINDER: This intentionally does not include componentsResolver due to
       * circular references/infinite loops
       */
      get renderState() {
        return args.ndom.renderState as NDOM['renderState']
      },
      resolvers: [
        ...args.ndom.consumerResolvers,
        componentsResolver,
        attributesResolver,
      ],
      elementType: args.node?.tagName || '',
      componentType: (args.component?.type || '') as string,
      setAttr: <K extends keyof t.NDOMElement>(
        k: LiteralUnion<K, string>,
        v: any,
      ) => {
        if (/(innerHTML|innerText|textContent)/i.test(k)) {
          // @ts-expect-error
          args.node[k] = v
        } else {
          args.node?.setAttribute?.(k, v)
        }
      },
      setDataAttr: <K extends string>(
        dataAttr: LiteralUnion<K, string>,
        v: string,
      ) =>
        args.node?.dataset &&
        dataAttr &&
        (args.node.dataset[dataAttr.replace?.('data-', '')] = v),
      setStyleAttr: <K extends keyof t.NDOMElement['style']>(k: K, v: any) =>
        args.node && (args.node.style[k] = v),
      transact: args.ndom.transact.bind(args.ndom) as NDOM['transact'],
    }
  }

  async run<
    T extends string = string,
    N extends t.NDOMElement<T> = t.NDOMElement<T>,
  >({
    on,
    ndom,
    node,
    component,
    page,
    resolvers,
  }: Pick<t.Resolve.BaseOptions<T, N>, 'node' | 'component'> & {
    on?: t.ResolveComponentOptions<any>['on']
    ndom: NDOM
    page?: NDOMPage
    resolvers: OrArray<t.Resolve.Config<T, N>>
  }) {
    const options = this.getOptions({ on, ndom, node, component, page })
    const runners = u.array(resolvers)
    await Promise.all(runners.map((r) => this.resolve(r, options)))
  }

  async resolve<
    T extends string = string,
    N extends t.NDOMElement<T> = t.NDOMElement<T>,
  >(
    config: t.Resolve.Config<T, N>,
    options: ReturnType<NDOMResolver['getOptions']>,
  ) {
    await Promise.all(
      [config.before, config.resolve, config.after].map(
        // @ts-expect-error
        (fn) => fn && this.resolveCond(config.cond, options, fn),
      ),
    )
  }

  async resolveCond(
    cond: t.Resolve.Config['cond'],
    options: ReturnType<NDOMResolver['getOptions']>,
    callback: (options: ReturnType<NDOMResolver['getOptions']>) => void,
  ) {
    if (cond && u.isStr(cond)) {
      // If they passed in a resolver strictly for this node/component
      if (cond === options.component?.type) return callback(options)
    } else if (u.isFnc(cond)) {
      // If they only want the resolver to be called depending on a
      // certain condition
      if (cond(options)) return callback(options)
    } else {
      // Default to calling the resolver in all other cases
      return callback(options)
    }
  }
}
