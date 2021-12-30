import { fetch } from '@sapphire/fetch';
import { blue, bold, yellow } from 'colorette';
import { resolve } from 'node:path';
import { URLSearchParams, fileURLToPath } from 'node:url';
import {
	ClassParser,
	EnumParser,
	FunctionParser,
	InterfaceParser,
	NamespaceParser,
	ProjectParser,
	ReferenceTypeParser,
	TypeAliasParser,
	VariableParser
} from 'typedoc-json-parser';
import { renderOutputFiles } from './renderer/render';
import { removeDirectory } from './renderer/utilities/removeDirectory';
import { writeCategoryYaml } from './renderer/writeCategoryYaml';
import type { PluginOptions } from './types/PluginOptions';
import { RepositoryContentFileType, type RepositoryContent } from './types/RepositoryContent';

const references: Record<string, string> = {
	// MDN
	BigInt64Array: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/BigInt64Array',
	Blob: 'https://developer.mozilla.org/en-US/docs/Web/API/Blob',
	Date: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date',
	Error: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error',
	Float32Array: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Float32Array',
	Float64Array: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Float64Array',
	Function: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function',
	Int16Array: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Int16Array',
	Int32Array: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Int32Array',
	Int8Array: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Int8Array',
	Iterable: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Iteration_protocols#the_iterable_protocol',
	Iterator: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Iteration_protocols#the_iterator_protocol',
	Map: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map',
	Promise: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise',
	RegExp: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp',
	Response: 'https://developer.mozilla.org/en-US/docs/Web/API/Response',
	Set: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Set',
	URL: 'https://developer.mozilla.org/en-US/docs/Web/API/URL',

	// Node.js
	'global.Buffer': 'https://nodejs.org/api/buffer.html',
	EventEmitter: 'https://nodejs.org/api/events.html#events_class_eventemitter',
	'global.NodeJS.EventEmitter': 'https://nodejs.org/api/events.html#events_class_eventemitter',
	'EventEmitter.captureRejectionSymbol': 'https://nodejs.org/api/events.html#eventscapturerejectionsymbol',
	'EventEmitter.errorMonitor': 'https://nodejs.org/api/events.html#eventserrormonitor',
	NodeEventTarget: 'https://nodejs.org/api/events.html#class-nodeeventtarget',
	PathLike: 'https://nodejs.org/api/path.html#path_pathlike',
	'global.NodeJS.Timeout': 'https://nodejs.org/api/timers.html#timers_class_timeout',
	'global.NodeJS.Timer': 'https://nodejs.org/api/timers.html#timers_class_timeout',
	'internal.Stream': 'https://nodejs.org/api/stream.html#stream_class_stream',

	// TypeScript
	Exclude: 'https://www.typescriptlang.org/docs/handbook/utility-types.html#excludeuniontype-excludedmembers',
	InstanceType: 'https://www.typescriptlang.org/docs/handbook/utility-types.html#instancetype',
	Omit: 'https://www.typescriptlang.org/docs/handbook/utility-types.html#omittype-keys',
	Partial: 'https://www.typescriptlang.org/docs/handbook/utility-types.html#partialtype',
	Readonly: 'https://www.typescriptlang.org/docs/handbook/utility-types.html#readonlytype',
	Record: 'https://www.typescriptlang.org/docs/handbook/utility-types.html#recordkeys-type'
};

const unknownReferences: Set<string> = new Set([
	// 'typescript'
	'ArrayLike',
	'AsyncIterableIterator',
	'ClassDecorator',
	'DOMEventTarget',
	'InspectOptionsStylized',
	'IterableIterator',
	'IteratorResult',
	'MapConstructor',
	'MethodDecorator',
	'PropertyKey',
	'ObjectConstructor',
	'ReadonlyMap'
]);

ReferenceTypeParser.formatToString = (options) => {
	const { parser, project } = options;
	const typeArguments = parser.typeArguments.length > 0 ? `< ${parser.typeArguments.map((type) => type.toString()).join(', ')}\\>` : '';

	if (parser.id) {
		const found = project?.find(parser.id);

		if (found) {
			if ('external' in found && !found.external) {
				if (found instanceof NamespaceParser) {
					return `[\`${parser.name}\`](../namespace/${parser.name.toLowerCase().replace(/\s/g, '-')}.mdx)${typeArguments}`;
				} else if (found instanceof ClassParser) {
					return `[\`${parser.name}\`](../class/${parser.name.toLowerCase().replace(/\s/g, '-')}.mdx)${typeArguments}`;
				} else if (found instanceof FunctionParser) {
					return `[\`${parser.name}\`](../function/${parser.name.toLowerCase().replace(/\s/g, '-')}.mdx)${typeArguments}`;
				} else if (found instanceof InterfaceParser) {
					return `[\`${parser.name}\`](../interface/${parser.name.toLowerCase().replace(/\s/g, '-')}.mdx)${typeArguments}`;
				} else if (found instanceof TypeAliasParser) {
					return `[\`${parser.name}\`](../type-alias/${parser.name.toLowerCase().replace(/\s/g, '-')}.mdx)${typeArguments}`;
				} else if (found instanceof EnumParser) {
					return `[\`${parser.name}\`](../enum/${parser.name.toLowerCase().replace(/\s/g, '-')}.mdx)${typeArguments}`;
				} else if (found instanceof VariableParser) {
					return `[\`${parser.name}\`](../variable/${parser.name.toLowerCase().replace(/\s/g, '-')}.mdx)${typeArguments}`;
				}
			}
		} else {
			console.warn(yellow(`${bold('[WARN]')} Unable to find parser for ${parser.name} (${parser.id})`));
		}
	}

	if (parser.packageName) {
		if (parser.packageName === 'discord.js') {
			return `[\`${parser.name}\`](https://discord.js.org/#/docs/discord.js/main/search?${new URLSearchParams({
				query: parser.name
			})})${typeArguments}`;
		} else if (parser.packageName === '@discordjs/collection') {
			return `[\`${parser.name}\`](https://discord.js.org/#/docs/collection/main/search?${new URLSearchParams({
				query: parser.name
			})})${typeArguments}`;
		}

		for (const [ref, url] of Object.entries(references)) {
			if (ref === parser.name) return `[\`${parser.name}\`](${url})${typeArguments}`;
		}

		if (!unknownReferences.has(parser.name)) {
			console.warn(yellow(`${bold('[WARN]')} Unable to find parser for ${parser.name} (${parser.packageName})`));
		}

		return `[\`${parser.name}\`](package::${parser.packageName})${typeArguments}`;
	}

	return `\`${parser.name}\`${typeArguments}`;
};

