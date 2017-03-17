/**
* this is our html to pdf creator
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
        });
    })
}
