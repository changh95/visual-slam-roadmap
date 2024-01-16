import html from './html.mjs';
import './javascript.mjs';
import './css.mjs';

const lang = Object.freeze({ "name": "jinja-html", "scopeName": "text.html.jinja", "comment": "Jinja HTML Templates", "firstLineMatch": `^{% extends ["'][^"']+["'] %}`, "foldingStartMarker": "(<(?i:(head|table|tr|div|style|script|ul|ol|form|dl))\\b.*?>|{%\\s*(block|filter|for|if|macro|raw))", "foldingStopMarker": "(</(?i:(head|table|tr|div|style|script|ul|ol|form|dl))\\b.*?>|{%\\s*(endblock|endfilter|endfor|endif|endmacro|endraw)\\s*%})", "patterns": [{ "include": "source.jinja" }, { "include": "text.html.basic" }], "displayName": "Jinja", "embeddedLangs": ["html"] });
var jinjaHtml = [
  ...html,
  lang
];

export { jinjaHtml as default };
