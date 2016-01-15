  /*
# Kicad_Html_BOM
This is a javascript script for creating Kicad HTML BOM.
The parts are grouped together based on the parts value and part reference designator prefix. The script will generate the HTML output based on html template with short_codes.
If you know html and css then you should be able to create your own BOM templates. You simply put the short code where you want this script to insert the BOM data.

For example, if BOM consist of;

R1 10K, R2 100K, C1 10pF, R3 10K

then it would be groupd as so;

> | Ref | qty |value|
> |----|-----|-----|
> |C1 | 1 | 10pF |
> | R1 R3 | 2 | 10K|
> | R2| 1 | 100K|

Output and test examples are in the Test directory

# installing NodeJs
### installing nodejs in Linux:
```sh
sudo apt-get install nodejs
sudo apt-get install npm
```
### installing nodejs on other system:
    https://nodejs.org/en/download/

# Arthur: 
Ronald Sousa HashDefineElectronics.com

# Repository: 

https://github.com/HashDefineElectronics/Kicad_Html_BOM.git 

# How to use it: 
where "%I" in the input kicad xml file and "%O" is the ouput directory and name for the html

#### Terminal or Kicad BOM Wizard:
    node "SCRIPT_ROOT_DIR/KiCad_BOM_Wizard.js" "%I" "%O.html"
    node "SCRIPT_ROOT_DIR/KiCad_BOM_Wizard.js" "%I" "%O.csv" "SCRIPT_ROOT_DIR/Template/CSV"
    node "SCRIPT_ROOT_DIR/KiCad_BOM_Wizard.js" "%I" "%O.html" "Path_To_Your_Template_conf"
    node "SCRIPT_ROOT_DIR/KiCad_BOM_Wizard.js" "%I" "%O.csv" "Path_To_Your_Template_conf"

# templates and short_codes list:

## for template.html:
    <!--TAG_TITLE-->                        inserts the root sheet title.
    <!--TAG_DATE-->                         inserts the root sheet date.
    <!--TAG_DATE_GENERATED-->               inserts the date and time the Kicad net file was created
    <!--TAG_COMPANY-->                      inserts the root sheet company name
    <!--TAG_REVISON-->                      inserts the root sheet revision value
    <!--TAG_COMMENT_1-->                    inserts the root sheet comment 1
    <!--TAG_COMMENT_2-->                    inserts the root sheet comment 2
    <!--TAG_COMMENT_3-->                    inserts the root sheet commnet 3
    <!--TAG_COMMENT_4-->                    inserts the root sheet commnet 4
    <!--TAG_TOTAL_NUM_OF_PARTS-->           inserts the number of parts used in the design
    <!--TAG_TOTAL_NUM_OF_UNIQUE_PARTS-->    inserts the number of unique parts used in the design. Note, if two similar parts have different fileds then it will be registed as unique
    <!--TAG_BOM_TABLE_HEADER_CLASS-->       inserts the table headers
    <!--TAG_BOM_TABLE-->                    inserts the complete generated BOM table

## for tableHeaderTemplate.html:
    <!--TAG_BOM_TABLE_ROW_HEADER-->         inserts the coloum title
    <!--TAG_BOM_TABLE_ROW_REF_TAG--> 		insert the tag for the part reference. HeadRefTag 
    <!--TAG_BOM_TABLE_ROW_QTY_TAG--> 		insert the tag for the part qty. HeadQtyTag
    <!--TAG_BOM_TABLE_ROW_VAL_TAG--> 		insert the tag for the part value. HeadValueTag

## for TableTemplate.html:
    <!--TAG_BOM_TABLE_ROW_DATA-->       inserts the group of parts row data
    <!--TAG_BOM_TABLE_GROUP_CLASS-->    inserts the group class name. format "group_" + "part ref prefix"
    <!--TAG_BOM_TABLE_GROUP_TITLE-->    inserts the group title. the part ref prefix

## for PartRowTemplate.html:
    <!--TAG_BOM_TABLE_PART_REF-->            inserts the list of parts reference designator
    <!--TAG_BOM_TABLE_PART_QTY-->            inserts the number of parts grouped together
    <!--TAG_BOM_TABLE_PART_Value-->          inserts the part value
    <!--TAG_BOM_TABLE_PART_FIELD-->          inserts the generator parts fields
    <!--TAG_BOM_TABLE_ROW_ODD_EVEN_TAG-->    returns RowEvenTag on even rows or RowOddTag for odds rows.
    <!--TAG_BOM_TABLE_ROW_REF_TAG--> 		 insert the tag for the part reference. HeadRefTag 
    <!--TAG_BOM_TABLE_ROW_QTY_TAG--> 		 insert the tag for the part qty. HeadQtyTag
    <!--TAG_BOM_TABLE_ROW_VAL_TAG--> 		 insert the tag for the part value. HeadValueTag

## for TableFieldTemplate:
    <!--TAG_BOM_TABLE_FIELD_CLASS_TAG-->    inserts the fields class name
    <!--TAG_BOM_TABLE_FIELD-->              inserts the field value

*/

