import html from './html.mjs';
import ruby from './ruby.mjs';
import './javascript.mjs';
import './css.mjs';
import './xml.mjs';
import './java.mjs';
import './sql.mjs';
import './c.mjs';
import './shellscript.mjs';
import './lua.mjs';

const lang = Object.freeze({ "fileTypes": ["erb", "rhtml", "html.erb"], "injections": { "text.html.erb - (meta.embedded.block.erb | meta.embedded.line.erb | comment)": { "patterns": [{ "begin": "(^\\s*)(?=<%+#(?![^%]*%>))", "beginCaptures": { "0": { "name": "punctuation.whitespace.comment.leading.erb" } }, "end": "(?!\\G)(\\s*$\\n)?", "endCaptures": { "0": { "name": "punctuation.whitespace.comment.trailing.erb" } }, "patterns": [{ "include": "#comment" }] }, { "begin": "(^\\s*)(?=<%(?![^%]*%>))", "beginCaptures": { "0": { "name": "punctuation.whitespace.embedded.leading.erb" } }, "end": "(?!\\G)(\\s*$\\n)?", "endCaptures": { "0": { "name": "punctuation.whitespace.embedded.trailing.erb" } }, "patterns": [{ "include": "#tags" }] }, { "include": "#comment" }, { "include": "#tags" }] } }, "keyEquivalent": "^~H", "name": "erb", "patterns": [{ "include": "text.html.basic" }], "repository": { "comment": { "patterns": [{ "begin": "<%+#", "beginCaptures": { "0": { "name": "punctuation.definition.comment.begin.erb" } }, "end": "%>", "endCaptures": { "0": { "name": "punctuation.definition.comment.end.erb" } }, "name": "comment.block.erb" }] }, "tags": { "patterns": [{ "begin": "<%+(?!>)[-=]?(?![^%]*%>)", "beginCaptures": { "0": { "name": "punctuation.section.embedded.begin.erb" } }, "contentName": "source.ruby", "end": "(-?%)>", "endCaptures": { "0": { "name": "punctuation.section.embedded.end.erb" }, "1": { "name": "source.ruby" } }, "name": "meta.embedded.block.erb", "patterns": [{ "captures": { "1": { "name": "punctuation.definition.comment.erb" } }, "match": "(#).*?(?=-?%>)", "name": "comment.line.number-sign.erb" }, { "include": "source.ruby" }] }, { "begin": "<%+(?!>)[-=]?", "beginCaptures": { "0": { "name": "punctuation.section.embedded.begin.erb" } }, "contentName": "source.ruby", "end": "(-?%)>", "endCaptures": { "0": { "name": "punctuation.section.embedded.end.erb" }, "1": { "name": "source.ruby" } }, "name": "meta.embedded.line.erb", "patterns": [{ "captures": { "1": { "name": "punctuation.definition.comment.erb" } }, "match": "(#).*?(?=-?%>)", "name": "comment.line.number-sign.erb" }, { "include": "source.ruby" }] }] } }, "scopeName": "text.html.erb", "uuid": "13FF9439-15D0-4E74-9A8E-83ABF0BAA5E7", "displayName": "ERB", "embeddedLangs": ["html", "ruby"] });
var erb = [
  ...html,
  ...ruby,
  lang
];

export { erb as default };
