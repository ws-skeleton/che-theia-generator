/*********************************************************************
* Copyright (c) 2018 Red Hat, Inc.
*
* This program and the accompanying materials are made
* available under the terms of the Eclipse Public License 2.0
* which is available at https://www.eclipse.org/legal/epl-2.0/
*
* SPDX-License-Identifier: EPL-2.0
**********************************************************************/
import * as fs from 'fs-extra';
import * as path from 'path';
import * as mustache from 'mustache';
import * as readPkg from 'read-pkg';
import { Command } from './command';

/**
 * Generates the examples/assembly
 * @author Florent Benoit
 */
export class Init {

    constructor(readonly rootFolder: string, readonly examplesAssemblyFolder: string, readonly checkoutFolder: string) {

    }

    async getCurrentVersion(): Promise<string> {
        return (await readPkg(path.join(this.rootFolder, 'packages/core/package.json'))).version;
    }

    async getPackageWithVersion(name: string): Promise<String> {
        const command = new Command(path.resolve('.'));
        const fullPkg = await command.exec('yarn --json --non-interactive --no-progress list --pattern=' + name + " | jq --raw-output '.data.trees[0].name'");
        return fullPkg.replace(/\n/g, '');
    }

    async generate(): Promise<void> {
        const templateDir = path.resolve(__dirname, '../src/templates');
        const packageJsonContent = await fs.readFile(path.join(templateDir, 'assembly-package.mst'));

        // generate assembly if does not exists
        const rendered = await this.generateAssemblyPackage(packageJsonContent.toString());
        await fs.ensureDir(this.examplesAssemblyFolder);
        await fs.writeFile(path.join(this.examplesAssemblyFolder, 'package.json'), rendered);
        await fs.copy(path.join(templateDir, 'customization'), path.join(this.examplesAssemblyFolder, 'customization'));
        await fs.copy(path.join(templateDir, 'bin'), path.join(this.examplesAssemblyFolder, 'bin'));

        // Generate checkout folder is does not exist
        await fs.ensureDir(this.checkoutFolder);
    }

    async generateAssemblyPackage(template: string): Promise<string> {
        const version = await this.getCurrentVersion();
        const monacopkg = await this.getPackageWithVersion('@typefox/monaco-editor-core');
        const monacohtmlcontribpkg = await this.getPackageWithVersion('monaco-html');
        const monacocsscontribpkg = await this.getPackageWithVersion('monaco-css');
        const tags = {
            version: version,
            monacopkg: monacopkg,
            monacohtmlcontribpkg: monacohtmlcontribpkg,
            monacocsscontribpkg: monacocsscontribpkg
        };
        return mustache.render(template, tags).replace(/&#x2F;/g, '/');
    }

}
