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

/**
 * Generates a `cdn.json` file with the prefixes of CDN where Theia and Monaco files
 * should be retrieved from.
 *
 * @author David Festal
 */
export class Cdn {

    constructor(readonly assemblyFolder: string, readonly theiaCDN: string, readonly monacoCDN: string) {
    }

    public async create(): Promise<void> {
        await fs.writeFile(path.join(this.assemblyFolder, 'cdn.json'), `{
  "theia": "${this.theiaCDN}",
  "monaco": "${this.monacoCDN}"
}`);
    }
}
