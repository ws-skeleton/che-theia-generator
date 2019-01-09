/*********************************************************************
* Copyright (c) 2018 Red Hat, Inc.
*
* This program and the accompanying materials are made
* available under the terms of the Eclipse Public License 2.0
* which is available at https://www.eclipse.org/legal/epl-2.0/
*
* SPDX-License-Identifier: EPL-2.0
**********************************************************************/
import * as jsYaml from 'js-yaml';
import * as path from 'path';
import * as fs from 'fs-extra';
import * as readPkg from 'read-pkg';
import { Logger } from './logger';
import { Repository } from './repository';

/**
 * Init all extensions by cloning them, creating symlinks, update package.json, etc.
 * @author Florent Benoit
 */
export class Extensions {

    /**
     * Prefix for extensions.
     */
    public static readonly PREFIX_PACKAGES_EXTENSIONS = '@che-';

    /**
     * Set of global dependencies
     */
    private globalDevDependencies = new Map<string, string>();

    /**
     * Constructor
     */
    constructor(readonly rootFolder: string, readonly packagesFolder: string, readonly cheTheiaFolder: string, readonly assemblyFolder: string, readonly theiaVersion: string) {

    }

    /**
     * Install all extensions
     */
    async generate(extensionsPath: string): Promise<void> {
        const extensionsYamlContent = await fs.readFile(extensionsPath);
        const extensionsYaml = jsYaml.load(extensionsYamlContent.toString());
        await this.initGlobalDependencies();
        await fs.ensureDir(this.cheTheiaFolder);

        await Promise.all(extensionsYaml.extensions.map(async (extension: IExtension) => {
            await this.addExtension(extension);
        }));

    }

    /**
     * Scan package.json file and grab all dev dependencies and store them in globalDevDependencies variable
     */
    async initGlobalDependencies(): Promise<void> {
        const extensionPackage: any = await readPkg(path.join(this.rootFolder, 'package.json'), { normalize: false });

        const keys = Object.keys(extensionPackage.devDependencies);
        await Promise.all(keys.map(key => {
            this.globalDevDependencies.set(key, extensionPackage.devDependencies[key]);
        }));
    }

    /**
     * Adds an extension to the current theia
     * @param extension the extension to add
     */
    async addExtension(extension: IExtension): Promise<void> {

        // first, clone
        Logger.info(`Cloning ${extension.source}...`);
        await this.clone(extension);

        // perform symlink
        await this.symlink(extension);

        await this.updateDependencies(extension);

        // insert extensions
        await this.insertExtensionIntoAssembly(extension);

    }

    /**
     * perform update of devDependencies or dependencies in package.json file of the cloned extension
     */
    async updateDependencies(extension: IExtension): Promise<void> {

        await Promise.all(extension.symbolicLinks.map(async symbolicLink => {
            // grab package.json
            const extensionJsonPath = path.join(symbolicLink, 'package.json');
            const extensionPackage = await readPkg(extensionJsonPath, { normalize: false });
            const rawExtensionPackage = require(extensionJsonPath);

            const dependencies: any = extensionPackage.dependencies;
            const devDependencies: any = extensionPackage.devDependencies;
            const updatedDependencies: any = {};
            const updatedDevDependencies: any = {};

            const keysDependencies = dependencies ? Object.keys(dependencies) : [];
            await Promise.all(keysDependencies.map(async key => {
                updatedDependencies[key] = this.updateDependency(key, dependencies[key]);
            }));

            rawExtensionPackage['dependencies'] = updatedDependencies;
            const keysDevDependencies = devDependencies ? Object.keys(devDependencies) : [];
            await Promise.all(keysDevDependencies.map(async key => {
                updatedDevDependencies[key] = this.updateDependency(key, devDependencies[key]);
            }));

            rawExtensionPackage['devDependencies'] = updatedDevDependencies;

            // write again the file
            const json = JSON.stringify(rawExtensionPackage, undefined, 2);
            await fs.writeFile(extensionJsonPath, json);

        }));
    }

    /**
     * Update the given dependency by comparing with global dependencies or checking if it's a theia dependency.
     * @param dependencyKey the key of dependency
     * @param dependencyValue its original value
     */
    updateDependency(dependencyKey: string, dependencyValue: string) {

        // is it already defined as a Theia dev dependency ? if yes then return this value
        const rest = this.globalDevDependencies.get(dependencyKey);
        if (rest) {
            return rest;
        }

        // is it a theia dependency
        if (dependencyKey.startsWith('@theia/')) {
            // add carret and the current version
            return `^${this.theiaVersion}`;
        }
        // return default value
        return dependencyValue;
    }

    /**
     * Insert the given extension into the package.json of the assembly.
     * @param extension the given extension
     */
    async insertExtensionIntoAssembly(extension: IExtension) {

        // first, read the assembly json file
        const assemblyPackageJsonPath = path.join(this.assemblyFolder, 'package.json');
        const assemblyJsonRawContent = require(assemblyPackageJsonPath);
        const dependencies = assemblyJsonRawContent.dependencies;
        extension.symbolicLinks.forEach(extensionSymLink => {

            // first resolve path
            const resolvedPath = path.resolve(extensionSymLink, 'package.json');

            // read extension name within symlink
            const extensionName = require(resolvedPath).name;
            const extensionVersion = require(resolvedPath).version;
            dependencies[extensionName] = extensionVersion;
        });
        const json = JSON.stringify(assemblyJsonRawContent, undefined, 2);
        await fs.writeFile(assemblyPackageJsonPath, json);
    }

    async symlink(extension: IExtension): Promise<void> {

        const symbolicLinks: string[] = [];

        // now, perform symlink for specific folder or current folder
        if (extension.folders) {
            // ok here we have several folders, need to iterate
            await Promise.all(extension.folders.map(async folder => {

                // source folder
                const sourceFolder = path.resolve(extension.clonedDir, folder);
                const dest = path.resolve(this.packagesFolder, `${Extensions.PREFIX_PACKAGES_EXTENSIONS}${path.basename(sourceFolder)}`);
                Logger.info(`Creating symlink from ${sourceFolder} to ${dest}`);
                await fs.ensureSymlink(sourceFolder, dest);
                symbolicLinks.push(dest);
            }));
        } else {
            const dest = path.resolve(this.packagesFolder, `${Extensions.PREFIX_PACKAGES_EXTENSIONS}${path.basename(extension.clonedDir)}`);
            Logger.info(`Creating symlink from ${extension.clonedDir} to ${dest}`);
            await fs.ensureSymlink(extension.clonedDir, dest);
            symbolicLinks.push(dest);
        }

        extension.symbolicLinks = symbolicLinks;

    }

    /**
     * Clone the given extension with the correct branch/tag
     * @param extension the extension to clone
     */
    async clone(extension: IExtension): Promise<void> {
        const repository = new Repository(extension.source);
        extension.clonedDir = await repository.clone(this.cheTheiaFolder, repository.getRepositoryName(), extension.checkoutTo);
    }

}

/**
 * Extension's interface
 */
export interface IExtension {
    source: string,
    checkoutTo: string,
    type: string,
    folders: string[],
    clonedDir: string;
    symbolicLinks: string[]
}
