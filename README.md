# system-bower

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

## Configuring

coming soon.

## License

MIT
