# steal-npm

[![Build Status](https://travis-ci.org/stealjs/steal-npm.svg?branch=master)](https://travis-ci.org/stealjs/steal-npm)

This is a plugin for [StealJS](http://stealjs.com/) that makes it easy to work with [npm](https://www.npmjs.com/).

The idea is to reduce the amount of manual configuring needed when using StealJS
and instead leverage the metadata included in `package.json` to have the configuration
done for you.

## Install

If you're using StealJS you don't have have to install this plugin, it's included by default.

## Configuration

All of the configuration happens within the `steal` property of your `package.json`.

### main

The moduleName of the initial module that should be loaded when the package is imported.  This works similar to
a `System.map` setting. For example:

```
{
  "name": "my-module",
  "version": "1.2.3",
  "steal": {
    "main": "my-main"
  }
}
```

When `"my-module"` is imported, `my-module@1.2.3#my-main` will be the actual module name being 
imported.  This path that `my-main` will be found depends on the `directories.lib` setting.


### meta

The meta config works similar to the base `System.meta` behavior.  However, the module names must:

 - Start with `./` to add metadata to modules within the package like `"./src/util"`, or
 - Look like `packageName#./modulePath` to add metadata to direct dependencies of the package.

Example:

```js
{
  "steal": {
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
  "steal": {
    "npmIgnore": ["devDependencies","cssify"]
  }
}
```

The following packages are ignored by default:

 - "steal", "steal-tools"
 - "bower"
 - "grunt", "grunt-cli"

### npmDependencies

Like `npmIgnore` but affirmative. If used alone will only include the dependencies listed. If used in conjunction with `npmIgnore` acts as an override. For example the following config:

```js
{
  "dependencies": {
    "one": "1.0.0",
	"two": "1.0.0"
  },
  "steal": {
    "npmDependencies": [ "one" ]
  }
}
```

Will load `one` but ignore `two`.

### ignoreBrowser

Set to true to ignore browserfy's `"browser"` and `"browserify"` configurations.

```js
{
  "steal": {
    "ignoreBrowser": true
  }
}
```

### directories

Set a folder to look for module's within your project.  Only the `lib` 
directory can be specified.

In the following setup, `"my-project/my-utils"` will be looked for in
`my-project/src/my-utils.js`:

```js
{
  "name": "my-project"
  "steal": {
    "directories" : {
      "lib" : "src"
    }
  }
}
```

## License

MIT
