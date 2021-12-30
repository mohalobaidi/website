import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { VariableParser, ProjectParser } from 'typedoc-json-parser';
import { writeCategoryYaml } from './writeCategoryYaml';

function renderVariable(constantParser: VariableParser, outputDir: string, fileSidebarPosition: number) {
	const slug = constantParser.name.toLowerCase().replace(/\s/g, '-');

	const header = `---
id: "${slug}"
title: "${constantParser.name}"
sidebar_label: "${constantParser.name}"
sidebar_position: ${fileSidebarPosition}
custom_edit_url: null
---`;

	const result = `${header}`;

	writeFileSync(resolve(outputDir, `${slug}.mdx`), result);
}

export function renderVariables(projectParser: ProjectParser, outputDir: string, isGroup: boolean) {
	if (!projectParser.variables.every((constantParser) => constantParser.external)) {
		const categoryDir = writeCategoryYaml(outputDir, 'constant', 'Variables', isGroup ? 2 : 1);

		let fileSidebarPosition = 0;

		for (const constantParser of projectParser.variables) {
			if (constantParser.external) continue;

			renderVariable(constantParser, categoryDir, fileSidebarPosition);

			fileSidebarPosition++;
		}
	}
}
