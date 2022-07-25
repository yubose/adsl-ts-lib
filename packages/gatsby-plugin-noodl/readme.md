# gatsby-plugin-noodl

## Installation

```bash
npm install --save gatsby-plugin-noodl
```

## Usage

Enter this into your `gatsby-config.js` inside `plugins`:

```js
module.exports = {
  plugins: ['gatsby-plugin-noodl'],
}
```

Alternatively you can provide options to the plugin by passing them into the `options` property:

```js
module.exports = {
  siteMetadata: {
    siteTitle: '',
  },
  plugins: [
    {
      resolve: 'gatsby-plugin-noodl',
      // Default options
      options: {
        assets: './src/resources/assets',
        buildSource: 'remote',
        config: 'www',
        deviceType: 'web',
        ecosEnv: 'test',
        loglevel: 'debug',
        path: '',
        startPage: 'HomePage',
        template: require.resolve('./src/templates/page.tsx'),
        viewport: {
          width: 1024,
          height: 768,
        },
      },
    },
  ],
}
```

## Plugin Options

### `template` (required)

The path to the template page that will be rendering noodl pages

### `assets` (optional)

The path to save downloaded assets to

### `buildSource` (optional, defaults to `"remote"`)

If buildSource is "local" it will build using files locally (using "path" configured above).

If buildSource is "remote" it will build files remotely using the "config" key as the endpoint.

### `config` (optional, defaults to `"aitmed"`)

The config name (example: `'meetd2'`)

Defaults to `aitmed`

### `deviceType` (optional, defaults to `"web"`)

### `ecosEnv` (optional, defaults to `"stable"`)

The eCOS environment. Defaults to `stable`

| Environment | Value      |
| ----------- | ---------- |
| Stable      | `'stable'` |
| Test        | `'test'`   |

### `loglevel`(optional, defaults to `"info"`)

Logging output level.

| Level      | Description                        |
| ---------- | ---------------------------------- |
| `'error'`  | Only log errors                    |
| `'warn'`   | Only log warnings and errors       |
| `'info'`   | Only log info, warnings and errors |
| `'debug'`  | Log everything                     |
| `'silent'` | Disable all logging                |

### `path` (optional)

The path to save yml files to

### `startPage` (optional, defaults to `"HomePage"`)

### `viewport` (optional, defaults to `{ width: 1024, height: 768 }`)

The viewport used to calculate the dimensions for static pages
