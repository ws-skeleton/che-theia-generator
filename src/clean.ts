/*********************************************************************
* Copyright (c) 2019 Red Hat, Inc.
*
* This program and the accompanying materials are made
* available under the terms of the Eclipse Public License 2.0
* which is available at https://www.eclipse.org/legal/epl-2.0/
*
* SPDX-License-Identifier: EPL-2.0
**********************************************************************/
import * as path from 'path';
import * as fs from 'fs-extra';

/**
 * Clean up Theia repository:
 * 1. Remove symbolic links in 'packages' folder
 * 2. Remove 'che' folder
 * 3. Remove 'assembly' folder
 * 4. Remove 'node_modules' folder
 */
export class Clean {
    constructor(
        private readonly assemblyFolder: string,
        private readonly cheFolder: string,
        private readonly packagesFolder: string,
        private readonly nodeModules: string
    ) {
    }

    cleanCheTheia(): void {

        console.log('Removing symbolic links...');
        const packages = fs.readdirSync(this.packagesFolder);
        for (const pack of packages) {
            const extPath = path.resolve(this.packagesFolder, pack);
            const stat = fs.lstatSync(extPath);
            if (stat.isSymbolicLink()) {
                fs.unlinkSync(extPath);
            }
        }
        console.log('Removing extensions...');
        fs.removeSync(this.cheFolder);
        console.log('Removing assembly...');
        fs.removeSync(this.assemblyFolder);

        // we also need to clean up node_modules
        console.log('Removing "node_modules"...');
        fs.removeSync(this.nodeModules);
    }
}
