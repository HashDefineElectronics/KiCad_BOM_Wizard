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
*   @file component.js
*
*   @author Ronald Sousa http://hashdefineelectronics.com/kicad-bom-wizard/
*
*   @description this module handle reading and processing the KiCad net or XML list
*
*   {@link http://hashdefineelectronics.com/kicad-bom-wizard/|Project Page}
*
*   {@link https://github.com/HashDefineElectronics/KiCad_BOM_Wizard.git|Repository Page}
*
*/
var exports = module.exports

var Common = require('./common.js')
var Promise = require('promise')

/**
*   Defines KiCad Revision number
*/
var KiCadXMLRevision = 'D'

/**
* Holds the components list.
*/
var Components = {
  inputData: null,
  inputType: null,
  version: null, // this is the input BOM data structure version
  NumberOfUniqueParts: 0,
  TotalNumberOfParts: 0,
  GroupedList: null,
  UniquePartList: null,
  sortMeta: {
    fields: null,
    groups: null,
  }, // holds a set of arrays that are used to sort the BOM
  created: "",
  tile: "",
  date: "",
  company: "",
  revison: "",
  comment: null
}

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
    if (searchTerm.Value === source[Index].Value && searchTerm.Footprint === source[Index].Footprint && searchTerm.Datasheet === source[Index].Datasheet) {
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
*   return the generated part table
*
*   @returns the output
*/
function ExtractAndSortComponents (config) {
  Components.UniquePartList = []
  var PartIndex = 0
  Components.GroupedList = []
  Components.sortMeta.groups = []       // holds the list of groups. This is used to make sorting easier
  Components.sortMeta.fields = []
  Components.NumberOfUniqueParts = 0
  Components.TotalNumberOfParts = 0

  // Get the list of groups we are going to use
  Components.inputData.export.components[0].comp.forEach(function (Part) {

    if (Part.fields) {
      Part.fields.forEach(function (value) {
        value.field.forEach(function (value) {
          if (Components.sortMeta.fields.indexOf(value.$.name) === -1) {
            // if the returned index is -1 then we know  that we know we don't have this item
            Components.sortMeta.fields.push(value.$.name)
          }
        })
      })
    }
  })

  // get the list of fields and grouped the component with the same value
  Components.inputData.export.components[0].comp.forEach(function (Part) {
    var TempFieldHolder = []

    if (Part.fields) {
      Part.fields.forEach(function (value) {
        value.field.forEach(function (value) {
          TempFieldHolder[value.$.name] = value['_']
        })
      })
    }

    var FootprintValue = ''

    // get the component footprint if its not been defined or left empty
    if (typeof Part.footprint !== 'undefined' && typeof Part.footprint[0] !== 'undefined') {
      FootprintValue = Part.footprint[0]
    }

    var DatasheetValue = ''

    // get the component footprint if its not been defined or left empty
    if (typeof Part.datasheet !== 'undefined' && typeof Part.datasheet[0] !== 'undefined') {
      DatasheetValue = Part.datasheet[0]
    }

    var TempPart = {Value: Part.value[0], Count: 1, Ref: [], Fields: TempFieldHolder, Datasheet: DatasheetValue, Footprint: FootprintValue, RefPrefix: Part.$.ref.replace(/[0-9]/g, '')}

    PartIndex = SearchUniquePartIndex(Components.UniquePartList, TempPart, Components.sortMeta.fields)

    // Do we have this part?
    if (PartIndex === -1) {
      Components.UniquePartList.push(TempPart)
      PartIndex = Components.UniquePartList.length
      PartIndex--

      Components.UniquePartList[PartIndex].Ref.push(parseInt(Part.$.ref.replace(/[a-zA-Z]/g, '')))

      if (Part.fields) {
        Part.fields.forEach(function (value) {
          value.field.forEach(function (value) {
            if (Components.sortMeta.fields.indexOf(value.$.name) === -1) {
              // if the returned index is -1 then we don't have this part
              Components.sortMeta.fields.push(value.$.name)
            }
          })
        })
      }

      if (!Components.GroupedList[Components.UniquePartList[PartIndex].RefPrefix]) {
        // array doesn't exist so create a dummy array
        Components.sortMeta.groups.push(Components.UniquePartList[PartIndex].RefPrefix)
        Components.GroupedList[Components.UniquePartList[PartIndex].RefPrefix] = []
      }

      Components.GroupedList[Components.UniquePartList[PartIndex].RefPrefix].push(Components.UniquePartList[PartIndex])

      Components.NumberOfUniqueParts++
    } else {
      Components.UniquePartList[PartIndex].Count++
      Components.UniquePartList[PartIndex].Ref.push(parseInt(Part.$.ref.replace(/[a-zA-Z]/g, '')))
    }

    Components.TotalNumberOfParts++
  })
}

/**
* Handle sorting the coponents
*/
function ApplaySort(config) {
  Components.sortMeta.fields.sort()
  Components.sortMeta.groups.sort()
  Components.sortMeta.groupedList = null

  for (var groupedIndex in Components.GroupedList) {

    // will need to first sort any sub data of each component. this include ref
    for (var PartIndex in Components.GroupedList[groupedIndex]) {

      Components.GroupedList[groupedIndex][PartIndex].Ref.sort(function(refA, refB) {
        if (config.sort.by === 'ref' && !config.sort.ascending) {
          return refB - refA
        }
        return refA - refB
      })
    }
    // sort the sub groups
    Components.GroupedList[groupedIndex].sort(function(partA, partB) {
      var IsNumber = true
      var CompareA = 0
      var CompareB = 0

      switch(config.sort.by) {
        case 'ref':
          CompareA = partA.Ref[0]
          CompareB = partB.Ref[0]
          break
        case 'qty':
          CompareA = partA.Count
          CompareB = partB.Count
          break
        case 'value':
          IsNumber = false
          //< fallthrough
        case 'value_num':
          CompareA = partA.Value
          CompareB = partB.Value
          break
        case 'footprint':
          IsNumber = false
          CompareA = partA.Footprint
          CompareB = partB.Footprint
          break
          case 'datasheet':
            IsNumber = false
            CompareA = partA.Datasheet
            CompareB = partB.Datasheet
            break
        default:
        return 0 // leave unsorted
      }

      if (IsNumber) {
        if (config.sort.ascending) {
          return CompareA - CompareB
        }
        return CompareB - CompareA
      } else {
        // sort string
        CompareA = CompareA.toUpperCase()
        CompareB = CompareB.toUpperCase()
        if (CompareA < CompareB) {
          return config.sort.ascending ? -1 : 1
        } else if (CompareA > CompareB) {
          return config.sort.ascending ? 1 : -1
        } else {
          return 0
        }
      }

    })
  }
}
/**
*   read the user KiCad file. This will also convert the
*   the xml data to javascript object.
*/
function LoadComponentFromXML (config) {
  return new Promise(function(resolve, reject) {

    var Parser = new require('xml2js').Parser()
  //  var Parser = new xml2js.Parser()
    var XMLFile = require('fs')

    Common.Message('Reading KiCad file [ ' + config.input.path + ' ]')

    XMLFile.readFile(config.input.path, function (fileReadError, output) {
      // returnError should return null if the file was read correctly
      if (!fileReadError) {
        // Convert kicad XML data to javascript object class
        Parser.parseString(output, function (xmlParserError, result) {
          // returnError should return null if the data was converted correctly
          if (!xmlParserError) {
            Components.inputData = result
            Components.inputType = 'XML'
            Components.version = Components.inputData.export.$.version

            if (Components.version !== KiCadXMLRevision) {
              return reject('Incompatible KiCad XML version: Expected ' + KiCadXMLRevision + ' Found ' + Components.version)
            }

            // extract page information
            Components.created = Components.inputData.export.design[0].date
            Components.title = Components.inputData.export.design[0].sheet[0].title_block[0].title
            Components.date = Components.inputData.export.design[0].sheet[0].title_block[0].date
            Components.company = Components.inputData.export.design[0].sheet[0].title_block[0].company
            Components.revision = Components.inputData.export.design[0].sheet[0].title_block[0].rev
            Components.comment = [Components.inputData.export.design[0].sheet[0].title_block[0].comment[0].$.value,
                                  Components.inputData.export.design[0].sheet[0].title_block[0].comment[1].$.value,
                                  Components.inputData.export.design[0].sheet[0].title_block[0].comment[2].$.value,
                                  Components.inputData.export.design[0].sheet[0].title_block[0].comment[3].$.value]

            //Task('STATE_READ_TEMPLATE')
            return resolve(Components) // return the read data
          } else {
            return reject(xmlParserError)
          }
        })
      } else {
        return reject(fileReadError)
      }
    })
  })
}

/**
* Will read the KiCad project net list and return the processed data
*/
exports.LoadAndProcessComponentList = function (config) {
  return new Promise(function(resolve, reject) {
    var TheLoaded = null
    // check if this is a supported file type

    switch(config.input.ext.toUpperCase()) {
      case '.XML':
        TheLoaded = LoadComponentFromXML
      break;
      default:
        return reject('input file not supported')
    }
      // run the file loaded
      TheLoaded(config).then(function(result) {
        ExtractAndSortComponents(config)
        ApplaySort(config)
        // success
        return resolve(Components)
      })
      .catch(function(error) {
        return reject(error)
      })

  })

}
