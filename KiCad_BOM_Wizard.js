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
*   @version 0.0.7
*
*   @fileoverview This KiCad plugin can be used to create custom BOM files based on easy
*   configurable templates files. The plugin is writing in JavaScript and has been
*   designed to integrate into KiCad’s BOM plugin manager.
*
*   {@link http://hashdefineelectronics.com/kicad-bom-wizard/|Project Page}
*
*   {@link https://github.com/HashDefineElectronics/KiCad_BOM_Wizard.git|Repository Page}
*
*   @requires xml2js
*
*/

/**
*   Defines the plugin revision number
*/
var PluginRevisionNumber = '0.0.7'

/**
*   Defines KiCad Revision number
*/
var KiCadXMLRevision = 'D'

/**
*   Defines the minimum number of arguments this plugins takes
*/
var MinmumNumOfExpectedArguments = 4

/**
*   holds the processed header data
*/
var OutputHeader = ''

/**
*   holds the template data for main body template should be KiCadXmlFilePath/template.conf
*/
var Template = null

/**
*   holds the template data for table group should be KiCadXmlFilePath/group.conf
*/
var GroupTemplate = null

/**
*   holds the template data for table rows should be KiCadXmlFilePath/row.conf
*/
var RowTemplate = null

/**
*   holds the template data for table headers
*   should be KiCadXmlFilePath/headers.conf
*/
var HeadersTemplate = null

/**
*   holds the template data for fields
*   should be KiCadXmlFilePath/fields.conf
*/
var FieldsTemplate = null

/**
*   This is the project KiCad XML file to use to
*   extract the BOM information
*/
var KiCadXmlFilePath = ''

/**
*   the path and file name to use to create the output BOM
*/
var OutputFilePath = ''

/**
*   Path is used to handle parsing system path urls
*/
var Path = require('path')

/**
*   This is the path to the template files to use
*   when creating the BOM
*/
var TemplateFolder = Path.join(__dirname, '/Template/')

/**
*   javascript object class of the KiCadXmlFilePath file
*/
var UserProjectNetData = null

/**
*   keep track of the number of unique parts found while
*   creating the BOM
*/
var NumberOfUniqueParts = 0

/**
*   keep track of the number of parts found while
*   creating the BOM
*/
var TotalNumberOfParts = 0

// Get cli user arguments
GetArguments()

// print system information
PluginDetails()

// Run the first task.
Task('STATE_GET_XML_DATA')

/**
*   This will check the entire part list for a matching
*   value and fields and return the part's index number that matches
*
*   @param source holds the original list of unsorted parts
*   @param searchTerm the part information to search for
*   @param listOfGroups holds the list of groups
*
*   @returns -1 = no match else the index number of the found item
*/
function SearchUniquePartIndex (source, searchTerm, listOfGroups) {
  for (var Index = 0; Index < source.length; Index++) {
    // reset the filed test flag. this will ensure that we check the next part that might have all the matching fields
    var FieldsTestResult = true
    // part value matches
    if (searchTerm.Value[0] === source[Index].Value[0] && searchTerm.Footprint === source[Index].Footprint) {
      for (var FieldIndex = 0; FieldIndex < listOfGroups.length; FieldIndex++) {
        // If either one is true
        if (listOfGroups[ FieldIndex ] in searchTerm.Fields || listOfGroups[ FieldIndex ] in source[Index].Fields) {
          // If either one is true then both have to be set
          if (listOfGroups[ FieldIndex ] in searchTerm.Fields &&
                listOfGroups[ FieldIndex ] in source[Index].Fields &&
                searchTerm.Fields[ listOfGroups[ FieldIndex ] ] === source[Index].Fields[ listOfGroups[ FieldIndex ] ]) {
            // Do nothing
          } else {
            FieldsTestResult = false
          }
        }
      }

      // We have a match
      if (FieldsTestResult) {
        return Index
      }
    }
  }

  return -1
}

/**
*   creates the table
*
*   @param fieldsList the array that has all the various filed names
*   @param GroupedList the array that has all the parts grouped by the ref prefix
*   @param partGroupedList the array that actually contains all the parts data
*
*   @returns the output
*/
function GenerateTable (fieldsList, groupedList, partGroupedList) {
  var ReturnOutput = ''
  var FieldIndex = 0

  var ListOfheaders = RowTemplate.split("<!--ROW_PART_");
  OutputHeader = ""


  // now go through each element output the header
  if (ListOfheaders.length > 0) {

    for( HeaderIndex = 0; HeaderIndex < ListOfheaders.length; HeaderIndex++ ) {

      if (ListOfheaders[HeaderIndex].indexOf('REF-->') !== -1 ) {
        OutputHeader += HeadersTemplate.replace(/<!--HEADER_ROW-->/g, 'Ref')
        OutputHeader = OutputHeader.replace(/<!--HEADER_CLASS_REF_TAG-->/g, 'HeadRefTag')

      } else if (ListOfheaders[HeaderIndex].indexOf('QTY-->') !== -1 ) {
        OutputHeader += HeadersTemplate.replace(/<!--HEADER_ROW-->/g, 'Qty')
        OutputHeader = OutputHeader.replace(/<!--HEADER_CLASS_QTY_TAG-->/g, 'HeadQtyTag')

      } else if (ListOfheaders[HeaderIndex].indexOf('VALUE-->') !== -1 ) {
        OutputHeader += HeadersTemplate.replace(/<!--HEADER_ROW-->/g, 'Value')
        OutputHeader = OutputHeader.replace(/<!--HEADER_CLASS_VALUE_TAG-->/g, 'HeadValueTag')

      } else if (ListOfheaders[HeaderIndex].indexOf('FOOTPRINT-->') !== -1 ) {
        OutputHeader += HeadersTemplate.replace(/<!--HEADER_ROW-->/g, 'Footprint')
        OutputHeader = OutputHeader.replace(/<!--HEADER_CLASS_FOOTPRINT_TAG-->/g, 'HeadFootprintTag')

      } else if (ListOfheaders[HeaderIndex].indexOf('FIELDS-->') !== -1 ){
        // this will help us place the fileds header
        OutputHeader += "<!--FIELDS_HEADER_PLACEHOLDER-->"
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

  fieldsList.sort()
  var TempFieldHeader = ""

  for (FieldIndex = 0; FieldIndex < fieldsList.length; FieldIndex++) {
    TempFieldHeader += HeadersTemplate.replace(/<!--HEADER_ROW-->/g, fieldsList[ FieldIndex ])
    TempFieldHeader = TempFieldHeader.replace(/<!--HEADER_CLASS_REF_TAG-->/g, '')
    TempFieldHeader = TempFieldHeader.replace(/<!--HEADER_CLASS_QTY_TAG-->/g, '')
    TempFieldHeader = TempFieldHeader.replace(/<!--HEADER_CLASS_VALUE_TAG-->/g, '')
  }

  // now place it where it needs to be
  OutputHeader = OutputHeader.replace(/<!--FIELDS_HEADER_PLACEHOLDER-->/g, TempFieldHeader)

  groupedList.sort()

  // keep track if the table row is odd or even. true = even else is odd
  var RowIsEvenFlag = false
  var HeaderToUse
  for (var Group in groupedList) {
    // take a copy of the table template
    var TableTemp = GroupTemplate
    var GroupdName = groupedList[Group]

    TableTemp = TableTemp.replace(/<!--GROUP_CLASS_TAG-->/g, 'group_' + GroupdName)
    TableTemp = TableTemp.replace(/<!--GROUP_TITLE_TEXT-->/g, GroupdName)

    var TableRowAll = ''
    for (var Item in partGroupedList[GroupdName]) {
      var TempRow = RowTemplate
      var RefTemp = ''

      for (var Ref in partGroupedList[GroupdName][Item].Ref) {
        RefTemp += Ref + ' '
      }

      if (RowIsEvenFlag) {
        TempRow = TempRow.replace(/<!--ROW_CLASS_ODD_EVEN_TAG-->/g, 'RowEvenTag')
      } else {
        TempRow = TempRow.replace(/<!--ROW_CLASS_ODD_EVEN_TAG-->/g, 'RowOddTag')
      }
      TempRow = TempRow.replace(/<!--ROW_PART_REF-->/g, RefTemp)
      TempRow = TempRow.replace(/<!--ROW_PART_QTY-->/g, partGroupedList[GroupdName][Item].Count)
      TempRow = TempRow.replace(/<!--ROW_PART_VALUE-->/g, partGroupedList[GroupdName][Item].Value)
      TempRow = TempRow.replace(/<!--ROW_PART_FOOTPRINT-->/g, partGroupedList[GroupdName][Item].Footprint)

      TempRow = TempRow.replace(/<!--HEADER_CLASS_REF_TAG-->/g, 'HeadRefTag')
      TempRow = TempRow.replace(/<!--HEADER_CLASS_QTY_TAG-->/g, 'HeadQtyTag')
      TempRow = TempRow.replace(/<!--HEADER_CLASS_VALUE_TAG-->/g, 'HeadValueTag')
      TempRow = TempRow.replace(/<!--HEADER_CLASS_FOOTPRINT_TAG-->/g, 'HeadFootprintTag')

      var FieldsTemp = ''

      for (FieldIndex = 0; FieldIndex < fieldsList.length; FieldIndex++) {
        var SingleFieldTemp = FieldsTemplate

        SingleFieldTemp = SingleFieldTemp.replace(/<!--FIELD_CLASS_TAG-->/g, 'Field_' + fieldsList[ FieldIndex ])

        if (partGroupedList[ GroupdName ][ Item ].Fields[ fieldsList[ FieldIndex ] ]) {
          SingleFieldTemp = SingleFieldTemp.replace(/<!--FIELD-->/g, partGroupedList[ GroupdName ][ Item ].Fields[ fieldsList[ FieldIndex ] ].replace(/,/g, ' '))
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
*   return the generated part table
*
*   @returns the output
*/
function ExtractAndGenerateDataForThePart () {
  var PartGroupedList = []
  // holds the list of groups. This is used to make sorting easier
  var GroupedList = []
  var UniquePartList = []
  var ListOfFields = []
  NumberOfUniqueParts = 0
  TotalNumberOfParts = 0
  var PartIndex = 0

  // Get the list of groups we are going to use
  UserProjectNetData.export.components[0].comp.forEach(function (Part) {
    if (Part.fields) {
      console.log(typeof Part.fields);
      Part.fields.forEach(function (value) {
      	if(value.field){
      		value.field.forEach(function (value) {
	          if (ListOfFields.indexOf(value.$.name) === -1) {
	            // if the returned index is -1 then we know  that we know we don't have this item
	            ListOfFields.push(value.$.name)
	          }
	        })
      	}
        
      })
    }
  })

  // get the list of fields and grouped the component with the same value
  UserProjectNetData.export.components[0].comp.forEach(function (Part) {
    var TempFieldHolder = []

    if (Part.fields) {
      Part.fields.forEach(function (value) {
      	if(value.field){
	        value.field.forEach(function (value) {
	          TempFieldHolder[value.$.name] = value['_']
	        })
    	}
      })
    }

    var FootprintValue = ''

    // get the component footprint if its not been defined or left empty
    if (typeof Part.footprint !== 'undefined' && typeof Part.footprint[0] !== 'undefined') {
      FootprintValue = Part.footprint[0]
    }

    var TempPart = {'Value': Part.value, 'Count': 1, 'Ref': [], 'Fields': TempFieldHolder, 'Footprint': FootprintValue, 'RefPrefix': Part.$.ref.replace(/[0-9]/g, '')}

    PartIndex = SearchUniquePartIndex(UniquePartList, TempPart, ListOfFields)

    // Do we have this part?
    if (PartIndex === -1) {
      UniquePartList.push(TempPart)
      PartIndex = UniquePartList.length
      PartIndex--

      UniquePartList[PartIndex].Ref[Part.$.ref] = Part.$.ref

      if (Part.fields) {
        Part.fields.forEach(function (value) {
          if(value.field){
	          value.field.forEach(function (value) {
	            if (ListOfFields.indexOf(value.$.name) === -1) {
	              // if the returned index is -1 then we know  that we know we don't have this item
	              ListOfFields.push(value.$.name)
	            }
	          })
      	  }
        })
      }

      if (typeof PartGroupedList[UniquePartList[PartIndex].RefPrefix] === 'undefined') {
        GroupedList.push(UniquePartList[PartIndex].RefPrefix)
        PartGroupedList[UniquePartList[PartIndex].RefPrefix] = []
        PartGroupedList[UniquePartList[PartIndex].RefPrefix].push(UniquePartList[PartIndex])
      } else {
        PartGroupedList[UniquePartList[PartIndex].RefPrefix].push(UniquePartList[PartIndex])
      }

      NumberOfUniqueParts++
    } else {
      UniquePartList[PartIndex].Count++
      UniquePartList[PartIndex].Ref[Part.$.ref] = Part.$.ref
    }

    TotalNumberOfParts++
  })

  return GenerateTable(ListOfFields, GroupedList, PartGroupedList)
}

/**
*   This will generate the Bill of material based on the
*   template given
*/
function GenerateBOM () {
  if (UserProjectNetData != null && Template != null) {
    Message('Generating BOM [ ' + OutputFilePath + ' ]')

    var Result = ExtractAndGenerateDataForThePart()

    Template = Template.replace(/<!--DATE_GENERATED-->/g, UserProjectNetData.export.design[0].date)
    Template = Template.replace(/<!--TITLE-->/g, UserProjectNetData.export.design[0].sheet[0].title_block[0].title)
    Template = Template.replace(/<!--DATE-->/g, UserProjectNetData.export.design[0].sheet[0].title_block[0].date)
    Template = Template.replace(/<!--COMPANY-->/g, UserProjectNetData.export.design[0].sheet[0].title_block[0].company)
    Template = Template.replace(/<!--REVISON-->/g, UserProjectNetData.export.design[0].sheet[0].title_block[0].rev)
    Template = Template.replace(/<!--COMMENT_1-->/g, UserProjectNetData.export.design[0].sheet[0].title_block[0].comment[0].$.value)
    Template = Template.replace(/<!--COMMENT_2-->/g, UserProjectNetData.export.design[0].sheet[0].title_block[0].comment[1].$.value)
    Template = Template.replace(/<!--COMMENT_3-->/g, UserProjectNetData.export.design[0].sheet[0].title_block[0].comment[2].$.value)
    Template = Template.replace(/<!--COMMENT_4-->/g, UserProjectNetData.export.design[0].sheet[0].title_block[0].comment[3].$.value)
    Template = Template.replace(/<!--TOTAL_NUM_OF_PARTS-->/g, TotalNumberOfParts)
    Template = Template.replace(/<!--TOTAL_NUM_OF_UNIQUE_PARTS-->/g, NumberOfUniqueParts)
    Template = Template.replace(/<!--CLASS_HEADER_TAG-->/g, OutputHeader)
    Template = Template.replace(/<!--BOM_TABLE-->/g, Result)
    // output BOM
    var OutputFilePathWrite = require('fs')

    OutputFilePathWrite.writeFile(OutputFilePath, Template, function (returnError) {
      if (returnError) {
        ErrorMessage(returnError)
      }

      Message('BOM created')
    })
  } else {
    ErrorMessage('Error generating BOM')
  }
}

/**
*   read the user KiCad file. This will also convert the
*   the xml data to javascript object.
*/
function ReadXmlFile () {
  var xml2js = require('xml2js')
  var parser = new xml2js.Parser()

  var XMLFile = require('fs')

  Message('reading KiCad XML file [ ' + KiCadXmlFilePath + ' ]')

  XMLFile.readFile(KiCadXmlFilePath, function (returnError, output) {
    // returnError should return null if the file was read correctly
    if (returnError === null) {
      // Convert kicad XML data to javascript object class
      parser.parseString(output, function (returnError, result) {
        // returnError should return null if the data was converted correctly
        if (returnError === null) {
          UserProjectNetData = result

          if (UserProjectNetData.export.$.version !== KiCadXMLRevision) {
            ErrorMessage('Incompatible KiCad XML version: Expected ' + KiCadXMLRevision + ' Found ' + UserProjectNetData.export.$.version)
          }

          Task('STATE_READ_TEMPLATE')
        } else {
          ErrorMessage(returnError)
        }
      })
    } else {
      ErrorMessage(returnError)
    }
  })
}

/**
*   read template.conf
*/
function ReadTemplateFile () {
  Message('Reading Template [ ' + TemplateFolder + ' ]')

  var FileTemp = require('fs')

  FileTemp.readFile(TemplateFolder + '/template.conf', 'utf8', function (returnError, output) {
    // returnError should return null if the data was read correctly
    if (returnError === null) {
      Template = output
      Task('STATE_READ_TABLE_TEMPLATE')
    } else {
      ErrorMessage('Error reading template.conf')
    }
  })
}

/**
*   read group.conf
*/
function ReadGroupFile () {
  var FileTemp = require('fs')

  FileTemp.readFile(TemplateFolder + '/group.conf', 'utf8', function (returnError, output) {
    // returnError should return null if the data was read correctly
    if (returnError === null) {
      GroupTemplate = output
      Task('STATE_READ_TABLE_ROW_HEADER_TEMPLATE')
    } else {
      ErrorMessage('Error reading group.conf')
    }
  })
}

/**
*   read headers.conf
*/
function ReadHeadersFile () {
  var FileTemp = require('fs')

  FileTemp.readFile(TemplateFolder + '/headers.conf', 'utf8', function (returnError, output) {
    // returnError should return null if the data was read correctly
    if (returnError === null) {
      HeadersTemplate = output
      Task('STATE_READ_TABLE_ROW_TEMPLATE')
    } else {
      ErrorMessage('Error reading headers.conf')
    }
  })
}

/**
*   read row.conf
*/
function ReadRowFile () {
  var FileTemp = require('fs')

  FileTemp.readFile(TemplateFolder + '/row.conf', 'utf8', function (returnError, output) {
    // returnError should return null if the data was read correctly
    if (returnError === null) {
      RowTemplate = output
      Task('STATE_READ_Field_TEMPLATE')
    } else {
      ErrorMessage('Error reading row.conf')
    }
  })
}

/**
*   read fields.conf
*/
function ReadFieldFile () {
  var FileTemp = require('fs')

  FileTemp.readFile(TemplateFolder + '/fields.conf', 'utf8', function (returnError, output) {
    // returnError should return null if the data was read correctly
    if (returnError === null) {
      FieldsTemplate = output
      Task('STATE_GENERATE_BOM')
    } else {
      ErrorMessage('Error reading fields.conf')
    }
  })
}

/**
*   Handles getting the arguments pass to the plugin
*/
function GetArguments () {
  // make sure that we have enough parameter to continue
  if (process.argv.length < MinmumNumOfExpectedArguments) {
    ErrorMessage('Too few arguments. Found ' + process.argv.length + ' Expected at least ' + MinmumNumOfExpectedArguments)
  }

  KiCadXmlFilePath = process.argv[2]
  OutputFilePath = process.argv[3]

  if (process.argv.length > MinmumNumOfExpectedArguments) {
    // the user has specified template they wish to use.

    if (PathExist(process.argv[4])) {
      // check if use template path exist

      TemplateFolder = process.argv[4]
    } else if (PathExist(TemplateFolder + process.argv[4])) {
      // now check if the user is wanting to use a  template in KiCad_BOM_Wizard/Template

      TemplateFolder += process.argv[4]
    } else {
      ErrorMessage('Template directory not found: [ ' + process.argv[4] + ' ]')
    }
  } else {
    TemplateFolder += 'HTML'
  }
}

/**
*   This function can be used to check if the given path
*   exist
*
*   @returns true on success else false false
*/
function PathExist (path) {
  // first check if directory exist
  var FileSystem = require('fs')
  try {
    if (FileSystem.statSync(path).isDirectory()) {
      return true
    }
  } catch (ex) {
    // we can ignore the error message
  }

  return false
}

/**
*   Handles the machine state.
*/
function Task (state) {
  switch (state) {
    case 'STATE_GET_XML_DATA':
      ReadXmlFile()
      break

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
      GenerateBOM()
      break

    default:
      ErrorMessage('Task() default error')
      break
  }
}

/*
*   This function will display the plugin information
*   and the data pass by user.
*/
function PluginDetails () {
  console.log('KiCad_BOM_Wizard Rev: ' + PluginRevisionNumber)
}

/**
*   this function is used to make a standard format
*   for error messages.
*   this also handle exiting the program
*/
function ErrorMessage (message) {
  console.log('\n\n')
  console.log('Error *****')
  console.log(message)
  console.log('\n\n')
  process.exit(1)
}

/*
*   this function is used to make a standard format
*   for error messages.
*   this also handle exiting the program
*/
function Message (message) {
  console.log(message)
}
