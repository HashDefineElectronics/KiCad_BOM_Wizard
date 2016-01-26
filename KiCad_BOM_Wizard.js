/*
# KiCad_BOM_Wizard

# Arthur: 
Ronald Sousa http://hashdefineelectronics.com/kicad-bom-wizard/

# Revision:
0

# Repository: 
https://github.com/HashDefineElectronics/KiCad_BOM_Wizard.git

# Project Page: 
http://hashdefineelectronics.com/kicad-bom-wizard/


This is the repository for KiCad_BOM_Wizard. This KiCad plugin can be used to create custom BOM files based on easy configurable templates files. The plugin is writing in JavaScript and has been designed to integrate into KiCad’s BOM plugin manager.

The Idea for this plugin came from our need to generate BOM that are specific to of our clients needs. for example, some of our clients require their product to have document traceability due to their product ATEX certificate requirement. 
With KiCad_BOM_Wizard, We simply made a template that the output file includes the document number, project revision, and manufacture notes.

By default, KiCad_BOM_Wizard comes with two templates, one will generate a stand along HTML file and the other will generate a CSV file.
They are both include to simplify the use of plugin and can be used as an example by those who want to make their own templates. The latter could be due to needing to have your own company or project logo.

KiCad_BOM_Wizard works by scanning through all of the template files and replacing any of the Short Codes with the data that is associated with it. It will then output all of the data it has collected including the file structure
into one file based on the order that it finds the short codes. 

For example, if the KiCad_BOM_Wizard finds the short code <!--TAG_TITLE--> in template.conf then it we replace it with the KiCad project root sheet title. KiCad_BOM_Wizard will also group and sort all components together that have same parts value, the same starting designator reference prefix and the same fields value. 

For example, if your project component list consist of; 
> R1 10K, R2 100K, C1 10pF and R3 10K

then it would be grouped like this;

> | Ref | qty | value |
> |----|-----|-----|
> |C1 | 1 | 10pF |
> | R1 R3 | 2 | 10K|
> | R2| 1 | 100K|

# For more details on how to use and make your own template that KiCad_BOM_Wizard can use, please visit the main project page. http://hashdefineelectronics.com/kicad-bom-wizard/

# The following server as a quick reference.

## installing nodejs in Linux:
```sh
sudo apt-get install nodejs
sudo apt-get install npm
```
## installing nodejs on other system:
    https://nodejs.org/en/download/

## Terminal or Kicad BOM Wizard:
    node "SCRIPT_ROOT_DIR/KiCad_BOM_Wizard.js" "%I" "%O.html"
    node "SCRIPT_ROOT_DIR/KiCad_BOM_Wizard.js" "%I" "%O.csv" "SCRIPT_ROOT_DIR/Template/CSV"
    node "SCRIPT_ROOT_DIR/KiCad_BOM_Wizard.js" "%I" "%O.html" "Path_To_Your_Template_conf"
    node "SCRIPT_ROOT_DIR/KiCad_BOM_Wizard.js" "%I" "%O.csv" "Path_To_Your_Template_conf"

where "%I" in the input kicad xml file and "%O" is the output directory and name for the html

## short_codes list used by the template files

### for template.conf:
    <!--TITLE-->                        inserts the root sheet title.
    <!--DATE-->                         inserts the root sheet date.
    <!--DATE_GENERATED-->               inserts the date and time the Kicad net file was created
    <!--COMPANY-->                      inserts the root sheet company name
    <!--REVISON-->                      inserts the root sheet revision value
    <!--COMMENT_1-->                    inserts the root sheet comment 1
    <!--COMMENT_2-->                    inserts the root sheet comment 2
    <!--COMMENT_3-->                    inserts the root sheet comment 3
    <!--COMMENT_4-->                    inserts the root sheet comment 4
    <!--TOTAL_NUM_OF_PARTS-->           inserts the number of parts used in the design
    <!--TOTAL_NUM_OF_UNIQUE_PARTS-->    inserts the number of unique parts used in the design. Note, if two similar parts have different fields then it will be register as unique
    <!--CLASS_HEADER_TAG-->       inserts the table headers
    <!--BOM_TABLE-->                    inserts the complete generated BOM table

### for headers.conf:
    <!--HEADER_ROW-->         inserts the column title
    <!--HEADER_CLASS_REF_TAG-->        insert the tag for the part reference. HeadRefTag 
    <!--HEADER_CLASS_QTY_TAG-->        insert the tag for the part qty. HeadQtyTag
    <!--HEADER_CLASS_VALUE_TAG-->        insert the tag for the part value. HeadValueTag

### for group.conf:
    <!--GROUP_ROW_DATA-->       inserts the group of parts row data
    <!--GROUP_CLASS_TAG-->    inserts the group class name. format "group_" + "part ref prefix"
    <!--GROUP_TITLE_TEXT-->    inserts the group title. the part ref prefix

### for row.conf:
    <!--ROW_PART_REF-->            inserts the list of parts reference designator
    <!--ROW_PART_QTY-->            inserts the number of parts grouped together
    <!--ROW_PART_VALUE-->          inserts the part value
    <!--ROW_PART_FIELDS-->          inserts the generator parts fields
    <!--ROW_CLASS_ODD_EVEN_TAG-->    returns RowEvenTag on even rows or RowOddTag for odds rows.
    <!--HEADER_CLASS_REF_TAG-->         insert the tag for the part reference. HeadRefTag 
    <!--HEADER_CLASS_QTY_TAG-->         insert the tag for the part qty. HeadQtyTag
    <!--HEADER_CLASS_VALUE_TAG-->         insert the tag for the part value. HeadValueTag

### for fields.conf:
    <!--FIELD_CLASS_TAG-->    inserts the fields class name
    <!--FIELD-->              inserts the field value

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
/// \brief This will check the entire part list for a matching value and fields and 
/// return the part index number that matches
///
/// \return -1 = no match else the index number
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
/// \brief creates the table html
///
/// \param fieldsList the array that has all the various filed names
/// \param GroupedList the array that has all the parts grouped by the ref prefix
/// \param partGroupedList the array that actually contains all the parts data
///
/// \return the hmtl output
/////////////////////////////////////////////////////////////////
function GenerateTableHtml(fieldsList, groupedList, partGroupedList)
{
    var ReturnHtml = "";

    HtmlHeader = HtmlTableRowHeaderTemplate.replace(/<!--HEADER_ROW-->/g,  "Ref");
    HtmlHeader = HtmlHeader.replace(/<!--HEADER_CLASS_REF_TAG-->/g,  "HeadRefTag");
    HtmlHeader = HtmlHeader.replace(/<!--HEADER_CLASS_QTY_TAG-->/g,  "");
    HtmlHeader = HtmlHeader.replace(/<!--HEADER_CLASS_VALUE_TAG-->/g,  "");

    HtmlHeader += HtmlTableRowHeaderTemplate.replace(/<!--HEADER_ROW-->/g,  "Qty");
    HtmlHeader = HtmlHeader.replace(/<!--HEADER_CLASS_REF_TAG-->/g,  "");
    HtmlHeader = HtmlHeader.replace(/<!--HEADER_CLASS_QTY_TAG-->/g,  "HeadQtyTag");
    HtmlHeader = HtmlHeader.replace(/<!--HEADER_CLASS_VALUE_TAG-->/g,  "");

    HtmlHeader += HtmlTableRowHeaderTemplate.replace(/<!--HEADER_ROW-->/g,  "Value");
    HtmlHeader = HtmlHeader.replace(/<!--HEADER_CLASS_REF_TAG-->/g,  "");
    HtmlHeader = HtmlHeader.replace(/<!--HEADER_CLASS_QTY_TAG-->/g,  "");
    HtmlHeader = HtmlHeader.replace(/<!--HEADER_CLASS_VALUE_TAG-->/g,  "HeadValueTag");


    fieldsList.sort();

    for ( var FieldIndex = 0; FieldIndex <  fieldsList.length; FieldIndex++ )
    {
        HtmlHeader += HtmlTableRowHeaderTemplate.replace(/<!--HEADER_ROW-->/g,  fieldsList[ FieldIndex ] );
        HtmlHeader = HtmlHeader.replace(/<!--HEADER_CLASS_REF_TAG-->/g,  "");
        HtmlHeader = HtmlHeader.replace(/<!--HEADER_CLASS_QTY_TAG-->/g,  "");
        HtmlHeader = HtmlHeader.replace(/<!--HEADER_CLASS_VALUE_TAG-->/g,  "");

    }

    groupedList.sort();

    //keep track if the table row is odd or even. true = even else is odd
    var RowIsEvenFlag = false;

    for ( var Group in groupedList )
    {
        // take a copy of the table template
        var TableHtmlTemp = HtmlTableTemplate;
        var GroupdName = groupedList[Group];

        TableHtmlTemp = TableHtmlTemp.replace(/<!--GROUP_CLASS_TAG-->/g,      "group_" + GroupdName );
        TableHtmlTemp = TableHtmlTemp.replace(/<!--GROUP_TITLE_TEXT-->/g,      GroupdName);

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
                TempRow = TempRow.replace(/<!--ROW_CLASS_ODD_EVEN_TAG-->/g, "RowEvenTag");
            }
            else
            {
                TempRow = TempRow.replace(/<!--ROW_CLASS_ODD_EVEN_TAG-->/g, "RowOddTag");   
            }
            TempRow = TempRow.replace(/<!--ROW_PART_REF-->/g, RefTemp);
            TempRow = TempRow.replace(/<!--ROW_PART_QTY-->/g, partGroupedList[GroupdName][Item].Count);
            TempRow = TempRow.replace(/<!--ROW_PART_VALUE-->/g, partGroupedList[GroupdName][Item].Value);

            TempRow = TempRow.replace(/<!--HEADER_CLASS_REF_TAG-->/g,  "HeadRefTag");
            TempRow = TempRow.replace(/<!--HEADER_CLASS_QTY_TAG-->/g,  "HeadQtyTag");
            TempRow = TempRow.replace(/<!--HEADER_CLASS_VALUE_TAG-->/g,  "HeadValueTag");

            var FieldsTemp = "";

            for ( var FieldIndex = 0; FieldIndex <  fieldsList.length; FieldIndex++ )
            {
                var SingleFieldTemp = TableFieldTemplate;

                SingleFieldTemp = SingleFieldTemp.replace(/<!--FIELD_CLASS_TAG-->/g, "Field_" + fieldsList[ FieldIndex ] );

                if( partGroupedList[ GroupdName ][ Item ].Fields[ fieldsList[ FieldIndex ] ] )
                {
                    SingleFieldTemp = SingleFieldTemp.replace(/<!--FIELD-->/g, partGroupedList[ GroupdName ][ Item ].Fields[ fieldsList[ FieldIndex ] ].replace(/,/g, " "));
                }
                else
                {
                    
                    SingleFieldTemp = SingleFieldTemp.replace(/<!--FIELD-->/g, " ");
                }

                FieldsTemp += SingleFieldTemp;
            }

            TableRowAll += TempRow.replace(/<!--ROW_PART_FIELDS-->/g, FieldsTemp);

            RowIsEvenFlag = !RowIsEvenFlag;
        }

        TableHtmlTemp = TableHtmlTemp.replace(/<!--GROUP_ROW_DATA-->/g, TableRowAll);

        ReturnHtml += TableHtmlTemp;
    }
    return ReturnHtml;
}



/////////////////////////////////////////////////////////////////
/// \brief return the html generated part table
///
/// \return the output html
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

    // get the list of fields and grouped the component with the same value
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
/// \brief This will generate the Bill of material based on the 
/// template given
/////////////////////////////////////////////////////////////////
function GenerateBOM()
{
    if ( null != UserProjectNetData && null != HtmlTemplateData)
    {
        console.log('Generating BOM');

        var Result = ExtractAndGenerateHtmlForThePart();


        HtmlTemplateData = HtmlTemplateData.replace(/<!--DATE_GENERATED-->/g,UserProjectNetData.export.design[0].date );
        HtmlTemplateData = HtmlTemplateData.replace(/<!--TITLE-->/g,        UserProjectNetData.export.design[0].sheet[0].title_block[0].title );
        HtmlTemplateData = HtmlTemplateData.replace(/<!--DATE-->/g,     UserProjectNetData.export.design[0].sheet[0].title_block[0].date );
        HtmlTemplateData = HtmlTemplateData.replace(/<!--COMPANY-->/g,  UserProjectNetData.export.design[0].sheet[0].title_block[0].company );
        HtmlTemplateData = HtmlTemplateData.replace(/<!--REVISON-->/g,  UserProjectNetData.export.design[0].sheet[0].title_block[0].rev );
        HtmlTemplateData = HtmlTemplateData.replace(/<!--COMMENT_1-->/g,    UserProjectNetData.export.design[0].sheet[0].title_block[0].comment[0].$.value );
        HtmlTemplateData = HtmlTemplateData.replace(/<!--COMMENT_2-->/g,    UserProjectNetData.export.design[0].sheet[0].title_block[0].comment[1].$.value );
        HtmlTemplateData = HtmlTemplateData.replace(/<!--COMMENT_3-->/g,    UserProjectNetData.export.design[0].sheet[0].title_block[0].comment[2].$.value );
        HtmlTemplateData = HtmlTemplateData.replace(/<!--COMMENT_4-->/g,    UserProjectNetData.export.design[0].sheet[0].title_block[0].comment[3].$.value );
        HtmlTemplateData = HtmlTemplateData.replace(/<!--TOTAL_NUM_OF_PARTS-->/g,   TotalNumberOfParts );
        HtmlTemplateData = HtmlTemplateData.replace(/<!--TOTAL_NUM_OF_UNIQUE_PARTS-->/g,    NumberOfUniqueParts );
        HtmlTemplateData = HtmlTemplateData.replace(/<!--CLASS_HEADER_TAG-->/g,   HtmlHeader);
        HtmlTemplateData = HtmlTemplateData.replace(/<!--BOM_TABLE-->/g,    Result);
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
/// \brief read the html config file
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
/// \brief read the html config file
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
/// \brief read the html config file
/////////////////////////////////////////////////////////////////
function ReadTableTemplate()
{
    console.log('Reading HTML Template for table');

    var HtmlTemplate = require('fs');
    
    HtmlTemplate.readFile(TemplateFolder + '/group.conf','utf8', function(returnError, output) 
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
    
    HtmlTemplate.readFile(TemplateFolder + '/headers.conf','utf8', function(returnError, output) 
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
/// \brief read the html config file
/////////////////////////////////////////////////////////////////
function ReadTableRowTemplate()
{
    console.log('Reading HTML Row Header Template for table');

    var HtmlTemplate = require('fs');
    
    HtmlTemplate.readFile(TemplateFolder + '/row.conf','utf8', function(returnError, output) 
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
/// \brief read the html config file
/////////////////////////////////////////////////////////////////
function ReadFieldTemplate()
{
    console.log('Reading HTML Template for fields');

    var HtmlTemplate = require('fs');
    
    HtmlTemplate.readFile(TemplateFolder + '/fields.conf','utf8', function(returnError, output) 
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
/// \brief Handles the machine state for the code process
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