var fs = require('fs'),
xml2js = require('xml2js'), 
util = require('util');

var HtmlHeader = "";
var HtmlTemplateData = null;
var HtmlTableTemplate = null;
var HtmlTableRowTemplate = null;
var HtmlTableRowHeaderTemplate = null;
var TableFieldTemplate = null;
var KicadXmlFile = ""
var OutputFile = ""
var TemplateFolder = __dirname + '/Template/HTML';

// check the user has given us all that we need to generate the BOM
process.argv.forEach(function (val, index, array) {
	if(2 == index) // The user has passed the file to process
	{
		KicadXmlFile = array[2];
	}
	if(3 == index) // The user has passed the file to process
	{
		OutputFile = array[3];
	}
	if(4 == index) // The user has passed the file to process
	{
		TemplateFolder = array[4];
	}
});

if("" == OutputFile || KicadXmlFile == "")
{
	console.log("Too few arguments");
	return;
}

console.log("Input File" + ': ' + KicadXmlFile );
console.log("Output File" + ': ' + OutputFile );
console.log("Template File" + ': ' + TemplateFolder );

// Run the first process
Process("STATE_GET_XML_DATA");

var UserProjectNetData = null;
var NumberOfUniqueParts = 0;
var TotalNumberOfParts = 0;

/////////////////////////////////////////////////////////////////
///	\brief This will check the entrire part list for a matching value and fields and 
/// return the part index number that matches
///
///	\return -1 = no match else the index number
/////////////////////////////////////////////////////////////////
function SearchUniquePartIndex(source, searchTerm, listOfGroups)
{
	var FieldsTestResult = true;

	for( var Index = 0; Index < source.length; Index++)
	{
		// part value matches
		if ( searchTerm.Value[0] == source[Index].Value[0] )
		{
			for ( var FieldIndex = 0; FieldIndex <  listOfGroups.length; FieldIndex++ )
			{
				// If either one is true
				if( listOfGroups[ FieldIndex ] in searchTerm.Fields  || listOfGroups[ FieldIndex ] in source[Index].Fields  )
				{
					// If either one is true then both have to be set
					if( listOfGroups[ FieldIndex ] in searchTerm.Fields  && listOfGroups[ FieldIndex ] in source[Index].Fields  
						&& searchTerm.Fields[ listOfGroups[ FieldIndex ] ] === source[Index].Fields[ listOfGroups[ FieldIndex ] ])
					{
						// Do nothing
					}
					else
					{
						FieldsTestResult = false;
					}
				}
			}

			// We have a match
			if ( FieldsTestResult )
			{
				return Index;
			}
		}
	}

	return -1;
}


