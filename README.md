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

## Configuring

coming soon.

## License

MIT