export async function docusaurusTypeDocJsonParser(options: PluginOptions) {
	const siteDir = fileURLToPath(new URL('../../', import.meta.url));
	const { githubContentUrl, githubToken } = options;

	const headers = new Headers();

	if (githubToken) {
		headers.append('Authorization', `Bearer ${githubToken}`);
	}

	console.info(blue(`${bold('[INFO]')} Fetching repository content... ${bold(githubContentUrl)}`));

	const repositoryContents = await fetch<RepositoryContent[]>(githubContentUrl, { headers });
	const repositoryDirectories = repositoryContents.filter((content) => content.type === RepositoryContentFileType.Directory);

	for (const directory of repositoryDirectories) {
		console.info(blue(`${bold('[INFO]')} Fetching repository content... ${bold(directory.url)}`));

		const directoryContents = await fetch<RepositoryContent[]>(directory.url, { headers });

		for (const directoryContent of directoryContents) {
			if (directoryContent.type === RepositoryContentFileType.Directory) {
				const subDirectoryContents = await fetch<RepositoryContent[]>(directoryContent.url, { headers });

				writeCategoryYaml(resolve(siteDir, 'docs', 'Documentation', directory.name), '', directory.name, 0);

				for (const subDirectoryContent of subDirectoryContents) {
					if (subDirectoryContent.download_url === null)
						throw new Error(
							`The 'download_url' field is null for '${directory.name}/${directoryContent.name}/${subDirectoryContent.name}'`
						);

					writeCategoryYaml(resolve(siteDir, 'docs', 'Documentation', directory.name, directoryContent.name), '', directoryContent.name, 1);

					const outputDir = resolve(
						siteDir,
						'docs',
						'Documentation',
						directory.name,
						directoryContent.name,
						subDirectoryContent.name.replace('.json', '')
					);

					removeDirectory(outputDir);

					writeCategoryYaml(outputDir, '', subDirectoryContent.name.replace('.json', ''), 1);

					const data = await fetch<ProjectParser.Json>(subDirectoryContent.download_url);
					const incomingTypeDocJsonParserVersion = data.typeDocJsonParserVersion.split('.').map(Number) as [number, number, number];
					const currentTypeDocJsonParserVersion = ProjectParser.version.split('.').map(Number) as [number, number, number];

					if (incomingTypeDocJsonParserVersion[0] !== currentTypeDocJsonParserVersion[0]) continue;

					const projectParser = new ProjectParser({ data, version: subDirectoryContent.name.replace('.json', '') });

					renderOutputFiles(projectParser, outputDir, true);
				}
			} else {
				if (directoryContent.download_url === null)
					throw new Error(`The 'download_url' field is null for '${directory.name}/${directoryContent.name}'`);

				writeCategoryYaml(resolve(siteDir, 'docs', 'Documentation', directory.name), '', directory.name, 0);

				const outputDir = resolve(siteDir, 'docs', 'Documentation', directory.name, directoryContent.name.replace('.json', ''));

				removeDirectory(outputDir);

				writeCategoryYaml(outputDir, '', directoryContent.name.replace('.json', ''), 1);

				const data = await fetch<ProjectParser.Json>(directoryContent.download_url);
				const incomingTypeDocJsonParserVersion = data.typeDocJsonParserVersion.split('.').map(Number) as [number, number, number];
				const currentTypeDocJsonParserVersion = ProjectParser.version.split('.').map(Number) as [number, number, number];

				if (incomingTypeDocJsonParserVersion[0] !== currentTypeDocJsonParserVersion[0]) continue;

				const projectParser = new ProjectParser({ data, version: directoryContent.name.replace('.json', '') });

				renderOutputFiles(projectParser, outputDir, false);
			}
		}
	}

	console.info(blue(`${bold('[INFO]')} Finished fetching & parsing repository content`));
}
