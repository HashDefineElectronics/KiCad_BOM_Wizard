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
*   @file template.js
*
*   @author Ronald Sousa http://hashdefineelectronics.com/kicad-bom-wizard/
*
*   @description handle creating the BOM based on the input template and option files
*
*   {@link http://hashdefineelectronics.com/kicad-bom-wizard/|Project Page}
*
*   {@link https://github.com/HashDefineElectronics/KiCad_BOM_Wizard.git|Repository Page}
*
*/
var exports = module.exports

var Common = require('./common.js')
var Promise = require('promise')
var Path = require('path')

/**
* has all the template information for generating the BOM
*/
Template = {
  template : null, // holds the template data for table group should be Template.Path/template.conf
  group : null, // holds the template data for table group should be Template.Path/group.conf
  row   : null, // holds the template data for table rows should be Template.Path/row.conf
  header: null, // holds the template data for table headers should be Template.Path/headers.conf
  fields: null // holds the template data for fields should be Template.Path/fields.conf
}


/**
*   generice read function
*/
function LoadFile (fileToLoad) {

  return new Promise(function(resolve, reject) {
    Common.Message('Reading Template - ' + fileToLoad)
    // read out file
    require('fs').readFile(fileToLoad, 'utf8', function (error, result) {
      if (!error) {
        resolve(result)
      } else {
        reject('Error reading ' + fileToLoad)
      }
    })
  })
}

/**
* Hanlde reading the various template files needed to generate
* the bom
*/
exports.LoadTemplateFiles = function (config) {
  return new Promise(function (resolve, reject) {

      LoadFile(Path.join(config.templatePath, '/template.conf')).then(function(result) {
        Template.template = result
        LoadFile(Path.join(config.templatePath, '/group.conf')).then(function(result) {
          Template.group = result
          LoadFile(Path.join(config.templatePath, '/headers.conf')).then(function(result) {
            Template.header = result
            LoadFile(Path.join(config.templatePath, '/row.conf')).then(function(result) {
              Template.row = result
              LoadFile(Path.join(config.templatePath, '/fields.conf')).then(function(result) {
                Template.fields = result
                resolve(Template)
              }).catch(function(error) {
                reject(error)
              })
            }).catch(function(error) {
              reject(error)
            })
          }).catch(function(error) {
            reject(error)
          })
        }).catch(function(error) {
          reject(error)
        })
      }).catch(function(error) {
        reject(error)
      })
  })
}
