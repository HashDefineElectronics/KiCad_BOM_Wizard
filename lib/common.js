/**
* this are a collections of common functions used through the plugin
*/
"use strict"
/**
*   Path is used to handle parsing system path urls
*/
var Path = require('path')

var exports = module.exports

exports.ScriptDirectory = ""
/**
*   This is the path to the template files to use
*   when creating the BOM
*/
exports.TemplateFolder = Path.join(__dirname, '/../Template/')

/**
* Holds the default options
*/
exports.Options = {
  basePath: "",
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

/**
* Handle checking of path exsist, if so return the working path
*/
exports.ParsePath = function (source, isDirectory) {
  var Result = null
  var Exist = exports.FileExist


  if (exports.PathExsist(source, isDirectory)) {
    // the given path could be valid
    Result = source
  } else if (exports.PathExsist(Path.join(exports.TemplateFolder, source), isDirectory)) {

    // the given path could be inside the default template folder
    Result = Path.join(exports.TemplateFolder, source)
  } else if (exports.PathExsist(Path.join(__dirname, source), isDirectory)) {

    // could be relative to where the script was called from
    Result = Path.join(__dirname, source)
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
      // get the absolute path from the option file
      exports.Options.basePath = Path.dirname(Path.resolve(PathTemp))


      // load the options
      var Files = require('fs')

      try {
      var OptionTemp = JSON.parse(Files.readFileSync(PathTemp, 'utf8'))

      if (!OptionTemp.input) {
        // input file is missing
        exports.Error('input file is missing from ' + Path.basename(PathTemp))
      }

      // need to check if the file path is abolute, if so then use it else check if its in the location where the option file is located

      var InputPathTemp = exports.ParsePath(OptionTemp.input)

      if (InputPathTemp) {
        exports.Options.input = InputPathTemp
      }


      } catch (e) {
        exports.Error('unabled to read option file [' + PathTemp + ']')
      }
      return true
    }
  }
  return false
}
