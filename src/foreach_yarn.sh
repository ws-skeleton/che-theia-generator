#!/bin/bash
CURRENTDIR=${PWD}
TARGETDIR=${PWD}/../production/plugins
mkdir -p ${TARGETDIR}
for PLUGIN_DIR in */; do
  cd ${CURRENTDIR}/${PLUGIN_DIR} && \
  echo "✍️  Building ${CURRENTDIR}/${PLUGIN_DIR}" && \
  yarn && \
  echo "✍️  Copying ${CURRENTDIR}/${PLUGIN_DIR} theia package to ${TARGETDIR}" && \
  cp *.theia ${TARGETDIR} || exit 1;
done
