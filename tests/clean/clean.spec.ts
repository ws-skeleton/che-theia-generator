/*
 * Copyright (c) 2019 Red Hat, Inc.
 * All rights reserved. This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * Contributors:
 *   Red Hat, Inc. - initial API and implementation
 */

import { Clean } from '../../src/clean';
import * as fs from 'fs-extra';
import * as path from 'path';

describe('Test clean command', () => {

    beforeAll(() => {

    });

    test('Test clean', () => {
        const chePath = path.resolve(__dirname, 'che');
        fs.ensureDirSync(chePath);

        const assemblyPath = path.resolve(__dirname, 'assembly');
        fs.ensureDirSync(assemblyPath);

        const packagesFolder = path.resolve(__dirname, 'packages');
        fs.ensureDirSync(packagesFolder);
        fs.ensureSymlinkSync(path.resolve(__dirname), path.resolve(packagesFolder, '@test-plugin'));
        fs.ensureDirSync(path.resolve(packagesFolder, 'plugin-ext'));

        const nodeModules = path.resolve(__dirname, 'NodeModules');
        fs.ensureDirSync(nodeModules);

        const c = new Clean(assemblyPath, chePath, packagesFolder, nodeModules);

        c.cleanCheTheia();

        expect(fs.existsSync(chePath)).toBe(false);
        expect(fs.existsSync(assemblyPath)).toBe(false);
        expect(fs.existsSync(nodeModules)).toBe(false);
        expect(fs.readdirSync(packagesFolder)).toEqual(['plugin-ext']);
    });

});
