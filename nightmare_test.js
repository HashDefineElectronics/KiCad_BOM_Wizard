var PDF = require('./lib/pdfCreator');

/**
* Defines the default pdf options
*/
var DefaultOptions = {
  pageSize: 'A4',
  printBackground : true,
  landscape: true,
  marginsType : 0
}

var PDFPromise = PDF.Make(__dirname + '/Test/template/', __dirname + '/my_pdf.pdf', DefaultOptions, 1000)
PDFPromise.then(function() {
  console.log('pdf done')
})
.catch(function(error) {
  console.log('erro', error)
})
