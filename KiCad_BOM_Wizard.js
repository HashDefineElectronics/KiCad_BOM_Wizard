/////////////////////////////////////////////////////////////////
/// This is the source code file KiCad_BOM_Wizard.js, this is a free KiCad BOM plugin.
/// Copyright (C) 2016  Ronald A. N. Sousa www.hashdefineelectronics.com/
///
/// This program is free software: you can redistribute it and/or modify
/// it under the terms of the GNU General Public License as published by
/// the Free Software Foundation, either version 3 of the License, or
/// (at your option) any later version.
///
/// This program is distributed in the hope that it will be useful,
/// but WITHOUT ANY WARRANTY; without even the implied warranty of
/// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
/// GNU General Public License for more details.
///
/// You should have received a copy of the GNU General Public License
/// along with this program.  If not, see <http://www.gnu.org/licenses/>.
///    
/// \file KiCad_BOM_Wizard.js
/// \Author Ronald Sousa http://hashdefineelectronics.com/kicad-bom-wizard/
/// \revision 0.1
/// 
/// \repository: https://github.com/HashDefineElectronics/KiCad_BOM_Wizard.git
/// 
/// \website http://hashdefineelectronics.com/kicad-bom-wizard/
/// 
/// \brief This KiCad plugin can be used to create custom BOM files based on easy 
/// configurable templates files. The plugin is writing in JavaScript and has been 
/// designed to integrate into KiCad’s BOM plugin manager.
/// 
/////////////////////////////////////////////////////////////////

/////////////////////////////////////////////////////////////////
/// \brief defines the plugin revision number
/////////////////////////////////////////////////////////////////
var PluginRevisionNumber = "0";

/////////////////////////////////////////////////////////////////
/// \brief Defines KiCad Revision number
/////////////////////////////////////////////////////////////////
var KiCadXMLRevision = "D";

/////////////////////////////////////////////////////////////////
/// \brief Defines the minimum number of arguments this plugins
/// takes
/////////////////////////////////////////////////////////////////
var MinmumNumOfExpectedArguments = 4;

/////////////////////////////////////////////////////////////////
/// \brief holds the processed header data
/////////////////////////////////////////////////////////////////
var OutputHeader = "";

/////////////////////////////////////////////////////////////////
/// \brief holds the template data for main body template
/// should be KiCadXmlFilePath/template.conf
/////////////////////////////////////////////////////////////////
var Template = null;

/////////////////////////////////////////////////////////////////
/// \brief holds the template data for table group
/// should be KiCadXmlFilePath/group.conf
/////////////////////////////////////////////////////////////////
var GroupTemplate = null;

/////////////////////////////////////////////////////////////////
/// \brief holds the template data for table rows
/// should be KiCadXmlFilePath/row.conf
/////////////////////////////////////////////////////////////////
var RowTemplate = null;

/////////////////////////////////////////////////////////////////
/// \brief holds the template data for table headers
/// should be KiCadXmlFilePath/headers.conf
/////////////////////////////////////////////////////////////////
var HeadersTemplate = null;

/////////////////////////////////////////////////////////////////
/// \brief holds the template data for fields
/// should be KiCadXmlFilePath/fields.conf
/////////////////////////////////////////////////////////////////
var FieldsTemplate = null;

/////////////////////////////////////////////////////////////////
/// \brief This is the project KiCad XML file to use to
/// extract the BOM information
/////////////////////////////////////////////////////////////////
var KiCadXmlFilePath = "";

/////////////////////////////////////////////////////////////////
/// \brief the path and file name to use to create the output BOM
/////////////////////////////////////////////////////////////////
var OutputFilePath = "";

/////////////////////////////////////////////////////////////////
/// \brief This is the path to the template files to use
/// when creating the BOM
/////////////////////////////////////////////////////////////////
var TemplateFolder = __dirname + '/Template/';

/////////////////////////////////////////////////////////////////
/// \brief javascript object class of the KiCadXmlFilePath file
/////////////////////////////////////////////////////////////////
var UserProjectNetData = null;

/////////////////////////////////////////////////////////////////
/// \brief keep track of the number of unique parts found while
/// creating the BOM
/////////////////////////////////////////////////////////////////
var NumberOfUniqueParts = 0;

/////////////////////////////////////////////////////////////////
/// \brief keep track of the number of parts found while
/// creating the BOM
/////////////////////////////////////////////////////////////////
var TotalNumberOfParts = 0;



GetArguments();
PluginDetails();
Task("STATE_GET_XML_DATA"); // Run the first task.



