#!/usr/bin/env node

/*
 * code-forensics
 * Copyright (C) 2016-2021 Silvio Montanari
 * Distributed under the GNU General Public License v3.0
 * see http://www.gnu.org/licenses/gpl.html
 */

var Koa            = require('koa'),
    mount          = require('koa-mount'),
    serveStatic    = require('koa-static'),
    findup         = require('findup-sync'),
    ansi           = require('ansi-colors'),
    Path           = require('path'),
    parseArgs      = require('minimist'),
    _              = require('lodash');

var ApiMiddleware   = require(Path.resolve(__dirname, '../lib/api_middleware')),
    runtimeDefaults = require(Path.resolve(__dirname, '../lib/runtime/defaults'));


var args = parseArgs(process.argv.slice(2), {
  default: {
    'd': Path.resolve(runtimeDefaults.configuration.outputDir),
    'p': 3000
  }
});

var publicPath = Path.resolve(__dirname, '../public');
var jsPath = Path.resolve(__dirname, '../lib/web');
var libPath = findup('node_modules');
var dataPath = args.d;

var ROUTES = {
  '/js': jsPath,
  '/lib': libPath,
  '/data': dataPath
};

var StaticRoutes = new Function();
StaticRoutes.prototype.middleware = function() {
  return _.map(ROUTES, function(path, route) {
    var staticRoute = new Koa();
    staticRoute.use(serveStatic(path, {}));
    return mount(route, staticRoute);
  });
};

var options = {
  hostname: '0.0.0.0',
  port: args.p,
  directory: publicPath,
  reportDir: dataPath,
  stack: [
    'lws-static',
    StaticRoutes,
    ApiMiddleware
  ]
};

/* eslint-disable no-console */
console.log(ansi.yellow('Web server listening on ' + options.hostname + ':' + options.port));
console.log(ansi.cyan('serving "/"     files from ' + publicPath));
console.log(ansi.cyan('serving "/js"   files from ' + jsPath));
console.log(ansi.cyan('serving "/lib"  files from ' + libPath));
console.log(ansi.cyan('serving "/data" files from ' + dataPath));
console.log('Hit CTRL-C to stop the server');

// Keep the event loop alive until local-web-server initializes and binds
var keepAliveTimer = setInterval(function() {}, 1000);

process.on('uncaughtException', function(err) {
  console.error('Uncaught Exception:', err.stack || err);
  process.exit(1);
});

process.on('unhandledRejection', function(reason, promise) {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

import('local-web-server').then(function(LocalWebServer) {
  options.moduleDir = [
    Path.resolve(__dirname, '../node_modules'),
    Path.resolve(__dirname, '../../node_modules'),
    Path.resolve('/home/jdevoo/playground/code-forensic/node_modules')
  ];
  LocalWebServer.default.create(options).then(function(lws) {
    var clearTimer = function() {
      clearInterval(keepAliveTimer);
    };

    if (lws.server.listening) {
      clearTimer();
    } else {
      lws.server.on('listening', function() {
        clearTimer();
      });
    }

    lws.server.on('error', function(err) {
      clearInterval(keepAliveTimer);
      console.error(ansi.red('Server error: ' + err.message));
      process.exit(1);
    });

    ['SIGINT', 'SIGTERM'].forEach(function(event) {
      process.on(event, function() {
        lws.server.close();
        console.log(ansi.yellow('\nWeb server stopped.'));
        process.exit(0);
      });
    });
  }).catch(function(err) {
    clearInterval(keepAliveTimer);
    console.error(ansi.red('Failed to start web server: ' + err.message));
    process.exit(1);
  });
}).catch(function(err) {
  clearInterval(keepAliveTimer);
  console.error(ansi.red('Failed to import local-web-server: ' + err.message));
  process.exit(1);
});

/* eslint-enable no-console */
