/**
* this are a collections of common functions used through the plugin
*/
"use strict"
var exports = module.exports

/**
*   Path is used to handle parsing system path urls
*/
var Path = require('path')

exports.CurrentWorkingPath = null

/**
*   This is the path to the template files to use
*   when creating the BOM
*/
exports.TemplateFolder = null

/**
* setup the common library.
*/
exports.Init = function(currentWorkingPath, defaultTemplatePath) {
  exports.CurrentWorkingPath = currentWorkingPath
  exports.TemplateFolder = defaultTemplatePath

  return this
}

/**
* Holds the default options
*/
exports.Options = {
  OptionFilePath: null, // internal set
  version : "1",
  outputType : "FILE", // FILE or PDF
  templatePath : "HTML",
  output : "",
  input: {path: null, ext : null, basename: null},          // This is the project KiCad file to use to  extract the BOM information
  pdfOptions: {
    showPage: false,
    pageSize: "A4",
    printBackground : false,
    landscape: false,
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
* validates and return a full path regatherless if its a folder or file.
* this function will handle relative and abosolute paths.
*
* NOTE: will test for in this order
*
*   - exports.CurrentWorkingPath/@source
*   - (only if avaliable) exports.Options.OptionFilePath/@source
*   - exports.TemplateFolder/@source
*   - abosolute
*/
exports.ValidateAndReturnPath = function (source, isDirectory) {
  var Result = null
  var Exist = exports.FileExist

  if (!exports.CurrentWorkingPath) {
    exports.Error('script current working path is empty')
  }

  if (!exports.TemplateFolder) {
    exports.Error('template path is empty')
  }

  if (exports.PathExsist(Path.join(exports.CurrentWorkingPath , source), isDirectory)) {
    // could be relative to where the script was called from
    Result = Path.join(exports.CurrentWorkingPath , source)
  } else if (exports.Options.OptionFilePath && exports.PathExsist(Path.join(exports.Options.OptionFilePath, source), isDirectory)) {
      // if the option file was used then check if the given path is relative to the option file
      Result = Path.join(exports.Options.OptionFilePath, source)
  } else if (exports.PathExsist(Path.join(exports.TemplateFolder, source), isDirectory)) {
    // the given path could be inside the default template folder
    Result = Path.join(exports.TemplateFolder, source)
  } else if (exports.PathExsist(source, isDirectory)) {
    // the given path could be abosolute
    Result = source
  }

  if (!Result) {
    // fail if the path isn't valid
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
  var MessageTemp = '** Error **\n\t' + message + '\n\n'
  console.trace(MessageTemp)
  process.exit(1)
}

/**
* this function is meant to validate the output type selection
*/
function ValidateOutputTypeSelection(type) {
  if (!type) {
    return exports.Error('output type option not set [ouputType]')
  }
  type = type.toUpperCase()

  switch (type) {
    case 'FILE':
    case 'PDF':
      // these are valid types
      break;
    default:
        return exports.Error('unknow file formate [' + format + ']')

  }
  // return the validated and process ouput format
  return type
}

/**
* validate and override the PDF default options. fail save
*/
function ValidateAndSetPDFOptions(options) {
  if (options) {
    if (options.showPage) {
      exports.Options.pdfOptions.showPage = true
    }

    if (options.pageSize) {
      exports.Options.pdfOptions.pageSize = options.pageSize
    }

    if (options.printBackground) {
      exports.Options.pdfOptions.printBackground = true
    }

    if (options.landscape) {
      exports.Options.pdfOptions.landscape = true
    }

    if (options.marginsType) {
      exports.Options.pdfOptions.marginsType = options.marginsType
    }
  }
}

/**
* Handle loading the version 1 options files
*/
function LoadVersionOneOption(options) {

  exports.Options.input.path = exports.ValidateAndReturnPath(options.input)
  exports.Options.input.ext = Path.extname(exports.Options.input.path)
  exports.Options.input.basename = Path.basename(exports.Options.input.path, exports.Options.input.ext)

  exports.Options.templatePath = exports.ValidateAndReturnPath(options.templatePath, true)
  exports.Options.outputType = ValidateOutputTypeSelection(options.outputType)

  // if the output type of PDF then we need to validate the PDF options
  if (exports.Options.outputType === 'PDF') {
    ValidateAndSetPDFOptions(options.pdfOptions)
  }


  // set the output default values just incase the user doesn't set them
  exports.Options.output = {path: null, basename: exports.Options.input.basename + '_bom', ext: ''}
  exports.Options.output.path = Path.join(Path.dirname(exports.Options.input.path), exports.Options.output.basename + exports.Options.output.ext)

  // check if the user has given us an output name
  if(options.outputName && options.outputName !== "" && options.outputName !== " ") {
    // get the extension name if it has one
    exports.Options.output.ext = Path.extname(options.outputName)
    exports.Options.output.basename = Path.basename(options.outputName, Path.extname(options.outputName))
  }

  if(options.outputPath && options.outputPath !== "" && options.outputPath !== " ") {
    // if the user has give us a path to use then validate it
    options.outputPath = exports.ValidateAndReturnPath(options.outputPath, true)
    exports.Options.output.path = Path.join(Path.dirname(options.outputPath), exports.Options.output.basename + exports.Options.output.ext)
  }
}

/**
* This handle getting the system options vai process aguments
*/
exports.OldOptionsSetup = function(parameter) {

  if (!parameter[2]) {
    exports.Error('input file parameter is missing')
  }

  if (!parameter[3]) {
    exports.Error('output file parameter is missing')
  }
  exports.Options.input.path = exports.ValidateAndReturnPath(parameter[2])
  exports.Options.input.ext = Path.extname(exports.Options.input.path)
  exports.Options.input.basename = Path.basename(exports.Options.input.path, exports.Options.input.ext)

  exports.Options.ouptput.path = exports.ValidateAndReturnPath(parameter[3])
  exports.Options.output.ext = Path.extname(exports.Options.ouptput.path)
  exports.Options.output.basename = Path.basename(exports.Options.ouptput.path, exports.Options.output.ext)

  exports.Options.outputType = 'FILE'

  // check if user has given us a path to use if not then use the default one
  if (parameter[4]) {
    exports.Options.templatePath = exports.ValidateAndReturnPath(parameter[4])
  } else {
    exports.Options.templatePath = exports.ValidateAndReturnPath('HTML')
  }

  console.log(exports.Options)
  LoadVersionOneOption(exports.Options)
  console.log(exports.Options)
  exports.Error('work in progress')
}
/**
* Handle loading the options from the given path
*
* @return true if the options were correctly loaded else false
*/
exports.LoadOptions = function(inputFile) {

  if (inputFile.toUpperCase().indexOf('JSON')) {
    var PathTemp = exports.ValidateAndReturnPath(inputFile)

    if (PathTemp) {
      // get the absolute path from the option file
      exports.Options.OptionFilePath = Path.dirname(Path.resolve(PathTemp))

      // load the options
      var Files = require('fs')

      try {
        var OptionTemp = JSON.parse(Files.readFileSync(PathTemp, 'utf8'))
      } catch (error) {
          exports.Error('unabled to read option file [' + PathTemp + ']', error)
        }

      if (!OptionTemp.input) {
        // input file is missing
        exports.Error('input file is missing from ' + Path.basename(PathTemp))
      }

      if (!OptionTemp.version) {
        exports.Error('option file has no version number')
      }

      exports.Options.version = parseInt(OptionTemp.version)

      switch (exports.Options.version) {
        case 1:
          LoadVersionOneOption(OptionTemp)
          break;
        default:
          exports.Error('option file version is not supported [found: ' + exports.Options.version + ']')
        break;
      }
      return true
    }
  }
  return false
}
