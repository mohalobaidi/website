import type { ProjectParser } from 'typedoc-json-parser';
import { renderClasses } from './renderClass';
import { renderVariables } from './renderVariable';
import { renderEnums } from './renderEnum';
import { renderFunctions } from './renderFunction';
import { renderInterfaces } from './renderInterface';
import { renderNamespaces } from './renderNamespace';
import { renderTypeAliases } from './renderTypeAlias';

export function renderOutputFiles(projectParser: ProjectParser, outputDir: string, isGroup: boolean) {
	if (projectParser.classes.length) {
		renderClasses(projectParser, outputDir, isGroup);
	}

	if (projectParser.variables.length) {
		renderVariables(projectParser, outputDir, isGroup);
	}

	if (projectParser.enums.length) {
		renderEnums(projectParser, outputDir, isGroup);
	}

	if (projectParser.functions.length) {
		renderFunctions(projectParser, outputDir, isGroup);
	}

	if (projectParser.interfaces.length) {
		renderInterfaces(projectParser, outputDir, isGroup);
	}

	if (projectParser.namespaces.length) {
		renderNamespaces(projectParser, outputDir, isGroup);
	}

	if (projectParser.typeAliases.length) {
		renderTypeAliases(projectParser, outputDir, isGroup);
	}
}
