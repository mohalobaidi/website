import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { NamespaceParser, ProjectParser } from 'typedoc-json-parser';
import { writeCategoryYaml } from './writeCategoryYaml';

function renderNamespace(namespaceParser: NamespaceParser, outputDir: string, fileSidebarPosition: number) {
	const slug = namespaceParser.name.toLowerCase().replace(/\s/g, '-');

	const header = `---
id: "${slug}"
title: "${namespaceParser.name}"
sidebar_label: "${namespaceParser.name}"
sidebar_position: ${fileSidebarPosition}
custom_edit_url: null
---`;

	const result = `${header}`;

	writeFileSync(resolve(outputDir, `${slug}.mdx`), result);
}

export function renderNamespaces(projectParser: ProjectParser, outputDir: string, isGroup: boolean) {
	if (!projectParser.namespaces.every((namespaceParser) => namespaceParser.external)) {
		const categoryDir = writeCategoryYaml(outputDir, 'namespace', 'Namespaces', isGroup ? 2 : 1);

		let fileSidebarPosition = 0;

		for (const namespaceParser of projectParser.namespaces) {
			if (namespaceParser.external) continue;

			renderNamespace(namespaceParser, categoryDir, fileSidebarPosition);

			fileSidebarPosition++;
		}
	}
}
