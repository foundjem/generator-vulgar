'use strict';
var yeoman = require('yeoman-generator'),
     chalk = require('chalk'),
     yosay = require('yosay'),
         _ = require('lodash'),
         s = require('underscore.string'),
        fs = require('fs'),
    prompt = require('../../lib/option-or-prompt.js');

var modulesSource = 'src/';

module.exports = yeoman.generators.Base.extend({

  _prompt: prompt,

  // The name `constructor` is important here
  constructor: function () {
    // Calling the super constructor is important so our generator is correctly set up
    yeoman.Base.apply(this, arguments);

    // This method adds support for a `--vulgarcli` flag
    this.option('vulgarcli', { type: Boolean, defaults: false, hide: true });

    // This method adds support for a `--dest` flag
    // This allows a destination to be passed in at the command line
    // Note that this path will be the final path FROM the root of the
    // project where the cli should be run
    this.option('dest', { type: String });

    // This method adds support for a `--module` flag
    // This allows the module name to be passed in from the command line
    this.option('module', { type: String });

    // This method adds support for a `--name` flag
    // This allows the name of the routable Angular component(s) to be
    // passed in at the command line
    this.option('name', { type: String });
  },

  askForModuleDirectory: function (cb) {

    var done = cb || this.async();

    var prompts = [{
      type: 'list',
      name: 'module',
      message: 'Where would you like to create this service?',
      // Define some default choices
      choices: [{
        value: '../',
        name: '../'
      },
      {
        value: '',
        name: 'Select this directory'
      }]
    }];

    // Add module choices
    if (fs.existsSync(modulesSource)) {

      fs.readdirSync(modulesSource).forEach(function (folder) {
        var stat = fs.statSync(modulesSource + '/' + folder);

        if (stat.isDirectory()
              // Exclude the `assets` and `sass` directories
              && folder !== 'assets'
              && folder !== 'sass') {

          prompts[0].choices.push({
            value: folder,
            name: folder
          });
        }
      });
    }

    // Use custom prompt function which skips the prompt if
    // an option has been passed in
    this._prompt(prompts, function(props) {
      // this.props = props;
      // To access props later use this.props.someOption;

      modulesSource = modulesSource + '/' + props.module;

      // Continue to queue the user for a location
      // until no value is returned, which equates
      // to the `Select this directory` choice
      if(props.module) {
        this.askForModuleDirectory(done);
      } else {
        done();
      }
    }.bind(this));
  },

  askForModuleName: function () {

    var done = this.async();

    var prompts = [{
      type: 'input',
      name: 'name',
      message: 'What would you like to name this service?',
      default: 'ng-service'
    }];

    // Use custom prompt function which skips the prompt if
    // an option has been passed in
    this._prompt(prompts, function(props) {
      this.props = props;
      // To access props later use this.props.someOption;

      this.name = this.props.name || 'ng-service';

      this.slugifiedName = s(this.name).humanize().slugify().value();
      this.classifiedName = s(this.slugifiedName).classify().value();

      if (this.options.dest) {

        this.destination = this.options.dest;
      } else {

        this.destination = modulesSource + '/' + this.slugifiedName + '/';
      }

      done();
    }.bind(this));
  },

  writing: function () {

    //** Generate `Angular` service
    this.fs.copyTpl(
      this.templatePath('_.service.ts'),
      this.destinationPath(this.destination + this.slugifiedName + '.service.ts'), {

        classifiedName: this.classifiedName
      }
    );

    //** Generate `Angular` service unit test
    this.fs.copyTpl(
      this.templatePath('_.service.spec.ts'),
      this.destinationPath(this.destination + this.slugifiedName + '.service.spec.ts'), {

        classifiedName: this.classifiedName,
        slugifiedName: this.slugifiedName
      }
    );
  },

  end: function() {

    if(!this.options.vulgarcli) {
      // Terminate process if run from console
      process.exit(0);
    } else if(this.options.vulgarcli === true) {
      // `return 0` to let `vulgar-cli` know everything went okay on our end
      return 0;
    }
  }
});
