module.exports = function() {
  const global = typeof window === 'undefined' ? {} : window;
  global.cheCDN = {
      noCDN: global.location ? global.location.search.match(/^.*\?noCDN(&.+)?$/) : false,
      chunks: [],
      resources: [],
      monaco: {},
      buildScripts() {
        this.chunks.map((entry) => this.url(entry.cdn, entry.chunk ))
        .forEach((url)=>{
          var script = document.createElement('script');
          script.src = url;
          script.async = true;
          script.defer = true;
          script.crossOrigin="anonymous";
          script.charset = "utf-8";
          document.head.append(script);
        });
      },
      buildScriptsWithoutCdn() {
        this.noCDN = true;
        this.buildScripts();
      },
      url(withCDN, fallback) {
        var result = fallback;
        if (! this.noCDN && withCDN) {
          const request = new XMLHttpRequest();
          request.onload = function() {
            if (this.status >= 200 && this.status < 300 || this.status === 304) {
              result = withCDN;
            }
          };
          request.open("HEAD", withCDN, false);
          request.send();
        }
        return result;
      },

      resourceUrl(path) {
        var cached = this.resources.find((entry) => entry.resource == path);
        if (cached) {
          return this.url(cached.cdn, cached.resource);
        }
        return path;
      },

      vsLoader(context) {
        const loaderURL = this.url(this.monaco.vsLoader.cdn, this.monaco.vsLoader.external);
        const request = new XMLHttpRequest();
        request.open('GET', loaderURL, false);
        request.send();
        new Function(request.responseText).call(global);
        if (this.monaco.vsLoader.cdn && loaderURL === this.monaco.vsLoader.cdn) {
          const pathsWithCdns = {}
          this.monaco.requirePaths
          .forEach((path) => {
            const jsFile = path.external + '.js';
            const jsCdnFile = path.cdn ? path.cdn + '.js' : undefined;
            if (this.url(jsCdnFile, jsFile) === jsCdnFile) {
              pathsWithCdns[path.external] = path.cdn;
            }
          });
          context.require.config({
            paths: pathsWithCdns
          });
        }
      }
  };

  function cdnLoader(source) {
    if (source.match(/^module\.exports ?\= ?"data:/)) {
      return source;
    }
    const urlContent = source.replace(/^module\.exports ?\= ?([^;]+);$/, '$1');
    return `module.exports = window.cheCDN.resourceUrl(${ urlContent });`;
  }    

  return cdnLoader;
}();
