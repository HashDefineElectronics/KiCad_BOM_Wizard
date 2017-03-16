/**
* this is our html to pdf creator
*/
"use strict"

var exports = module.exports

var Promise = require('promise')


/**
* Defines the express server port to use
*/
var ExpressPort = 30021

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
exports.Make = function(htmltemplate, outputPath, options, displayTime) {
    return new Promise( function(resolve, reject) {

      var WaitTime = 0
      var ShowPage = false
      var OptionTemp = DefaultOptions

      if (! htmltemplate) {
        return reject('html template path is needed')
      }

      if (! outputPath) {
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
      var Express = require('express')
      var ExpressInstace = Express()

      ExpressInstace.use(Express.static(htmltemplate))

      var Server = ExpressInstace.listen(ExpressPort, function () {

          nightmare
            .goto('http://127.0.0.1:' + ExpressPort + '/index.html')
            .wait(WaitTime)
            .pdf(outputPath, OptionTemp)
            .end()
            .then(function (result) {
              Server.close()
              resolve()
            })
            .catch(function (error) {
              Server.close()
              return reject(error)
            });
      })

    })
}
