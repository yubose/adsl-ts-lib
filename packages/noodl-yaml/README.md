# `noodl-yaml`

> YAML Bindings for noodl-core

## Dependencies

| Name                | Description                                           |
| ------------------- | ----------------------------------------------------- |
| `noodl-core`        | Core dependency                                       |
| `@jsmanifest/utils` | Lightweight functional programming utilities          |
| `noodl-types`       | `noodl-yaml` uses `noodl-types` for its noodl typings |
| `yaml`              | `noodl-yaml` uses `yaml` to create YAML bindings      |

## Usage

```js
const { Diagnostics } = require('noodl-core')
const { DocRoot, DocVisitor, DocIterator } = require('noodl-yaml')

const root = new DocRoot()
const visitor = new DocVisitor()
const iterator = new DocIterator()
const diagnostics = new Diagnostics()

diagnostics.use(root)
diagnostics.use(visitor)

diagnostics.run().then((results) => {
  console.log(results)
})
```

## Notes

- emitter consumes meta objects
- producer produces meta objects
  - reference meta objects
    - sub references
      - await references
      - eval references
      - merge references
- resolver encapsulates emitter, producer
- loader wraps resolver

### Action chain triggerers

- default: save/use/carry (any)

  - determine data type

- if (object)
- emit (object)
- action objects (object)
- goto (object/string)
- continue (string)
- retrieve (string)
- ..${string}@: ${string} (object)
- set/replace (object)
- abort (string)
