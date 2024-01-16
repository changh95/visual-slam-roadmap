### [Prism](https://prismjs.com/)

#### Using directly from the UNPKG CDN

```html
<link rel="stylesheet" href="https://unpkg.com/dracula-prism/dist/css/dracula-prism.css">
```

Or the minified file:

```html
<link rel="stylesheet" href="https://unpkg.com/dracula-prism/dist/css/dracula-prism.min.css">
```

- More info: <https://unpkg.com>

#### With Node or another build system

You can install with the command `npm i dracula-prism` which comes ready with Prismjs installed. 

If you're using Node or Webpack or Rollup or Browserify, etc., simply apply:

```js
require('dracula-prism');
```

#### For React and ReactJS users

You can import simply two libraries:

```js
import Prism from "prism";
import "css/dracula-prism.css";
```

You can get the <a href="https://github.com/dracula/prism/blob/master/test/Test%20%E2%80%93%20React%20with%20Dracula-themed%20Prism.html">sample React code for a website</a> or the <a href="https://github.com/dracula/prism/blob/master/test/src/index.jsx">sample JSX code</a>:

