import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { InterfaceParser, ProjectParser } from 'typedoc-json-parser';
import { writeCategoryYaml } from './writeCategoryYaml';

function renderInterface(interfaceParser: InterfaceParser, outputDir: string, fileSidebarPosition: number) {
	const slug = interfaceParser.name.toLowerCase().replace(/\s/g, '-');

	const header = `---
id: "${slug}"
title: "${interfaceParser.name}"
sidebar_label: "${interfaceParser.name}"
sidebar_position: ${fileSidebarPosition}
custom_edit_url: null
---`;

	const result = `${header}`;

	writeFileSync(resolve(outputDir, `${slug}.mdx`), result);
}

export function renderInterfaces(projectParser: ProjectParser, outputDir: string, isGroup: boolean) {
	if (!projectParser.interfaces.every((interfaceParser) => interfaceParser.external)) {
		const categoryDir = writeCategoryYaml(outputDir, 'interface', 'Interfaces', isGroup ? 2 : 1);

		let fileSidebarPosition = 0;

		for (const interfaceParser of projectParser.interfaces) {
			if (interfaceParser.external) continue;

			renderInterface(interfaceParser, categoryDir, fileSidebarPosition);

			fileSidebarPosition++;
		}
	}
}