/////////////////////////////////////////////////////////////////
/// \brief This will check the entire part list for a matching
/// value and fields and return the part's index number that matches
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
/// \brief creates the table
///
/// \param fieldsList the array that has all the various filed names
/// \param GroupedList the array that has all the parts grouped by the ref prefix
/// \param partGroupedList the array that actually contains all the parts data
///
/// \return the output
/////////////////////////////////////////////////////////////////
function GenerateTable(fieldsList, groupedList, partGroupedList)
{
    var ReturnOutput = "";

    OutputHeader = HeadersTemplate.replace(/<!--HEADER_ROW-->/g,  "Ref");
    OutputHeader = OutputHeader.replace(/<!--HEADER_CLASS_REF_TAG-->/g,  "HeadRefTag");
    OutputHeader = OutputHeader.replace(/<!--HEADER_CLASS_QTY_TAG-->/g,  "");
    OutputHeader = OutputHeader.replace(/<!--HEADER_CLASS_VALUE_TAG-->/g,  "");

    OutputHeader += HeadersTemplate.replace(/<!--HEADER_ROW-->/g,  "Qty");
    OutputHeader = OutputHeader.replace(/<!--HEADER_CLASS_REF_TAG-->/g,  "");
    OutputHeader = OutputHeader.replace(/<!--HEADER_CLASS_QTY_TAG-->/g,  "HeadQtyTag");
    OutputHeader = OutputHeader.replace(/<!--HEADER_CLASS_VALUE_TAG-->/g,  "");

    OutputHeader += HeadersTemplate.replace(/<!--HEADER_ROW-->/g,  "Value");
    OutputHeader = OutputHeader.replace(/<!--HEADER_CLASS_REF_TAG-->/g,  "");
    OutputHeader = OutputHeader.replace(/<!--HEADER_CLASS_QTY_TAG-->/g,  "");
    OutputHeader = OutputHeader.replace(/<!--HEADER_CLASS_VALUE_TAG-->/g,  "HeadValueTag");

    fieldsList.sort();

    for ( var FieldIndex = 0; FieldIndex <  fieldsList.length; FieldIndex++ )
    {
        OutputHeader += HeadersTemplate.replace(/<!--HEADER_ROW-->/g,  fieldsList[ FieldIndex ] );
        OutputHeader = OutputHeader.replace(/<!--HEADER_CLASS_REF_TAG-->/g,  "");
        OutputHeader = OutputHeader.replace(/<!--HEADER_CLASS_QTY_TAG-->/g,  "");
        OutputHeader = OutputHeader.replace(/<!--HEADER_CLASS_VALUE_TAG-->/g,  "");
    }

    groupedList.sort();

    //keep track if the table row is odd or even. true = even else is odd
    var RowIsEvenFlag = false;

    for ( var Group in groupedList )
    {
        // take a copy of the table template
        var TableTemp = GroupTemplate;
        var GroupdName = groupedList[Group];

        TableTemp = TableTemp.replace(/<!--GROUP_CLASS_TAG-->/g,      "group_" + GroupdName );
        TableTemp = TableTemp.replace(/<!--GROUP_TITLE_TEXT-->/g,      GroupdName);

        var TableRowAll = "";
        for ( var Item in partGroupedList[GroupdName] )
        {
            var TempRow = RowTemplate;
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
                var SingleFieldTemp = FieldsTemplate;

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

        TableTemp = TableTemp.replace(/<!--GROUP_ROW_DATA-->/g, TableRowAll);

        ReturnOutput += TableTemp;
    }
    return ReturnOutput;
}

/////////////////////////////////////////////////////////////////
/// \brief return the generated part table
///
/// \return the output
/////////////////////////////////////////////////////////////////
function ExtractAndGenerateDataForThePart()
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

    return GenerateTable(ListOfFields, GroupedList, PartGroupedList);
}

