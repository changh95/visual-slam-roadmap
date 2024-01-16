import { parseFrontmatter } from "../content/utils.js";
const markdownContentEntryType = {
  extensions: [".md"],
  async getEntryInfo({ contents }) {
    const parsed = parseFrontmatter(contents);
    return {
      data: parsed.data,
      body: parsed.content,
      slug: parsed.data.slug,
      rawData: parsed.matter
    };
  },
  // We need to handle propagation for Markdown because they support layouts which will bring in styles.
  handlePropagation: true
};
export {
  markdownContentEntryType
};
