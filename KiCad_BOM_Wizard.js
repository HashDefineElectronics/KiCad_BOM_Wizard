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
*   @version 0.0.9
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
*   Path is used to handle parsing system path urls
*/
var Path = require('path')

// make sure that we set the current working directory
var Common = require('./Lib/common.js')

var ComponentsData = null

// holds the BOM configuration
var BOMConfig = null
/**
*   Defines the plugin revision number
*/
var PluginRevisionNumber = '0.0.9'

/**
*   Defines the minimum number of arguments this plugins takes
*/
var MinmumNumOfExpectedArguments = 4

/**
*   holds the processed header data
*/
var OutputHeader = ''

/**
*   holds the template data for main body template should be BOMConfig.inputFile/template.conf
*/
var Template = null

/**
*   holds the template data for table group should be BOMConfig.inputFile/group.conf
*/
var GroupTemplate = null

/**
*   holds the template data for table rows should be BOMConfig.inputFile/row.conf
*/
var RowTemplate = null

/**
*   holds the template data for table headers
*   should be BOMConfig.inputFile/headers.conf
*/
var HeadersTemplate = null

/**
*   holds the template data for fields
*   should be BOMConfig.inputFile/fields.conf
*/
var FieldsTemplate = null

/**
*   Path is used to handle parsing system path urls
*/
var Path = require('path')

/**
*   Defines KiCad Revision number
*/
var KiCadXMLRevision = 'D'

Template = {
  DefaultPath  : Path.join(__dirname, '../Template/'), // was TemplateFolder
  Ouptut: {
    Template : null, // holds the template data for table group should be Template.Path/template.conf
    Group : null, // holds the template data for table group should be Template.Path/group.conf
    Row   : null, // holds the template data for table rows should be Template.Path/row.conf
    Header: null, // holds the template data for table headers should be Template.Path/headers.conf
    Fields: null // holds the template data for fields should be Template.Path/fields.conf
  },
}

// Get cli user arguments
StartProcess()

