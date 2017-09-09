#!/usr/bin/env node

/**
*   @license
*   This is the source code file KiCad_BOM_Wizard.js, this is a free KiCad BOM plugin.
*   Copyright (C) 2016  Ronald A. N. Sousa www.hashdefineelectronics.com/
*
*   This program is free software: you can redistribute it and/or modify
*   it under the terms of the GNU General Public License as published by
*   the Free Software Foundation, either version 3 of the License, or
*   (at your option) any later version.
*
*   This program is distributed in the hope that it will be useful,
*   but WITHOUT ANY WARRANTY; without even the implied warranty of
*   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
*   GNU General Public License for more details.
*
*   You should have received a copy of the GNU General Public License
*   along with this program.  If not, see {@link http://www.gnu.org/licenses/}.
*
*   @file KiCad_BOM_Wizard.js
*
*   @author Ronald Sousa http://hashdefineelectronics.com/kicad-bom-wizard/
*
*   @version 0.0.11
*
*   @fileoverview This KiCad plugin can be used to create custom BOM files based on easy
*   configurable templates files. The plugin is writing in JavaScript and has been
*   designed to integrate into KiCad’s BOM plugin manager.
*
*   {@link http://hashdefineelectronics.com/kicad-bom-wizard/|Project Page}
*
*   {@link https://github.com/HashDefineElectronics/KiCad_BOM_Wizard.git|Repository Page}
*
*   @requires xml2js promise nightmare
*
*/

/**
* Test dependencies. if missing, then attempt to install them
*/
try {
  require('xml2js')
  require('promise')
  require('nightmare')
  RunProcess()

} catch (e) {
  console.log('depdencies are missing. Please wait while they are installed.')

  const { exec } = require('child_process')

  // install the missing depdencies
  exec('npm install', {cwd: __dirname}, function (error, stdout, stderror) {
    if(error) {
      console.error(error)
      return;
    }
    // Run main BOM process
    RunProcess()
  })
}


function RunProcess () {
  var Path = require('path')
  var Common = require('./Lib/common.js')
  var ConfigClass = require('./Lib/configuration.js').Init(process.cwd(), Path.join(__dirname, '/Template/'))
  var ComponentsClass = require('./Lib/component.js')
  var templateClass = require('./Lib/template.js')
  var ExportClass = require('./Lib/export.js')


  /**
  *   Defines the plugin revision number
  */
  var PluginRevisionNumber = '0.0.9'

  /**
  * holds our template data
  */
  var TemplateData = null
  /**
  * Holds the current Coponent Data
  */
  var ComponentsData = null
  /**
  * Holds the current Coponent Data
  */
  var Configuration = null

  // print system information
  Common.Message('KiCad_BOM_Wizard Rev: ' + PluginRevisionNumber)

  Configuration = ConfigClass.Load(process.argv[2])
  // if the options were loaded the exist
  if (!Configuration) {
    // No options file given so try the system argument parameters
    Configuration = ConfigClass.LoadOld(process.argv)

    if (!Configuration) {
      Common.Error("Unkown load error:")
    }
  }
  Common.Message("BOM Configuration:", Configuration)

  ComponentsClass.LoadAndProcessComponentList(Configuration).then(function(result){
    ComponentsData = result

    templateClass.LoadTemplateFiles(Configuration).then(function (result) {
      TemplateData = result

      ExportClass.CreateBOM(Configuration, ComponentsData, TemplateData).then(function(result){
        // BOM is now complete
        Common.Message(result, null, true)
      }).catch(Common.Error)
    }).catch(Common.Error)
  }).catch(Common.Error)
}
