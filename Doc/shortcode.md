# List of short codes

These are the list of short code that are used in the template files.

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
    <!--HEADER_CLASS_VALUE_TAG-->        insert the tag for the part value. HeadValueTag

### for group.conf:
    <!--GROUP_ROW_DATA-->       inserts the group of parts row data
    <!--GROUP_CLASS_TAG-->    inserts the group class name. format "group_" + "part ref prefix"
    <!--GROUP_TITLE_TEXT-->    inserts the group title. the part ref prefix

### for row.conf:
    <!--ROW_PART_REF-->            inserts the list of parts reference designator
    <!--ROW_PART_QTY-->            inserts the number of parts grouped together
    <!--ROW_PART_VALUE-->          inserts the part value
    <!--ROW_PART_FOOTPRINT-->      inserts the part footprint.
    <!--ROW_PART_DATASHEET-->      inserts the part datasheet.
    <!--ROW_PART_FIELDS-->          inserts the generator parts fields
    <!--ROW_CLASS_ODD_EVEN_TAG-->    returns RowEvenTag on even rows or RowOddTag for odds rows.
    <!--HEADER_CLASS_REF_TAG-->         insert the tag for the part reference. HeadRefTag
    <!--HEADER_CLASS_QTY_TAG-->         insert the tag for the part qty. HeadQtyTag
    <!--HEADER_CLASS_VALUE_TAG-->         insert the tag for the part value. HeadValueTag
    <!--HEADER_CLASS_FOOTPRINT_TAG-->         insert the tag for the part footprint. HeadFootprintTag
    <!--HEADER_CLASS_DATASHEET_TAG-->         insert the tag for the part datasheet. HeadDatasheetTag


### for fields.conf:
    <!--FIELD_CLASS_TAG-->    inserts the fields class name
    <!--FIELD-->              inserts the field value
