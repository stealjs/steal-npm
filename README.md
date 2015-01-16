# system-npm

This is a plugin for [SystemJS](https://github.com/systemjs/systemjs) and 
[StealJS](http://stealjs.com/) that makes it easy to work with [npm](https://www.npmjs.com/).

The idea is to reduce the amount of manual configuring needed when using SystemJS/StealJS
and instead leverage the metadata included in `package.json` to have the configuration
done for you.

## Install

If you're using StealJS you don't have have to install this plugin, it's included by default.

If you're using SystemJS install this as another bower dependency:

```js
bower install system-npm --save-dev
```

## Use

### SystemJS

```js
System.import("package.json!npm").then(function() {
  // Configurations set, you can start importing stuff
});
```

## Configuration

All of the configuration happens within the `system` property of your `package.json`.

### Meta

The meta config works similar to the base `System.meta` behavior.  However, the module names must:

 - Start with `./` to add metadata to modules within the package like `"./src/util"`, or
 - Look like `packageName#./modulePath` to add metadata to direct dependencies of the package.

Example:

```js
{
  "system": {
    "meta": {
      "./src/utils": {"format": "amd"},
      "jquery": {"format": "global"},
      "lodash#./array/grep": {"format": "es6"}
    }
  }
}
```

### npmIgnore

Use npmIgnore to prevent package information from being loaded for specified dependencies
or the `peerDependencies`, `devDependencies`, or `dependencies`.  The following
ignores a package.json's `devDependencies` and `cssify`.  But all other
dependencies will be loaded:

```js
{
  "dependencies": {
    "canjs": "2.1.0",
    "cssify": "^0.6.0"
  },
  "devDependencies": {
    "steal-tools": "0.5.0"
  },
  "system": {
    "npmIgnore": ["devDependencies","cssify"]
  }
}
```

### ignoreBrowser


## License

MIT
