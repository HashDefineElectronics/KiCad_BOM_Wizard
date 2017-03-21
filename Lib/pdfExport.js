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
*   @file pdfExport.js
*
*   @author Ronald Sousa http://hashdefineelectronics.com/kicad-bom-wizard/
*
*   @description handle creating pdf based on input html files
*
*   {@link http://hashdefineelectronics.com/kicad-bom-wizard/|Project Page}
*
*   {@link https://github.com/HashDefineElectronics/KiCad_BOM_Wizard.git|Repository Page}
*
*/
"use strict"

var exports = module.exports

var Promise = require('promise')
var Common = require('./common.js')

/**
* Defines the default pdf options
*/
var DefaultOptions = {
  pageSize: 'A4',
  printBackground : true,
  landscape: true,
  marginsType : 0
}

/*
* This is the function that handle converting html to PDF
*/
exports.Make = function(htmlSource, outputPath, options, displayTime) {
    return new Promise( function(resolve, reject) {

      var WaitTime = 0
      var ShowPage = false
      var OptionTemp = DefaultOptions

      if (!htmlSource) {
        return reject('html file path is needed')
      }

      if (!Common.FileExist(htmlSource)) {
        return reject('html file does not exist [' + htmlSource+ ']')
      }

      if (!outputPath) {
        return reject('output path and file name is needed')
      }

      if (options) {
        OptionTemp = options
      }

      if (displayTime) {
        WaitTime = displayTime
        ShowPage = true
      }

      var Nightmare = require('nightmare')
      var nightmare = Nightmare({ show: ShowPage })

      nightmare
        .goto('file://' + htmlSource)
        .wait(WaitTime)
        .pdf(outputPath, OptionTemp)
        .end()
        .then(function (result) {
          resolve()
        })
        .catch(function (error) {
          return reject(error)
        })
    })
}