/////////////////////////////////////////////////////////////////
/// \brief This will generate the Bill of material based on the
/// template given
/////////////////////////////////////////////////////////////////
function GenerateBOM()
{
    if ( null != UserProjectNetData && null != Template)
    {

        Message("Generating BOM [ "  + OutputFilePath + " ]");

        var Result = ExtractAndGenerateDataForThePart();

        Template = Template.replace(/<!--DATE_GENERATED-->/g,UserProjectNetData.export.design[0].date );
        Template = Template.replace(/<!--TITLE-->/g,        UserProjectNetData.export.design[0].sheet[0].title_block[0].title );
        Template = Template.replace(/<!--DATE-->/g,     UserProjectNetData.export.design[0].sheet[0].title_block[0].date );
        Template = Template.replace(/<!--COMPANY-->/g,  UserProjectNetData.export.design[0].sheet[0].title_block[0].company );
        Template = Template.replace(/<!--REVISON-->/g,  UserProjectNetData.export.design[0].sheet[0].title_block[0].rev );
        Template = Template.replace(/<!--COMMENT_1-->/g,    UserProjectNetData.export.design[0].sheet[0].title_block[0].comment[0].$.value );
        Template = Template.replace(/<!--COMMENT_2-->/g,    UserProjectNetData.export.design[0].sheet[0].title_block[0].comment[1].$.value );
        Template = Template.replace(/<!--COMMENT_3-->/g,    UserProjectNetData.export.design[0].sheet[0].title_block[0].comment[2].$.value );
        Template = Template.replace(/<!--COMMENT_4-->/g,    UserProjectNetData.export.design[0].sheet[0].title_block[0].comment[3].$.value );
        Template = Template.replace(/<!--TOTAL_NUM_OF_PARTS-->/g,   TotalNumberOfParts );
        Template = Template.replace(/<!--TOTAL_NUM_OF_UNIQUE_PARTS-->/g,    NumberOfUniqueParts );
        Template = Template.replace(/<!--CLASS_HEADER_TAG-->/g,   OutputHeader);
        Template = Template.replace(/<!--BOM_TABLE-->/g,    Result);
        // output BOM
        var OutputFilePathWrite = require('fs');

        OutputFilePathWrite.writeFile(OutputFilePath, Template, function(returnError)
        {
            if(returnError)
            {
                 ErrorMessage(returnError);
            }

            Message("BOM created");
        });
    }
    else
    {
        ErrorMessage('Error generating BOM');
    }
}

/////////////////////////////////////////////////////////////////
/// \brief read the user KiCad file. This will also convert the
/// the xml data to javascript object.
/////////////////////////////////////////////////////////////////
function ReadXmlFile()
{
    var xml2js = require('xml2js');
    var parser = new xml2js.Parser();

    XMLFile = require('fs');

    Message("reading KiCad XML file [ " + KiCadXmlFilePath + " ]");

    XMLFile.readFile( KiCadXmlFilePath, function(returnError, output)
    {
        // returnError should return null if the file was read correctly
        if(null == returnError)
        {
            // Convert kicad XML data to javascript object class
            parser.parseString(output, function (returnError, result)
            {
                // returnError should return null if the data was converted correctly
                if ( null == returnError )
                {
                    UserProjectNetData = result;

                    if (UserProjectNetData.export.$.version != KiCadXMLRevision)
                    {
                        ErrorMessage("Incompatible KiCad XML version: Expected " + KiCadXMLRevision + " Found " + UserProjectNetData.export.$.version);
                    }

                    Task("STATE_READ_TEMPLATE");
                }
                else
                {
                    ErrorMessage(returnError);
                }
            });
        }
        else
        {
            ErrorMessage(err);
        }
    });
}

/////////////////////////////////////////////////////////////////
/// \brief read template.conf
/////////////////////////////////////////////////////////////////
function ReadTemplateFile()
{
    Message("Reading Template [ " + TemplateFolder + " ]");

    var FileTemp = require('fs');

    FileTemp.readFile(TemplateFolder + '/template.conf','utf8', function(returnError, output)
    {
        // returnError should return null if the data was read correctly
        if ( null == returnError )
        {
            Template = output;
            Task("STATE_READ_TABLE_TEMPLATE");
        }
        else
        {
            ErrorMessage('Error reading template.conf');
        }
    });
}

/////////////////////////////////////////////////////////////////
/// \brief read group.conf
/////////////////////////////////////////////////////////////////
function ReadGroupFile()
{
    var FileTemp = require('fs');

    FileTemp.readFile(TemplateFolder + '/group.conf','utf8', function(returnError, output)
    {
        // returnError should return null if the data was read correctly
        if ( null == returnError )
        {
            GroupTemplate = output;
            Task("STATE_READ_TABLE_ROW_HEADER_TEMPLATE");
        }
        else
        {
            ErrorMessage('Error reading group.conf');
        }
    });
}

/////////////////////////////////////////////////////////////////
/// \brief read headers.conf
/////////////////////////////////////////////////////////////////
function ReadHeadersFile()
{
    var FileTemp = require('fs');

    FileTemp.readFile(TemplateFolder + '/headers.conf','utf8', function(returnError, output)
    {
        // returnError should return null if the data was read correctly
        if ( null == returnError )
        {
            HeadersTemplate = output;
            Task("STATE_READ_TABLE_ROW_TEMPLATE");
        }
        else
        {
            ErrorMessage('Error reading headers.conf');
        }
    });
}

