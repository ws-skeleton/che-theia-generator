/*
 * Copyright (c) 2018 Red Hat, Inc.
 * All rights reserved. This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * Contributors:
 *   Red Hat, Inc. - initial API and implementation
 */

import * as path from 'path';
import * as tmp from "tmp";
import * as fs from 'fs-extra';
import { Init } from "../../src/init";

describe("Test Init", () => {

    const rootFolder = process.cwd();
    const rootFolderTheia = path.resolve(rootFolder, "tests/init/root-folder");
    let rootFolderTmp: string;
    let examplesAssemblyFolderTmp: string;
    let checkoutFolderTmp: string;


    beforeEach(async () => {
        rootFolderTmp = tmp.dirSync({ mode: 0o750, prefix: "tmpInit", postfix: "" }).name;
        examplesAssemblyFolderTmp = path.resolve(rootFolderTmp, 'examples/assembly');
        checkoutFolderTmp = path.resolve(rootFolderTmp, 'checkout-folder');

    });

    afterEach(() => {
        // remove tmp directory
        fs.removeSync(rootFolderTmp);
    });


    test("test getTheia version", async () => {
        const init = new Init(rootFolderTheia, '', '');
        expect(await init.getCurrentVersion()).toBe('0.0.123');
    });

    test("test generate", async () => {
        const init = new Init(rootFolderTheia, examplesAssemblyFolderTmp, checkoutFolderTmp);
        await init.generate();
        // check file has been generated and contains correct version
        const contentPackageJson = await fs.readFile(path.join(examplesAssemblyFolderTmp, 'package.json'));
        const packageJson = JSON.parse(contentPackageJson.toString());
        expect(packageJson.name).toBe('@eclipse-che/theia-assembly');
        expect(packageJson['dependencies']['@theia/core']).toBe('^' + await init.getCurrentVersion());

        // check folders have been created
        expect(fs.existsSync(examplesAssemblyFolderTmp)).toBeTruthy();
        expect(fs.existsSync(checkoutFolderTmp)).toBeTruthy();


    });

});
