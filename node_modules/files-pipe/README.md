# [FilesPipe] 🧪

`FilesPipe` allows you to process files in a pipeline, making it easy to perform
various actions on them.

### Installation

To get started with `FilesPipe`, follow these steps:

Install the `FilesPipe` package using npm:

```sh
npm install -D -E files-pipe
```

Create a new pipe instance using the following code in your Index.ts file:

**`Index.ts`**

```ts
import Files from "files-pipe";

await new Files().In("./Input");
```

### Getting started

With `FilesPipe`, you can use the Pipe method to perform actions on files within
the pipe. Here's an example of how to use it in your Index.ts:

**`Index.ts`**

```ts
import Files from "files-pipe";

await (
	await (await new Files().In("./Input")).By("**/*.md")
).Pipe({
	// Append some content to all of the text files
	Wrote: (On) => (On.Buffer += "LICENSE [MIT]"),
});
```

### Default Callbacks

`FilesPipe` provides default callbacks for file processing. These callbacks can
be customized to suit your specific needs. Here are the default callbacks:

```ts
import Files from "files-pipe";

await new Files().Pipe({
	// Reads the file into a buffer
	Read: async (On) => await fs.promises.readFile(On.Input, "utf-8"),

	// Writes the buffer into a file
	Wrote: async (On) => On.Buffer,

	// Checks if the file has passed any checks
	Passed: async (On) => On && true,

	// When the file cannot be processed
	Failed: async (Input) => `Error: Cannot process file ${Input}!`,

	// When the file is processed
	Accomplished: async (On) => `Processed ${On.Input} in ${On.Output}.`,

	// When the whole plan is fulfilled
	Fulfilled: async (Plan) =>
		`Successfully processed a total of ${Plan.Files} ${
			Plan.Files === 1 ? "file" : "files"
		}.`,

	// When the plan has changed
	Changed: async (Plan) => Plan,
});
```

### Adding Multiple Paths

You can add multiple paths to your pipe by specifying an array as the `Path`
variable:

**`Index.ts`**

```ts
import Files from "files-pipe";

await new Files().In(["./Input", "./Input2"]);
```

### Input-Output Mapping

`FilesPipe` allows you to provide a map of paths for different input and output
directories, making it easy to control where files are read from and written to:

**`Index.ts`**

```ts
import Files from "files-pipe";

await new Files().In(new Map([["./Input", "./Output"]]));
```

### File Filtering

You can filter files to exclude specific ones from your `FilesPipe`. Filters can
be an array of regular expressions or a single match. You can also use functions
to match on file names:

**`Index.ts`**

```ts
import Files from "files-pipe";

await new Files().Not([
	"File.txt",
	(File: string) => File === "./Input/File.txt",
]);
```

### Controlling Logging

You can control the logging level by setting the `Logger` parameter. The default
value is `2`, but you can set it to `0` if you don't want to see debug messages:

**`Index.ts`**

```ts
import Files from "files-pipe";

new Files(0);
```

[FilesPipe]: https://npmjs.org/files-pipe

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for a history of changes to this component.