/////////////////////////////////////////////////////////////////
/// \brief read row.conf
/////////////////////////////////////////////////////////////////
function ReadRowFile()
{
    var FileTemp = require('fs');

    FileTemp.readFile(TemplateFolder + '/row.conf','utf8', function(returnError, output)
    {
        // returnError should return null if the data was read correctly
        if ( null == returnError )
        {
            RowTemplate = output;
            Task("STATE_READ_Field_TEMPLATE");
        }
        else
        {
           ErrorMessage('Error reading row.conf');
        }
    });
}

/////////////////////////////////////////////////////////////////
/// \brief read fields.conf
/////////////////////////////////////////////////////////////////
function ReadFieldFile()
{

    var FileTemp = require('fs');

    FileTemp.readFile(TemplateFolder + '/fields.conf','utf8', function(returnError, output)
    {
        // returnError should return null if the data was read correctly
        if ( null == returnError )
        {
            FieldsTemplate = output;
            Task("STATE_GENERATE_BOM");
        }
        else
        {
            ErrorMessage('Error reading fields.conf');
        }
    });
}

/////////////////////////////////////////////////////////////////
/// \brief Handles getting the arguments pass to the plugin
/////////////////////////////////////////////////////////////////
function GetArguments()
{
    // make sure that we have enough parameter to continue
    if(process.argv.length < MinmumNumOfExpectedArguments)
    {
        ErrorMessage("Too few arguments. Found " + process.argv.length + " Expected at least " + MinmumNumOfExpectedArguments);
    }

    KiCadXmlFilePath = process.argv[2];
    OutputFilePath = process.argv[3];

    if( process.argv.length >  MinmumNumOfExpectedArguments )
    {
        // the user has specified template they wish to use.


        if ( PathExist( process.argv[4] ) ) // check if use template path exist
        {
            TemplateFolder = process.argv[4];
        }
        else if ( PathExist( TemplateFolder + process.argv[4] ) ) // now check if the user is wanting to use a  template in KiCad_BOM_Wizard/Template
        {
            TemplateFolder += process.argv[4];
        }
        else
        {
           ErrorMessage("Template directory not found: [ " + process.argv[4] + " ]");
        }
    }
    else
    {
        TemplateFolder += "HTML";
    }
}

/////////////////////////////////////////////////////////////////
/// \brief This function can be used to check if the given path
/// exist
///
/// \return true on success else false false
/////////////////////////////////////////////////////////////////
function PathExist(path)
{
    // first check if directory exist
    var FileSystem = require('fs');
    try
    {
        if ( FileSystem.statSync( path ).isDirectory() )
        {
            return true;
        }
    }
    catch(ex)
    {
       // we can ignore the error message
    }

    return false;
}

/////////////////////////////////////////////////////////////////
/// \brief Handles the machine state.
/////////////////////////////////////////////////////////////////
function Task(state)
{
    switch(state)
    {
        case "STATE_GET_XML_DATA":
            ReadXmlFile();
        break;

        case "STATE_READ_TEMPLATE":
            ReadTemplateFile();
        break;

        case "STATE_READ_TABLE_TEMPLATE":
            ReadGroupFile();
        break;

        case "STATE_READ_TABLE_ROW_HEADER_TEMPLATE":
            ReadHeadersFile();
        break;

        case "STATE_READ_TABLE_ROW_TEMPLATE":
            ReadRowFile();
        break;

        case "STATE_READ_Field_TEMPLATE":
            ReadFieldFile();
        break;

        case "STATE_GENERATE_BOM":
            GenerateBOM();
        break;

        default:
            ErrorMessage('Task() default error');
        break;
    }

}

/////////////////////////////////////////////////////////////////
/// \brief This function will display the plugin information
/// and the data pass by user.
/////////////////////////////////////////////////////////////////
function PluginDetails()
{
    console.log("KiCad_BOM_Wizard Rev:"  + PluginRevisionNumber );
}

/////////////////////////////////////////////////////////////////
/// \brief this function is used to make a standard format
/// for error messages.
/// this also handle exiting the program
/////////////////////////////////////////////////////////////////
function ErrorMessage(message)
{
    console.log("\n\n");
    console.log("Error *****");
    console.log(message);
    console.log("\n\n");
    process.exit(1);
}

/////////////////////////////////////////////////////////////////
/// \brief this function is used to make a standard format
/// for error messages.
/// this also handle exiting the program
/////////////////////////////////////////////////////////////////
function Message(message)
{
    console.log(message);
}
