/**
* this are a collections of common functions used through the plugin
*/
"use strict"
/**
*   Path is used to handle parsing system path urls
*/
var Path = require('path')

var exports = module.exports

/**
*   This is the path to the template files to use
*   when creating the BOM
*/
exports.TemplateFolder = Path.join(__dirname, '/Template/')

/**
* Holds the default options
*/
exports.Options = {
  version : "1",
  format : "HTML",
  templatePath : "HTML",
  ouptput : "",
  inputFile: "", // This is the project KiCad file to use to  extract the BOM information
  pdfOptions: {
    showPage: false,
    pageSize: "A4",
    printBackground : true,
    landscape: true,
    marginsType : 0
  }
}

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
* Handle checking of path exsist, if so return the working path
*/
exports.ParsePath = function (source) {
  var Result = null

  if (exports.FileExist(source)) {
    Result = source // check if use template path exist
  } else if (exports.FileExist(exports.TemplateFolder + source)) {
    Result = exports.TemplateFolder += source // now check if the user is wanting to use a  template in KiCad_BOM_Wizard/Template
  } else if (exports.FileExist(__dirname + "/" +  source)) {
    // could be located where the script was called from
    Result = __dirname + "/" + source // now check if the user is wanting to use a  template in KiCad_BOM_Wizard/Template
  }

  if (!Result) {
    exports.Error('Directory or file not found: [ ' + source + ' ]')
  }

  return Result
}

/*
*   this function is used to make a standard format
*   for error messages.
*   this also handle exiting the program
*/
exports.Message = function (message) {
  console.log(message)
}

/**
*   this function is used to make a standard format
*   for error messages.
*   this also handle exiting the program
*/

exports.Error = function(message) {
  var MessageTemp = '\n\n** Error **\n\t' + message + '\n\n'
  console.error(MessageTemp)
  process.exit(1)
}
/**
* Handle loading the options from the given path
*
* @return true if the options were correctly loaded else false
*/
exports.LoadOptions = function(inputFile) {

  if (inputFile.toUpperCase().indexOf('JSON')) {
    var PathTemp = exports.ParsePath(inputFile)

    if (PathTemp) {
      // we have a valid file so now we are goung to load the options
      console.log('options found', PathTemp)
      // load the options
      var Files = require('fs')

      try {
      var Options = JSON.parse(Files.readFileSync(PathTemp, 'utf8'))
      } catch (e) {
        exports.Error('unabled to read option file [' + PathTemp + ']')
      }
      return true
    }
  }
  return false
}