/////////////////////////////////////////////////////////////////
///	\brief creates the table html
///
///	\param fieldsList the array that has all the various filed names
///	\param GroupedList the array that has all the parts grouped by the ref prefix
///	\param partGroupedList the array that actually contains all the parts data
///
///	\return the hmtl output
/////////////////////////////////////////////////////////////////
function GenerateTableHtml(fieldsList, groupedList, partGroupedList)
{
 	var ReturnHtml = "";

	HtmlHeader = HtmlTableRowHeaderTemplate.replace(/<!--TAG_BOM_TABLE_ROW_HEADER-->/g,  "Ref");
	HtmlHeader = HtmlHeader.replace(/<!--TAG_BOM_TABLE_ROW_REF_TAG-->/g,  "HeadRefTag");
	HtmlHeader = HtmlHeader.replace(/<!--TAG_BOM_TABLE_ROW_QTY_TAG-->/g,  "");
	HtmlHeader = HtmlHeader.replace(/<!--TAG_BOM_TABLE_ROW_VAL_TAG-->/g,  "");

	HtmlHeader += HtmlTableRowHeaderTemplate.replace(/<!--TAG_BOM_TABLE_ROW_HEADER-->/g,  "Qty");
	HtmlHeader = HtmlHeader.replace(/<!--TAG_BOM_TABLE_ROW_REF_TAG-->/g,  "");
	HtmlHeader = HtmlHeader.replace(/<!--TAG_BOM_TABLE_ROW_QTY_TAG-->/g,  "HeadQtyTag");
	HtmlHeader = HtmlHeader.replace(/<!--TAG_BOM_TABLE_ROW_VAL_TAG-->/g,  "");

	HtmlHeader += HtmlTableRowHeaderTemplate.replace(/<!--TAG_BOM_TABLE_ROW_HEADER-->/g,  "Value");
	HtmlHeader = HtmlHeader.replace(/<!--TAG_BOM_TABLE_ROW_REF_TAG-->/g,  "");
	HtmlHeader = HtmlHeader.replace(/<!--TAG_BOM_TABLE_ROW_QTY_TAG-->/g,  "");
	HtmlHeader = HtmlHeader.replace(/<!--TAG_BOM_TABLE_ROW_VAL_TAG-->/g,  "HeadValueTag");


	fieldsList.sort();

	for ( var FieldIndex = 0; FieldIndex <  fieldsList.length; FieldIndex++ )
	{
		HtmlHeader += HtmlTableRowHeaderTemplate.replace(/<!--TAG_BOM_TABLE_ROW_HEADER-->/g,  fieldsList[ FieldIndex ] );
		HtmlHeader = HtmlHeader.replace(/<!--TAG_BOM_TABLE_ROW_REF_TAG-->/g,  "");
		HtmlHeader = HtmlHeader.replace(/<!--TAG_BOM_TABLE_ROW_QTY_TAG-->/g,  "");
		HtmlHeader = HtmlHeader.replace(/<!--TAG_BOM_TABLE_ROW_VAL_TAG-->/g,  "");

	}

	groupedList.sort();

	//keep track if the table row is odd or even. true = even else is odd
	var RowIsEvenFlag = false;

	for ( var Group in groupedList )
	{
		// take a copy of the table taplate
		var TableHtmlTemp = HtmlTableTemplate;
		var GroupdName = groupedList[Group];

		TableHtmlTemp = TableHtmlTemp.replace(/<!--TAG_BOM_TABLE_GROUP_CLASS-->/g,		"group_" + GroupdName );
		TableHtmlTemp = TableHtmlTemp.replace(/<!--TAG_BOM_TABLE_GROUP_TITLE-->/g,		GroupdName);

		var TableRowAll = "";
		for ( var Item in partGroupedList[GroupdName] )
		{
			var TempRow = HtmlTableRowTemplate;
			var RefTemp = "";

			for ( var Ref in partGroupedList[GroupdName][Item].Ref )
			{
				RefTemp += Ref + " ";
			}

			if(RowIsEvenFlag)
			{
				TempRow = TempRow.replace(/<!--TAG_BOM_TABLE_ROW_ODD_EVEN_TAG-->/g, "RowEvenTag");
			}
			else
			{
				TempRow = TempRow.replace(/<!--TAG_BOM_TABLE_ROW_ODD_EVEN_TAG-->/g, "RowOddTag");	
			}
			TempRow = TempRow.replace(/<!--TAG_BOM_TABLE_PART_REF-->/g, RefTemp);
			TempRow = TempRow.replace(/<!--TAG_BOM_TABLE_PART_QTY-->/g, partGroupedList[GroupdName][Item].Count);
			TempRow = TempRow.replace(/<!--TAG_BOM_TABLE_PART_Value-->/g, partGroupedList[GroupdName][Item].Value);

			TempRow = TempRow.replace(/<!--TAG_BOM_TABLE_ROW_REF_TAG-->/g,  "HeadRefTag");
			TempRow = TempRow.replace(/<!--TAG_BOM_TABLE_ROW_QTY_TAG-->/g,  "HeadQtyTag");
			TempRow = TempRow.replace(/<!--TAG_BOM_TABLE_ROW_VAL_TAG-->/g,  "HeadValueTag");

			var FieldsTemp = "";

			for ( var FieldIndex = 0; FieldIndex <  fieldsList.length; FieldIndex++ )
			{
				var SingleFieldTemp = TableFieldTemplate;

				SingleFieldTemp = SingleFieldTemp.replace(/<!--TAG_BOM_TABLE_FIELD_CLASS_TAG-->/g, "Field_" + fieldsList[ FieldIndex ] );

				if( partGroupedList[ GroupdName ][ Item ].Fields[ fieldsList[ FieldIndex ] ] )
				{
					SingleFieldTemp = SingleFieldTemp.replace(/<!--TAG_BOM_TABLE_FIELD-->/g, partGroupedList[ GroupdName ][ Item ].Fields[ fieldsList[ FieldIndex ] ].replace(/,/g, " "));
				}
				else
				{
					
					SingleFieldTemp = SingleFieldTemp.replace(/<!--TAG_BOM_TABLE_FIELD-->/g, " ");
				}

				FieldsTemp += SingleFieldTemp;
			}

			TableRowAll += TempRow.replace(/<!--TAG_BOM_TABLE_PART_FIELD-->/g, FieldsTemp);

			RowIsEvenFlag = !RowIsEvenFlag;
		}

		TableHtmlTemp = TableHtmlTemp.replace(/<!--TAG_BOM_TABLE_ROW_DATA-->/g, TableRowAll);

		ReturnHtml += TableHtmlTemp;
	}
	return ReturnHtml;
}



