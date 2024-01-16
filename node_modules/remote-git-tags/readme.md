# remote-git-tags [![Build Status](https://travis-ci.org/sindresorhus/remote-git-tags.svg?branch=master)](https://travis-ci.org/sindresorhus/remote-git-tags)

> Get tags from a remote Git repo


## Install

```
$ npm install remote-git-tags
```

The `git` binary must be installed and in your [PATH](https://medium.com/@jalendport/what-exactly-is-your-shell-path-2f076f02deb4).


## Usage

```js
const remoteGitTags = require('remote-git-tags');

(async () => {
	console.log(await remoteGitTags('https://github.com/sindresorhus/remote-git-tags'));
	//=> Map {'v1.0.0' => '69e308412e2a5cffa692951f0274091ef23e0e32', …}
})();
```


## API

### remoteGitTags(repoUrl)

Returns a `Promise<Map<string, string>>` with the Git tags as keys and their commit SHA as values.

#### repoUrl

Type: `string`

URL to the Git repo.
