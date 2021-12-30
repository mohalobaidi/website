import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { ClassMethodParser, ClassParser, ClassPropertyParser, ProjectParser, TypeParser } from 'typedoc-json-parser';
import { parseExamples } from './utilities/parseExamples';
import { parseParameters } from './utilities/parseParameters';
import { parseSee } from './utilities/parseSee';
import { parseTypeParameters } from './utilities/parseTypeParameters';
import { writeCategoryYaml } from './writeCategoryYaml';

function renderClass(classParser: ClassParser, projectParser: ProjectParser, outputDir: string, fileSidebarPosition: number) {
	const slug = classParser.name.toLowerCase().replace(/\s/g, '-');

	const header = `---
id: "${slug}"
title: "${classParser.name}"
sidebar_label: "${classParser.name}"
sidebar_position: ${fileSidebarPosition}
custom_edit_url: null
---`;

	const classExtendsType = parseExtendsType(classParser.extendsType, projectParser);
	const classImplementsTypes = parseImplementsType(classParser.implementsType, projectParser);

	const result = `${header}
${classExtendsType === null ? '' : `**extends ${classExtendsType}**`}
${classImplementsTypes.length === 0 ? '' : `**implements ${classImplementsTypes.join(', ')}**`}

${
	classParser.typeParameters.length
		? `## Type Parameters

${parseTypeParameters(classParser.typeParameters, projectParser)}`
		: ''
}

${classParser.comment.description ?? 'No description provided.'}

${parseSee(classParser.comment.see)}

${
	classParser.comment.example.length
		? `## Examples

${parseExamples(classParser.comment.example)}`
		: ''
}

${parseConstructor(classParser, projectParser)}
${parseProperties(classParser.properties, projectParser)}
${parseMethods(classParser.methods, projectParser)}
`;

	writeFileSync(resolve(outputDir, `${slug}.mdx`), result);
}

export function renderClasses(projectParser: ProjectParser, outputDir: string, isGroup: boolean) {
	if (!projectParser.classes.every((classParser) => classParser.external)) {
		const categoryDir = writeCategoryYaml(outputDir, 'class', 'Classes', isGroup ? 2 : 1);

		let fileSidebarPosition = 0;

		for (const classParser of projectParser.classes) {
			if (classParser.external) continue;

			renderClass(classParser, projectParser, categoryDir, fileSidebarPosition);

			fileSidebarPosition++;
		}
	}
}

function parseExtendsType(typeParser: TypeParser | null, projectParser: ProjectParser): string | null {
	return typeParser ? typeParser.toString(projectParser) : null;
}

function parseImplementsType(typeParsers: TypeParser[], projectParser: ProjectParser): string[] {
	return typeParsers.map((typeParser) => typeParser.toString(projectParser));
}

function parseConstructor(classParser: ClassParser, projectParser: ProjectParser): string {
	return `## Constructor

\`\`\`typescript ts2esm2cjs
new ${classParser.name}(${classParser.construct.parameters.map((parameter) => parameter.name).join(', ')})
\`\`\`

${
	classParser.construct.parameters.length
		? `${
				classParser.construct.parameters.length
					? `### Parameters

${parseParameters(classParser.construct.parameters, projectParser)}`
					: ''
		  }`
		: ''
}`;
}

function parseProperties(properties: ClassPropertyParser[], projectParser: ProjectParser): string {
	if (!properties.length) return '';

	return `
## Properties

${properties
	.map(
		(property) => `### ${
			property.accessibility === ClassParser.Accessibility.Protected
				? '`PROTECTED` '
				: property.accessibility === ClassParser.Accessibility.Private
				? '`PRIVATE` '
				: ''
		}${property.static ? '`STATIC` ' : ''}${property.readonly ? '`READONLY` ' : ''}${property.name}${
			property.type ? `${property.optional ? '?' : ''}: ${property.type.toString(projectParser)}` : ''
		}

${property.comment.description ?? 'No description provided.'}`
	)
	.join('\n\n')}`;
}

function parseMethods(methods: ClassMethodParser[], projectParser: ProjectParser): string {
	if (!methods.length) return '';

	return `
## Methods

${methods
	.map((method) =>
		method.signatures
			.map(
				(signature) =>
					`### ${
						method.accessibility === ClassParser.Accessibility.Protected
							? '`PROTECTED` '
							: method.accessibility === ClassParser.Accessibility.Private
							? '`PRIVATE `'
							: ''
					}${method.static ? '`STATIC` ' : ''}${signature.name}${
						signature.typeParameters.length ? `<${signature.typeParameters.map((typeParameter) => typeParameter.name).join(', ')}\\>` : ''
					}(${signature.parameters.map((parameter) => parameter.name).join(', ')}): ${signature.returnType.toString(projectParser)}

${signature.comment.description ?? 'No description provided.'}

${parseSee(signature.comment.see)}

${
	signature.comment.example.length
		? `#### Examples

${parseExamples(signature.comment.example)}`
		: ''
}

${
	signature.typeParameters.length
		? `#### Type Parameters

${parseTypeParameters(signature.typeParameters, projectParser)}`
		: ''
}

${
	signature.parameters.length
		? `#### Parameters

${parseParameters(signature.parameters, projectParser)}`
		: ''
}`
			)
			.join('\n\n')
	)
	.join('\n\n')}`;
}
