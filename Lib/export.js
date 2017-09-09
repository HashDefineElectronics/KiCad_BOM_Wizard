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
*   @file export.js
*
*   @author Ronald Sousa http://hashdefineelectronics.com/kicad-bom-wizard/
*
*   @description this module handle creating the various BOm files based on the configuration, template and component list
*
*   {@link http://hashdefineelectronics.com/kicad-bom-wizard/|Project Page}
*
*   {@link https://github.com/HashDefineElectronics/KiCad_BOM_Wizard.git|Repository Page}
*
*/
var exports = module.exports
var Common = require('./common.js')
var PDF = require('./pdfExport')
var Path = require('path')

/**
*   creates the table
*
*   @param Components.sortMeta.fields the array that has all the various filed names
*   @param GroupedList the array that has all the parts grouped by the ref prefix
*   @param Components.GroupedList the array that actually contains all the parts data
*
*   @returns the output
*/
function GenerateTable (component, template) {
  var HeaderTemp = ''
  var BodyTemp = ''
  var FieldIndex = 0

  var ListOfheaders = template.row.split('<!--ROW_PART_')
  HeaderTemp = ''

  // now go through each element output the header
  if (ListOfheaders.length > 0) {
    for (var HeaderIndex = 0; HeaderIndex < ListOfheaders.length; HeaderIndex++) {
      if (ListOfheaders[HeaderIndex].indexOf('REF-->') !== -1) {
        HeaderTemp += template.header.replace(/<!--HEADER_ROW-->/g, 'Ref')
        HeaderTemp = HeaderTemp.replace(/<!--HEADER_CLASS_REF_TAG-->/g, 'HeadRefTag')
      } else if (ListOfheaders[HeaderIndex].indexOf('QTY-->') !== -1) {
        HeaderTemp += template.header.replace(/<!--HEADER_ROW-->/g, 'Qty')
        HeaderTemp = HeaderTemp.replace(/<!--HEADER_CLASS_QTY_TAG-->/g, 'HeadQtyTag')
      } else if (ListOfheaders[HeaderIndex].indexOf('VALUE-->') !== -1) {
        HeaderTemp += template.header.replace(/<!--HEADER_ROW-->/g, 'Value')
        HeaderTemp = HeaderTemp.replace(/<!--HEADER_CLASS_VALUE_TAG-->/g, 'HeadValueTag')
      } else if (ListOfheaders[HeaderIndex].indexOf('FOOTPRINT-->') !== -1) {
        HeaderTemp += template.header.replace(/<!--HEADER_ROW-->/g, 'Footprint')
        HeaderTemp = HeaderTemp.replace(/<!--HEADER_CLASS_FOOTPRINT_TAG-->/g, 'HeadFootprintTag')
      } else if (ListOfheaders[HeaderIndex].indexOf('DATASHEET-->') !== -1) {
        HeaderTemp += template.header.replace(/<!--HEADER_ROW-->/g, 'Datasheet')
        HeaderTemp = HeaderTemp.replace(/<!--HEADER_CLASS_DATASHEET_TAG-->/g, 'HeadDatasheetTag')
      } else if (ListOfheaders[HeaderIndex].indexOf('FIELDS-->') !== -1) {
        // this will help us place the fileds header
        HeaderTemp += '<!--FIELDS_HEADER_PLACEHOLDER-->'
      } else {
        // this is an unknown column
        continue
      }

      // this will ensure that all other tags are cleared from this column
      HeaderTemp = HeaderTemp.replace(/<!--HEADER_CLASS_REF_TAG-->/g, '')
      HeaderTemp = HeaderTemp.replace(/<!--HEADER_CLASS_QTY_TAG-->/g, '')
      HeaderTemp = HeaderTemp.replace(/<!--HEADER_CLASS_VALUE_TAG-->/g, '')
      HeaderTemp = HeaderTemp.replace(/<!--HEADER_CLASS_FOOTPRINT_TAG-->/g, '')
      HeaderTemp = HeaderTemp.replace(/<!--HEADER_CLASS_DATASHEET_TAG-->/g, '')
      HeaderTemp = HeaderTemp.replace(/<!--HEADER_CLASS_FIELDS-->/g, '')
    }
  }

  var TempFieldHeader = ''

  for (FieldIndex = 0; FieldIndex < component.sortMeta.fields.length; FieldIndex++) {
    TempFieldHeader += template.header.replace(/<!--HEADER_ROW-->/g, component.sortMeta.fields[ FieldIndex ])
    TempFieldHeader = TempFieldHeader.replace(/<!--HEADER_CLASS_REF_TAG-->/g, '')
    TempFieldHeader = TempFieldHeader.replace(/<!--HEADER_CLASS_QTY_TAG-->/g, '')
    TempFieldHeader = TempFieldHeader.replace(/<!--HEADER_CLASS_VALUE_TAG-->/g, '')
    TempFieldHeader = TempFieldHeader.replace(/<!--HEADER_CLASS_FOOTPRINT_TAG-->/g, '')
    TempFieldHeader = TempFieldHeader.replace(/<!--HEADER_CLASS_DATASHEET_TAG-->/g, '')
    TempFieldHeader = TempFieldHeader.replace(/<!--HEADER_CLASS_FIELDS-->/g, 'HeadField_' + component.sortMeta.fields[ FieldIndex ].replace(' ','_'))
  }

  // now place it where it needs to be
  HeaderTemp = HeaderTemp.replace(/<!--FIELDS_HEADER_PLACEHOLDER-->/g, TempFieldHeader)

  // keep track if the table row is odd or even. true = even else is odd
  var RowIsEvenFlag = false

  for (var Group in component.sortMeta.groups) {
    // take a copy of the table template
    var TableTemp = template.group
    var GroupdName = component.sortMeta.groups[Group]

    TableTemp = TableTemp.replace(/<!--GROUP_CLASS_TAG-->/g, 'group_' + GroupdName)
    TableTemp = TableTemp.replace(/<!--GROUP_TITLE_TEXT-->/g, GroupdName)

    var TableRowAll = ''
    for (var Item in component.GroupedList[GroupdName]) {
      var TempRow = template.row
      var RefTemp = ''

      for (var RefIndex in component.GroupedList[GroupdName][Item].Ref) {
        RefTemp += GroupdName + component.GroupedList[GroupdName][Item].Ref[RefIndex] + ' '
      }

      if (RowIsEvenFlag) {
        TempRow = TempRow.replace(/<!--ROW_CLASS_ODD_EVEN_TAG-->/g, 'RowEvenTag')
      } else {
        TempRow = TempRow.replace(/<!--ROW_CLASS_ODD_EVEN_TAG-->/g, 'RowOddTag')
      }
      TempRow = TempRow.replace(/<!--ROW_PART_REF-->/g, RefTemp)
      TempRow = TempRow.replace(/<!--ROW_PART_QTY-->/g, component.GroupedList[GroupdName][Item].Count)
      TempRow = TempRow.replace(/<!--ROW_PART_VALUE-->/g, component.GroupedList[GroupdName][Item].Value)
      TempRow = TempRow.replace(/<!--ROW_PART_FOOTPRINT-->/g, component.GroupedList[GroupdName][Item].Footprint)
      TempRow = TempRow.replace(/<!--ROW_PART_DATASHEET-->/g, component.GroupedList[GroupdName][Item].Datasheet)

      TempRow = TempRow.replace(/<!--HEADER_CLASS_REF_TAG-->/g, 'HeadRefTag')
      TempRow = TempRow.replace(/<!--HEADER_CLASS_QTY_TAG-->/g, 'HeadQtyTag')
      TempRow = TempRow.replace(/<!--HEADER_CLASS_VALUE_TAG-->/g, 'HeadValueTag')
      TempRow = TempRow.replace(/<!--HEADER_CLASS_FOOTPRINT_TAG-->/g, 'HeadFootprintTag')
      TempRow = TempRow.replace(/<!--HEADER_CLASS_DATASHEET_TAG-->/g, 'HeadDatasheetTag')

      var FieldsTemp = ''

      for (FieldIndex = 0; FieldIndex < component.sortMeta.fields.length; FieldIndex++) {
        var SingleFieldTemp = template.fields

        SingleFieldTemp = SingleFieldTemp.replace(/<!--FIELD_CLASS_TAG-->/g, 'Field_' + component.sortMeta.fields[ FieldIndex ].replace(' ','_'))

        if (component.GroupedList[ GroupdName ][ Item ].Fields[ component.sortMeta.fields[ FieldIndex ] ]) {
          SingleFieldTemp = SingleFieldTemp.replace(/<!--FIELD-->/g, component.GroupedList[ GroupdName ][ Item ].Fields[ component.sortMeta.fields[ FieldIndex ] ].replace(/,/g, ' '))
        } else {
          SingleFieldTemp = SingleFieldTemp.replace(/<!--FIELD-->/g, ' ')
        }

        FieldsTemp += SingleFieldTemp
      }

      TableRowAll += TempRow.replace(/<!--ROW_PART_FIELDS-->/g, FieldsTemp)

      RowIsEvenFlag = !RowIsEvenFlag
    }

    TableTemp = TableTemp.replace(/<!--GROUP_ROW_DATA-->/g, TableRowAll)
    // make a copy
    BodyTemp += TableTemp
  }

  return {header: HeaderTemp, body: BodyTemp}
}

/**
*   This will generate the Bill of material based on the
*   template given
*/
exports.CreateBOM = function (config, component, template) {

  return new Promise(function(resolve, reject) {
    if (!template) {
      return reject('invalid template data')
    }

    if (!config) {
      return reject('invalid config data')
    }

    if (!component) {
      return reject('invalid component data')
    }

    Common.Message('Starting BOM export')

    var Table = GenerateTable(component, template)

    var TemplateFinal = template.template

    TemplateFinal = TemplateFinal.replace(/<!--DATE_GENERATED-->/g, component.created)
    TemplateFinal = TemplateFinal.replace(/<!--TITLE-->/g, component.title)
    TemplateFinal = TemplateFinal.replace(/<!--DATE-->/g, component.date)
    TemplateFinal = TemplateFinal.replace(/<!--COMPANY-->/g, component.company)
    TemplateFinal = TemplateFinal.replace(/<!--REVISON-->/g, component.revision)
    TemplateFinal = TemplateFinal.replace(/<!--COMMENT_1-->/g, component.comment[0])
    TemplateFinal = TemplateFinal.replace(/<!--COMMENT_2-->/g, component.comment[1])
    TemplateFinal = TemplateFinal.replace(/<!--COMMENT_3-->/g, component.comment[2])
    TemplateFinal = TemplateFinal.replace(/<!--COMMENT_4-->/g, component.comment[3])
    TemplateFinal = TemplateFinal.replace(/<!--TOTAL_NUM_OF_PARTS-->/g, component.TotalNumberOfParts)
    TemplateFinal = TemplateFinal.replace(/<!--TOTAL_NUM_OF_UNIQUE_PARTS-->/g, component.NumberOfUniqueParts)
    TemplateFinal = TemplateFinal.replace(/<!--CLASS_HEADER_TAG-->/g, Table.header)
    TemplateFinal = TemplateFinal.replace(/<!--BOM_TABLE-->/g, Table.body)

    var CreatePromise = CreateFile(config, TemplateFinal)

    CreatePromise.then(function(result) {
      return resolve(result)
    })
    .catch(function(error) {
      return reject(error)
    })
  })
}

/**
* handle creating the file file or PDF
*/
function CreateFile (config, output) {
  return new Promise(function(resolve, reject) {
    var TempPath = config.output.path

    if (config.outputType === 'PDF') {
      // if this is a PDF then file file we write will be the temp file
      TempPath = config.tempFilePath
    }

    require('fs').writeFile(TempPath, output, function (error) {
      if (!error) {
        if (config.outputType === 'PDF') {
          // create PDF file
          var PDFPromise = PDF.Make(TempPath, config.output.path, config.pdfOptions, config.pdfOptions.showPage ? 3000 : null)
          PDFPromise.then(function() {

            if (!config.keepTempFile) {
              // delete temp file used to create the PDF
              require('fs').unlink(TempPath, function(error){
                if(!error) {
                  return resolve('Export complete - ' + config.output.path )
                }
                return reject(error)
              })
            } else {
              return resolve('Export complete - ' + config.tempFilePath )
            }
          })
          .catch(function(error) {
            reject(error)
          })
        } else {
          return resolve('Export complete - ' + config.output.path )
        }
        return resolve('Export complete - ' + config.output.path )
      } else {
        return reject(error)
      }
    })
  })
}
