# [Prettier](https://prettier.io/) Plugin for [Astro](https://astro.build/)

Official Prettier plugin adding support for formatting `.astro` files.

## Installation

First install Prettier and the plugin:

```shell
npm i --save-dev prettier prettier-plugin-astro
```

Then add the plugin to your Prettier configuration:

```js
// .prettierrc.mjs
/** @type {import("prettier").Config} */
export default {
  plugins: ['prettier-plugin-astro'],
};
```

### Recommended configuration

For optimal compatibility with the different package managers and Prettier plugins, we recommend manually specifying the parser to use for Astro files in your Prettier config as shown in the example below:

```js
// .prettierrc.mjs
/** @type {import("prettier").Config} */
export default {
  plugins: ['prettier-plugin-astro'],
  overrides: [
    {
      files: '*.astro',
      options: {
        parser: 'astro',
      },
    },
  ],
};
```

To customize formatting behavior, see the [Configuration](#configuration) section below.

## Using in VS Code

> **Note**
> If you're using [Astro's VS Code extension](https://marketplace.visualstudio.com/items?itemName=astro-build.astro-vscode), Prettier and this plugin are already included. Only follow the guide below to format using Prettier's official extension.

First install the [VS Code Prettier extension](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode) and add the following settings to your VS Code configuration:

```json
{
  "prettier.documentSelectors": ["**/*.astro"],
  "[astro]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  }
}
```

The settings above ensure that VS Code is aware that Prettier can be used for Astro files, and sets Prettier as the default formatter for Astro files.

### Reporting issues

When submitting issues about formatting your `.astro` files in VS Code, please specify which extension you are using to format your files: Astro's own extension or the Prettier extension.

## Configuration

Most [options from Prettier](https://prettier.io/docs/en/options.html) will work with the plugin and can be set in a [configuration file](https://prettier.io/docs/en/configuration.html) or through [CLI flags](https://prettier.io/docs/en/cli.html).

### Astro Allow Shorthand

Set if attributes with the same name as their expression should be formatted to the short form automatically (for example, if enabled `<element name={name} />` will become simply `<element {name} />`)

| Default | CLI Override                     | API Override                  |
| ------- | -------------------------------- | ----------------------------- |
| `false` | `--astro-allow-shorthand <bool>` | `astroAllowShorthand: <bool>` |

### Example `.prettierrc.cjs`

```js
{
  astroAllowShorthand: false;
}
```

## Contributing

Pull requests of any size and any skill level are welcome, no contribution is too small. Changes to the Astro Prettier Plugin are subject to [Astro Governance](https://github.com/withastro/.github/blob/main/GOVERNANCE.md) and should adhere to the [Astro Style Guide](https://github.com/withastro/astro/blob/main/STYLE_GUIDE.md).

See [CONTRIBUTING.md](./CONTRIBUTING.md) for instructions on how to set up your development environment.

## Sponsors

Astro is generously supported by Netlify, Storyblok, and several other amazing organizations.

[❤️ Sponsor Astro! ❤️](https://github.com/withastro/.github/blob/main/FUNDING.md)

<p align="center">
  <a target="_blank" href="https://github.com/sponsors/withastro">
    <img alt="sponsors" src="https://astro.build/sponsors.png">
  </a>
</p>