/////////////////////////////////////////////////////////////////
///	\brief return the html generated part table
///
///	\return the output html
/////////////////////////////////////////////////////////////////
function ExtractAndGenerateHtmlForThePart()
{
	var PartGroupedList = new Array();
	var GroupedList = new Array(); // holds the list of groups. This is used to make sorting easier
	var UniquePartList = new Array();
	var ListOfFields = new Array();
	NumberOfUniqueParts = 0;
	TotalNumberOfParts = 0;
	var PartIndex = 0;

	// Get the list of groups we are going to use
	UserProjectNetData.export.components[0].comp.forEach(function(Part)
	{
		if (Part.fields)
		{
			Part.fields.forEach(function(value)
			{
				value.field.forEach(function(value)
				{
					
					if( -1 == ListOfFields.indexOf(value.$.name) )
					{
						// if the returned index is -1 then we know  that we know we don't have this item
						ListOfFields.push(value.$.name);
					}
				});
			});
		}
	});

	// get the list of fileds and groupd the component with the same value
	UserProjectNetData.export.components[0].comp.forEach(function(Part)
	{

		var TempFieldHolder = new Array();

		if (Part.fields)
		{
			Part.fields.forEach(function(value)
			{
				value.field.forEach(function(value)
				{
					TempFieldHolder[value.$.name] = value['_'];
				});
			});
		}


		var TempPart = {'Value': Part.value, 'Count' : 1, 'Ref' : new Array(), 'Fields' : TempFieldHolder, 'RefPrefix' : Part.$.ref.replace(/[0-9]/g, '')};

		PartIndex = SearchUniquePartIndex(UniquePartList, TempPart, ListOfFields);

		// Do we have this part?
		if ( -1 == PartIndex )
		{
			UniquePartList.push(TempPart);
			
			PartIndex = UniquePartList.length;
			PartIndex--;

			UniquePartList[PartIndex].Ref[Part.$.ref] = Part.$.ref;

			if (Part.fields)
			{			
				Part.fields.forEach(function(value)
				{
					value.field.forEach(function(value)
					{
						
						if( -1 == ListOfFields.indexOf(value.$.name) )
						{
							// if the returned index is -1 then we know  that we know we don't have this item
							ListOfFields.push(value.$.name);
						}
					});
				});
			}

			if ( typeof PartGroupedList[UniquePartList[PartIndex].RefPrefix] === 'undefined' )
			{
				GroupedList.push(UniquePartList[PartIndex].RefPrefix);

				PartGroupedList[UniquePartList[PartIndex].RefPrefix] = new Array();
				PartGroupedList[UniquePartList[PartIndex].RefPrefix].push(UniquePartList[PartIndex]); 
			}
			else
			{
				PartGroupedList[UniquePartList[PartIndex].RefPrefix].push(UniquePartList[PartIndex]); 
			}

			NumberOfUniqueParts++;
		}
		else
		{
			UniquePartList[PartIndex].Count++;
			UniquePartList[PartIndex].Ref[Part.$.ref] = Part.$.ref;
		}

		TotalNumberOfParts++;
	});
	
	return GenerateTableHtml(ListOfFields, GroupedList, PartGroupedList);

}


