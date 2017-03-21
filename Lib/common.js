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
*   @file common.js
*
*   @author Ronald Sousa http://hashdefineelectronics.com/kicad-bom-wizard/
*
*   @description holds some of the common function and settings
*
*   {@link http://hashdefineelectronics.com/kicad-bom-wizard/|Project Page}
*
*   {@link https://github.com/HashDefineElectronics/KiCad_BOM_Wizard.git|Repository Page}
*
*/
"use strict"

var exports = module.exports

var Path = require('path')

/**
* if set to true then it will debug output message
*/
exports.Verbose = false

/**
*   This function can be used to check if the given file
*   exist
*
*   @returns true on success else false false
*/
exports.FileExist = function (path) {
  // first check if directory exist
  var FileSystem = require('fs')
  try {
    if (FileSystem.statSync(path).isFile()) {
      return true
    }
  } catch (ex) {
    // we can ignore the error message
  }

  return false
}

/**
*   This function can be used to check if the given folder path
*   exist
*
*   @param path this is the file of folder directory
*   @param isDirectory true then will test for directroy else will test for file
*   @returns true on success else false false
*/
exports.PathExsist = function (path, isDirectory) {
  // first check if directory exist
  var FileSystem = require('fs')
  try {
    if (isDirectory) {
      if (FileSystem.statSync(path).isDirectory()) {
        return true
      }
    } else {
      if (FileSystem.statSync(path).isFile()) {
        return true
      }
    }
  } catch (ex) {
    // we can ignore the error message
  }

  return false
}

/*
*   this function is used to make a standard format
*   for error messages.
*   this also handle exiting the program
*/
exports.Message = function (message, data, verbose) {

  if(verbose || exports.Verbose) {
    if (data) {
      console.log(message.toUpperCase() + "\n\n", data, "\n\n")
    } else {
      console.log(message)
    }
  }
}

/**
*   this function is used to make a standard format
*   for error messages.
*   this also handle exiting the program
*/

exports.Error = function(message) {
  var MessageTemp = '** Error **\n\t' + message + '\n\n'
  console.trace(MessageTemp)
  process.exit(1)
}
