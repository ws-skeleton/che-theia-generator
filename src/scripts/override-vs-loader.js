#!/usr/bin/env node
/*********************************************************************
 * Copyright (c) 2018 Red Hat, Inc.
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 **********************************************************************/

const path = require('path');
const fs = require('fs-extra');

(async () => {
    try {
        await fs.rename('lib/vs/loader.js', 'lib/vs/original-loader.js');
        await fs.copyFile('cdn/vs-loader.js', 'lib/vs/loader.js');
    } catch (e) {
       console.log('error', e);
    }
})();
