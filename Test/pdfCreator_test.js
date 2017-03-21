var PDF = require('../Lib/pdfExport');
var Path = require('path')
/**
* Defines the default pdf options
*/
var DefaultOptions = {
  pageSize: 'A4',
  printBackground : true,
  landscape: true,
  marginsType : 0
}

var PDFPromise = PDF.Make(Path.join(__dirname,'/.tmp/output.html'), Path.join(__dirname, '/.tmp/output.pdf'), DefaultOptions)
PDFPromise.then(function() {
  console.log('pdf done')
})
.catch(function(error) {
  console.log('error:', error)
})
