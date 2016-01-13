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

#### Terminal or Kicad BOM Tool:
    node "Kicad_Html_BOM.js" "%I" "%O.html"
    node "Kicad_Html_BOM.js" "%I" "%O.csv" "Template/CSV"
    node "Kicad_Html_BOM.js" "%I" "%O.html" "Path_To_Your_Template_conf"
    node "Kicad_Html_BOM.js" "%I" "%O.csv" "Path_To_Your_Template_conf"

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

## for TableTemplate.html:
    <!--TAG_BOM_TABLE_ROW_DATA-->       inserts the group of parts row data
    <!--TAG_BOM_TABLE_GROUP_CLASS-->    inserts the group class name.
    <!--TAG_BOM_TABLE_GROUP_TITLE-->    inserts the group title

## for PartRowTemplate.html:
    <!--TAG_BOM_TABLE_PART_REF-->       inserts the list of parts reference designator
    <!--TAG_BOM_TABLE_PART_QTY-->       inserts the number of parts grouped together
    <!--TAG_BOM_TABLE_PART_Value-->     inserts the part value
    <!--TAG_BOM_TABLE_PART_FIELD-->     inserts the generator parts fields

## for TableFieldTemplate:
    <!--TAG_BOM_TABLE_FIELD_CLASS_TAG-->    inserts the fields class name
    <!--TAG_BOM_TABLE_FIELD-->              inserts the field value
