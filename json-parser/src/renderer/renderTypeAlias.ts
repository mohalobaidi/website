import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { ProjectParser, TypeAliasParser } from 'typedoc-json-parser';
import { writeCategoryYaml } from './writeCategoryYaml';

function renderTypeAlias(typeAliasParser: TypeAliasParser, outputDir: string, fileSidebarPosition: number) {
	const slug = typeAliasParser.name.toLowerCase().replace(/\s/g, '-');

	const header = `---
id: "${slug}"
title: "${typeAliasParser.name}"
sidebar_label: "${typeAliasParser.name}"
sidebar_position: ${fileSidebarPosition}
custom_edit_url: null
---`;

	const result = `${header}`;

	writeFileSync(resolve(outputDir, `${slug}.mdx`), result);
}

export function renderTypeAliases(projectParser: ProjectParser, outputDir: string, isGroup: boolean) {
	if (!projectParser.typeAliases.every((typeAliasParser) => typeAliasParser.external)) {
		const categoryDir = writeCategoryYaml(outputDir, 'type-alias', 'Type Aliases', isGroup ? 2 : 1);

		let fileSidebarPosition = 0;

		for (const typeAliasParser of projectParser.typeAliases) {
			if (typeAliasParser.external) continue;

			renderTypeAlias(typeAliasParser, categoryDir, fileSidebarPosition);

			fileSidebarPosition++;
		}
	}
}
