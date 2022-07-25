import type { LiteralUnion } from 'type-fest'
import ActionsCache from './cache/ActionsCache'
import ComponentCache from './cache/ComponentCache'
import PageCache from './cache/PageCache'
import PluginCache from './cache/PluginCache'
import RegisterCache from './cache/RegisterCache'
import TransactionCache from './cache/TransactionsCache'
import * as t from './types'

const _actionsCache = new ActionsCache() as ActionsCache &
  Record<
    t.NUIActionGroupedType,
    t.Store.ActionObject<t.NUIActionGroupedType>[]
  > & {
    builtIn: Map<string, t.Store.BuiltInObject[]>
    emit: Map<LiteralUnion<t.NUITrigger, string>, t.Store.ActionObject[]>
    register: Record<string, t.Register.Object[]>
  }

const _componentCache = new ComponentCache()
const _pageCache = new PageCache()
const _pluginCache = new PluginCache()
const _registerCache = new RegisterCache()
const _transactionCache = new TransactionCache()

const _cache = {
  actions: _actionsCache,
  component: _componentCache,
  page: _pageCache,
  plugin: _pluginCache,
  register: _registerCache,
  transactions: _transactionCache,
}

export default _cache
