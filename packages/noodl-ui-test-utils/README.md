# `noodl-ui-test-utils`

## Installation

```bash
npm install noodl-ui-test-utils
```

## Usage

```js
const ui = require('noodl-ui-test-utils')

const button = ui.button({
  text: 'Submit',
  onClick: [
    ui.builtIn('redraw'),
    ui.goto('SignIn'),
    ui.evalObject({
      object: [],
    }),
  ],
})
```

```json
{
  "type": "button",
  "text": "Submit",
  "onClick": [
    {
      "actionType": "builtIn",
      "funcName": "redraw"
    },
    {
      "goto": "SignIn"
    },
    {
      "actionType": "evalObject",
      "object": []
    }
  ]
}
```