/////////////////////////////////////////////////////////////////
///	\brief This will generate the Bill of material based on the 
///	template given
/////////////////////////////////////////////////////////////////
function GenerateBOM()
{
	if ( null != UserProjectNetData && null != HtmlTemplateData)
	{
		console.log('Generating BOM');

		var Result = ExtractAndGenerateHtmlForThePart();


		HtmlTemplateData = HtmlTemplateData.replace(/<!--TAG_DATE_GENERATED-->/g,UserProjectNetData.export.design[0].date );
		HtmlTemplateData = HtmlTemplateData.replace(/<!--TAG_TITLE-->/g,		UserProjectNetData.export.design[0].sheet[0].title_block[0].title );
		HtmlTemplateData = HtmlTemplateData.replace(/<!--TAG_DATE-->/g,		UserProjectNetData.export.design[0].sheet[0].title_block[0].date );
		HtmlTemplateData = HtmlTemplateData.replace(/<!--TAG_COMPANY-->/g,	UserProjectNetData.export.design[0].sheet[0].title_block[0].company );
		HtmlTemplateData = HtmlTemplateData.replace(/<!--TAG_REVISON-->/g,	UserProjectNetData.export.design[0].sheet[0].title_block[0].rev );
		HtmlTemplateData = HtmlTemplateData.replace(/<!--TAG_COMMENT_1-->/g,	UserProjectNetData.export.design[0].sheet[0].title_block[0].comment[0].$.value );
		HtmlTemplateData = HtmlTemplateData.replace(/<!--TAG_COMMENT_2-->/g,	UserProjectNetData.export.design[0].sheet[0].title_block[0].comment[1].$.value );
		HtmlTemplateData = HtmlTemplateData.replace(/<!--TAG_COMMENT_3-->/g,	UserProjectNetData.export.design[0].sheet[0].title_block[0].comment[2].$.value );
		HtmlTemplateData = HtmlTemplateData.replace(/<!--TAG_COMMENT_4-->/g,	UserProjectNetData.export.design[0].sheet[0].title_block[0].comment[3].$.value );
		HtmlTemplateData = HtmlTemplateData.replace(/<!--TAG_TOTAL_NUM_OF_PARTS-->/g,	TotalNumberOfParts );
		HtmlTemplateData = HtmlTemplateData.replace(/<!--TAG_TOTAL_NUM_OF_UNIQUE_PARTS-->/g,	NumberOfUniqueParts );
		HtmlTemplateData = HtmlTemplateData.replace(/<!--TAG_BOM_TABLE_HEADER_CLASS-->/g,	HtmlHeader);
		HtmlTemplateData = HtmlTemplateData.replace(/<!--TAG_BOM_TABLE-->/g,	Result);
		// output BOM
		var OutputFileWrite = require('fs');
		OutputFileWrite.writeFile(OutputFile, HtmlTemplateData, function(returnError) {
		    if(returnError) {
		        return console.log(returnError);
		    }

		    console.log("BOM created!");
		}); 
	}
	else
	{
		console.log('Error generating BOM');
	}
}

