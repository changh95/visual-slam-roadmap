import javascript from './javascript.mjs';
import handlebars from './handlebars.mjs';
import './html.mjs';
import './css.mjs';
import './yaml.mjs';

const lang = Object.freeze({ "$schema": "https://raw.githubusercontent.com/martinring/tmlanguage/master/tmlanguage.json", "name": "glimmer-js", "scopeName": "source.gjs", "patterns": [{ "include": "source.js" }], "injections": { "L:source.gjs -comment -string": { "patterns": [{ "name": "meta.js.embeddedTemplateWithoutArgs", "begin": "\\s*(<)(template)\\s*(>)", "beginCaptures": { "1": { "name": "punctuation.definition.tag.html" }, "2": { "name": "entity.name.tag.other.html" }, "3": { "name": "punctuation.definition.tag.html" } }, "end": "(</)(template)(>)", "endCaptures": { "1": { "name": "punctuation.definition.tag.html" }, "2": { "name": "entity.name.tag.other.html" }, "3": { "name": "punctuation.definition.tag.html" } }, "patterns": [{ "include": "text.html.handlebars" }] }, { "name": "meta.js.embeddedTemplateWithArgs", "begin": "(<)(template)", "beginCaptures": { "1": { "name": "punctuation.definition.tag.html" }, "2": { "name": "entity.name.tag.other.html" } }, "end": "(</)(template)(>)", "endCaptures": { "1": { "name": "punctuation.definition.tag.html" }, "2": { "name": "entity.name.tag.other.html" }, "3": { "name": "punctuation.definition.tag.html" } }, "patterns": [{ "begin": "(?<=\\<template)", "end": "(?=\\>)", "patterns": [{ "include": "text.html.handlebars#tag-stuff" }] }, { "begin": "(>)", "beginCaptures": { "1": { "name": "punctuation.definition.tag.end.js" } }, "end": "(?=</template>)", "contentName": "meta.html.embedded.block", "patterns": [{ "include": "text.html.handlebars" }] }] }] } }, "displayName": "Glimmer JS", "aliases": ["gjs"], "embeddedLangs": ["javascript", "handlebars"] });
var glimmerJs = [
  ...javascript,
  ...handlebars,
  lang
];

export { glimmerJs as default };