/**
*   creates the table
*
*   @param Components.sortMeta.fields the array that has all the various filed names
*   @param GroupedList the array that has all the parts grouped by the ref prefix
*   @param Components.GroupedList the array that actually contains all the parts data
*
*   @returns the output
*/
function GenerateTable (component) {

  var ReturnOutput = ''
  var FieldIndex = 0

  var ListOfheaders = RowTemplate.split('<!--ROW_PART_')
  OutputHeader = ''

  // now go through each element output the header
  if (ListOfheaders.length > 0) {
    for (var HeaderIndex = 0; HeaderIndex < ListOfheaders.length; HeaderIndex++) {
      if (ListOfheaders[HeaderIndex].indexOf('REF-->') !== -1) {
        OutputHeader += HeadersTemplate.replace(/<!--HEADER_ROW-->/g, 'Ref')
        OutputHeader = OutputHeader.replace(/<!--HEADER_CLASS_REF_TAG-->/g, 'HeadRefTag')
      } else if (ListOfheaders[HeaderIndex].indexOf('QTY-->') !== -1) {
        OutputHeader += HeadersTemplate.replace(/<!--HEADER_ROW-->/g, 'Qty')
        OutputHeader = OutputHeader.replace(/<!--HEADER_CLASS_QTY_TAG-->/g, 'HeadQtyTag')
      } else if (ListOfheaders[HeaderIndex].indexOf('VALUE-->') !== -1) {
        OutputHeader += HeadersTemplate.replace(/<!--HEADER_ROW-->/g, 'Value')
        OutputHeader = OutputHeader.replace(/<!--HEADER_CLASS_VALUE_TAG-->/g, 'HeadValueTag')
      } else if (ListOfheaders[HeaderIndex].indexOf('FOOTPRINT-->') !== -1) {
        OutputHeader += HeadersTemplate.replace(/<!--HEADER_ROW-->/g, 'Footprint')
        OutputHeader = OutputHeader.replace(/<!--HEADER_CLASS_FOOTPRINT_TAG-->/g, 'HeadFootprintTag')
      } else if (ListOfheaders[HeaderIndex].indexOf('FIELDS-->') !== -1) {
        // this will help us place the fileds header
        OutputHeader += '<!--FIELDS_HEADER_PLACEHOLDER-->'
      } else {
        // this is an unknown column
        continue
      }

      // this will ensure that all other tags are cleared from this column
      OutputHeader = OutputHeader.replace(/<!--HEADER_CLASS_REF_TAG-->/g, '')
      OutputHeader = OutputHeader.replace(/<!--HEADER_CLASS_QTY_TAG-->/g, '')
      OutputHeader = OutputHeader.replace(/<!--HEADER_CLASS_VALUE_TAG-->/g, '')
      OutputHeader = OutputHeader.replace(/<!--HEADER_CLASS_FOOTPRINT_TAG-->/g, '')
    }
  }

  var TempFieldHeader = ''

  for (FieldIndex = 0; FieldIndex < component.sortMeta.fields.length; FieldIndex++) {
    TempFieldHeader += HeadersTemplate.replace(/<!--HEADER_ROW-->/g, component.sortMeta.fields[ FieldIndex ])
    TempFieldHeader = TempFieldHeader.replace(/<!--HEADER_CLASS_REF_TAG-->/g, '')
    TempFieldHeader = TempFieldHeader.replace(/<!--HEADER_CLASS_QTY_TAG-->/g, '')
    TempFieldHeader = TempFieldHeader.replace(/<!--HEADER_CLASS_VALUE_TAG-->/g, '')
  }

  // now place it where it needs to be
  OutputHeader = OutputHeader.replace(/<!--FIELDS_HEADER_PLACEHOLDER-->/g, TempFieldHeader)

  // keep track if the table row is odd or even. true = even else is odd
  var RowIsEvenFlag = false

  for (var Group in component.sortMeta.groups) {
    // take a copy of the table template
    var TableTemp = GroupTemplate
    var GroupdName = component.sortMeta.groups[Group]

    TableTemp = TableTemp.replace(/<!--GROUP_CLASS_TAG-->/g, 'group_' + GroupdName)
    TableTemp = TableTemp.replace(/<!--GROUP_TITLE_TEXT-->/g, GroupdName)

    var TableRowAll = ''
    for (var Item in component.GroupedList[GroupdName]) {
      var TempRow = RowTemplate
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

      TempRow = TempRow.replace(/<!--HEADER_CLASS_REF_TAG-->/g, 'HeadRefTag')
      TempRow = TempRow.replace(/<!--HEADER_CLASS_QTY_TAG-->/g, 'HeadQtyTag')
      TempRow = TempRow.replace(/<!--HEADER_CLASS_VALUE_TAG-->/g, 'HeadValueTag')
      TempRow = TempRow.replace(/<!--HEADER_CLASS_FOOTPRINT_TAG-->/g, 'HeadFootprintTag')

      var FieldsTemp = ''

      for (FieldIndex = 0; FieldIndex < component.sortMeta.fields.length; FieldIndex++) {
        var SingleFieldTemp = FieldsTemplate

        SingleFieldTemp = SingleFieldTemp.replace(/<!--FIELD_CLASS_TAG-->/g, 'Field_' + component.sortMeta.fields[ FieldIndex ])

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

    ReturnOutput += TableTemp
  }
  return ReturnOutput
}

/**
*   This will generate the Bill of material based on the
*   template given
*/
function GenerateBOM (component) {
  if (Template != null) {
    Common.Message('Creating BOM')

    var Result = GenerateTable(component)

    Template = Template.replace(/<!--DATE_GENERATED-->/g, component.created)
    Template = Template.replace(/<!--TITLE-->/g, component.title)
    Template = Template.replace(/<!--DATE-->/g, component.date)
    Template = Template.replace(/<!--COMPANY-->/g, component.company)
    Template = Template.replace(/<!--REVISON-->/g, component.revision)
    Template = Template.replace(/<!--COMMENT_1-->/g, component.comment[0])
    Template = Template.replace(/<!--COMMENT_2-->/g, component.comment[1])
    Template = Template.replace(/<!--COMMENT_3-->/g, component.comment[2])
    Template = Template.replace(/<!--COMMENT_4-->/g, component.comment[3])
    Template = Template.replace(/<!--TOTAL_NUM_OF_PARTS-->/g, component.TotalNumberOfParts)
    Template = Template.replace(/<!--TOTAL_NUM_OF_UNIQUE_PARTS-->/g, component.NumberOfUniqueParts)
    Template = Template.replace(/<!--CLASS_HEADER_TAG-->/g, OutputHeader)
    Template = Template.replace(/<!--BOM_TABLE-->/g, Result)
    // output BOM
    var OutputFilePathWrite = require('fs')

    OutputFilePathWrite.writeFile(BOMConfig.output.path, Template, function (returnError) {
      if (returnError) {
        Common.Error(returnError)
      }

      Common.Message('BOM complete [ ' + BOMConfig.output.path + ' ]', null, true)
    })
  } else {
    Common.Error('Error creating BOM')
  }
}

/**
*   read template.conf
*/
function ReadTemplateFile () {
  var TemplateConfPath = Path.join(BOMConfig.templatePath, '/template.conf')
  Common.Message('Reading Template [ ' + TemplateConfPath + ' ]')

  var FileTemp = require('fs')

  FileTemp.readFile(TemplateConfPath, 'utf8', function (returnError, output) {
    // returnError should return null if the data was read correctly
    if (returnError === null) {
      Template = output
      Task('STATE_READ_TABLE_TEMPLATE')
    } else {
      Common.Error('Error reading template.conf')
    }
  })
}

/**
*   read group.conf
*/
function ReadGroupFile () {
  var GroupConfPath = Path.join(BOMConfig.templatePath, '/group.conf')
  var FileTemp = require('fs')

  FileTemp.readFile(GroupConfPath, 'utf8', function (returnError, output) {
    // returnError should return null if the data was read correctly
    if (returnError === null) {
      GroupTemplate = output
      Task('STATE_READ_TABLE_ROW_HEADER_TEMPLATE')
    } else {
      Common.Error('Error reading group.conf')
    }
  })
}

/**
*   read headers.conf
*/
function ReadHeadersFile () {
  var HeaderConfPath = Path.join(BOMConfig.templatePath, '/headers.conf')

  var FileTemp = require('fs')

  FileTemp.readFile(HeaderConfPath, 'utf8', function (returnError, output) {
    // returnError should return null if the data was read correctly
    if (returnError === null) {
      HeadersTemplate = output
      Task('STATE_READ_TABLE_ROW_TEMPLATE')
    } else {
      Common.Error('Error reading headers.conf')
    }
  })
}

/**
*   read row.conf
*/
function ReadRowFile () {
  var RowConfPath = Path.join(BOMConfig.templatePath, '/row.conf')
  var FileTemp = require('fs')

  FileTemp.readFile(RowConfPath, 'utf8', function (returnError, output) {
    // returnError should return null if the data was read correctly
    if (returnError === null) {
      RowTemplate = output
      Task('STATE_READ_Field_TEMPLATE')
    } else {
      Common.Error('Error reading row.conf')
    }
  })
}

/**
*   read fields.conf
*/
function ReadFieldFile () {
  var FieldsConfPath = Path.join(BOMConfig.templatePath, '/fields.conf')
  var FileTemp = require('fs')

  FileTemp.readFile(FieldsConfPath, 'utf8', function (returnError, output) {
    // returnError should return null if the data was read correctly
    if (returnError === null) {
      FieldsTemplate = output
      Task('STATE_GENERATE_BOM')
    } else {
      Common.Error('Error reading fields.conf')
    }
  })
}

/**
*   Handles the machine state.
*/
function Task (state) {
  switch (state) {

    case 'STATE_READ_TEMPLATE':
      ReadTemplateFile()
      break

    case 'STATE_READ_TABLE_TEMPLATE':
      ReadGroupFile()
      break

    case 'STATE_READ_TABLE_ROW_HEADER_TEMPLATE':
      ReadHeadersFile()
      break

    case 'STATE_READ_TABLE_ROW_TEMPLATE':
      ReadRowFile()
      break

    case 'STATE_READ_Field_TEMPLATE':
      ReadFieldFile()
      break

    case 'STATE_GENERATE_BOM':
      GenerateBOM(ComponentsData)
      break

    default:
      Common.Error('Task() default error')
      break
  }
}

/**
*   Handles getting the arguments pass to the plugin
*/
function StartProcess () {
  // print system information
  Common.Message('KiCad_BOM_Wizard Rev: ' + PluginRevisionNumber)

  var ConfigTemp = require('./Lib/configuration.js').Init(process.cwd(), Path.join(__dirname, '/Template/'))

  BOMConfig = ConfigTemp.Load(process.argv[2])
  // if the options were loaded the exist
  if (!BOMConfig) {
    // No options file given so try the system argument parameters
    BOMConfig = ConfigTemp.LoadOld(process.argv)

    if (!BOMConfig) {
      Common.Error("Unkown load error:")
    }
  }
  Common.Message("BOM Config:", BOMConfig)

  var ComponentsProcess = require('./Lib/component.js')
  ComponentsProcess.LoadAndProcessComponentList(BOMConfig)
  .then(function(result){
    ComponentsData = result
    Task('STATE_READ_TEMPLATE')
  })
  .catch(function(error){
    Common.Error(error)
  })
}
