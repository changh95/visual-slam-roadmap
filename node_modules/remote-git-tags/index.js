'use strict';
const {promisify} = require('util');
const childProcess = require('child_process');

const execFile = promisify(childProcess.execFile);

module.exports = async repoUrl => {
	const {stdout} = await execFile('git', ['ls-remote', '--tags', repoUrl]);
	const tags = new Map();

	for (const line of stdout.trim().split('\n')) {
		const [hash, tagReference] = line.split('\t');

		// Strip off the indicator of dereferenced tags so we can override the
		// previous entry which points at the tag hash and not the commit hash
		// `refs/tags/v9.6.0^{}` → `v9.6.0`
		const tagName = tagReference.replace(/^refs\/tags\//, '').replace(/\^\{\}$/, '');

		tags.set(tagName, hash);
	}

	return tags;
};