/////////////////////////////////////////////////////////////////
///	\brief read the html config file
/////////////////////////////////////////////////////////////////
function GetXmldata()
{
	console.log('reading KiCad XML file');
	var parser = new xml2js.Parser();

	fs.readFile(KicadXmlFile, function(returnError, output) {
		// returnError should return null if the file was read correctly
		if(null == returnError)
		{
			// Convert kicad XML data to javascript object class
		    parser.parseString(output, function (returnError, result)
		    {
		    	// returnError should return null if the data was converted correctly
		    	if(null == returnError)
		    	{
			        UserProjectNetData = result;
					Process("STATE_READ_HTML_TEMPLATE");
				}
				else
				{
					console.log(returnError);
					return;
				}
		    });
		}
		else
		{
			console.log(err);
			return;
		}
	});
}

/////////////////////////////////////////////////////////////////
///	\brief read the html config file
/////////////////////////////////////////////////////////////////
function ReadTemplate()
{
	console.log('Reading HTML Template');

	var HtmlTemplate = require('fs');
	
	HtmlTemplate.readFile(TemplateFolder + '/template.conf','utf8', function(returnError, output) 
	{
		// returnError should return null if the data was read correctly
		if(null == returnError)
		{
			HtmlTemplateData = output;
			Process("STATE_READ_TABLE_TEMPLATE");
		}
	});
}
/////////////////////////////////////////////////////////////////
///	\brief read the html config file
/////////////////////////////////////////////////////////////////
function ReadTableTemplate()
{
	console.log('Reading HTML Template for table');

	var HtmlTemplate = require('fs');
	
	HtmlTemplate.readFile(TemplateFolder + '/TableGroupTemplate.conf','utf8', function(returnError, output) 
	{
		// returnError should return null if the data was read correctly
		if(null == returnError)
		{
			HtmlTableTemplate = output;
			Process("STATE_READ_TABLE_ROW_HEADER_TEMPLATE");
		}
	});
}
function ReadTableRowHeaderTemplate()
{
	console.log('Reading HTML Template for table');

	var HtmlTemplate = require('fs');
	
	HtmlTemplate.readFile(TemplateFolder + '/tableHeaderTemplate.conf','utf8', function(returnError, output) 
	{
		// returnError should return null if the data was read correctly
		if(null == returnError)
		{
			HtmlTableRowHeaderTemplate = output;
			Process("STATE_READ_TABLE_ROW_TEMPLATE");
		}
	});
}

/////////////////////////////////////////////////////////////////
///	\brief read the html config file
/////////////////////////////////////////////////////////////////
function ReadTableRowTemplate()
{
	console.log('Reading HTML Row Header Template for table');

	var HtmlTemplate = require('fs');
	
	HtmlTemplate.readFile(TemplateFolder + '/PartRowTemplate.conf','utf8', function(returnError, output) 
	{
		// returnError should return null if the data was read correctly
		if(null == returnError)
		{
			HtmlTableRowTemplate = output;
			Process("STATE_READ_Field_TEMPLATE");
		}
	});
}

/////////////////////////////////////////////////////////////////
///	\brief read the html config file
/////////////////////////////////////////////////////////////////
function ReadFieldTemplate()
{
	console.log('Reading HTML Template for fields');

	var HtmlTemplate = require('fs');
	
	HtmlTemplate.readFile(TemplateFolder + '/TableFieldTemplate.conf','utf8', function(returnError, output) 
	{
		// returnError should return null if the data was read correctly
		if(null == returnError)
		{
			TableFieldTemplate = output;
			Process("STATE_GENERATE_BOM");
		}
	});
}

/////////////////////////////////////////////////////////////////
///	\brief Handles the machine state for the code process
/////////////////////////////////////////////////////////////////
function Process(state)
{
	switch(state)
	{
		case "STATE_GET_XML_DATA":
			GetXmldata();
		break;

		case "STATE_READ_HTML_TEMPLATE":
			ReadTemplate();
		break;

		case "STATE_READ_TABLE_TEMPLATE":
			ReadTableTemplate();
		break;

		case "STATE_READ_TABLE_ROW_HEADER_TEMPLATE":
			ReadTableRowHeaderTemplate();
		break;

		case "STATE_READ_TABLE_ROW_TEMPLATE":
			ReadTableRowTemplate();
		break;

		case "STATE_READ_Field_TEMPLATE":
			ReadFieldTemplate();
		break;

		case "STATE_GENERATE_BOM":
			GenerateBOM();
		break;

		default:
			console.log('Process() default error');
		break;
	}

}
