# noodl-ui

> React library for NOODL on the client side

[![NPM](https://img.shields.io/npm/v/noodl-ui.svg)](https://www.npmjs.com/package/noodl-ui) [![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com)

## Install

```bash
npm install --save noodl-ui
```

#### Action triggers

- `onClick`

##### Event handler data types (outdated)

- `string`: Provide our own custom function
- `Array`: Provide our own custom function
  - It represents a _chain of actions_
  - Each action in the action chain can have these possible `actionType`s:
    1. `builtIn` - Provide our own function and logic to achieve the goal
    2. `ecosConnection` - Communicating with the eCOS
    3. `pageJump` - Navigating to a page
    4. `updateObject` - Updates the global root object afer receiving its data

#### YAML Document Node Interfaces

| Name                     | TS type                           | YAML Node |
| ------------------------ | --------------------------------- | --------- |
| Action chain (key/value) | { [key: string]: ActionObject[] } | YAMLPair  |
| Action chain             | ActionObject[]                    | YAMLSeq   |
| Action object            | ActionObject                      | YAMLMap   |

#### Custom integrations

- Some components are attached with the prop `data-ux` for UX interactions between the library and web apps

#### Transformations

##### Alignment

```yml
- textAlign: centerX
```

```json
{ "textAlign": "center" }
```
