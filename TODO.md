#Todo List 

#Todo
done -----------
- in purchase invoice by default optoin to show pack uom and in bill pcs is okay  with 1 by default.

- when entring and click enter it should goes to next field section so user enter the balue by enter witout mouse 
and  in purchage form or bill form or any where in whole app flow same this rule in all form

- by default what ever enter in inv quantity it shoudl reflect in recv quanity witohut entring and  if user want it  will be change by user  

-in product form add and edit form  when pcs and ctn are in same quantity means not conversion saving with 1 but show by defult 2 while saving it  should  save 1. 
-------done 

done------ 
- fix ctn and pcs price calculation issue why pcs calcluation working well but not ctn 
- why totaling calculation is not wrong after point . eg when it convert ctn and base unit is given in pcs eg. buy price 58.48 per pcs and in ctn 18 pcs so that total price of 6 ctn should be (6x18)x58.48=6315.84 but it showing 6315.82 why ?? but when we are doing pcs it shows correct. 
--------done 

done -------
 - check why scheme feature  is not showing... earilier it was therey can you check for it 
 -----done

---done 
- in purchase also able to give discount on total bill after discount minus total vat will be applied meand total minus 
- discount = final total here we have to applied 13 % vat on it 

- research on how we can receive scheme suppose we have buy 4 and get 1 from supllier how we can add entry of that in our system - they add that in discount of purchase bill before applying vat percentage 13 percent so should we give same patter entry but have calculating vat on each product also how do manage how ohter software m anage it can you research on that give option or what is standeard way of doing this
---done

- make symatick ui - UX-HUB-1 — Entity list / add / edit standard (expert rollout) see the docs


- add mrp print page , so user can add details fo mpr print with some samples and font size choose, show on A4 size paper for print , choose size of stickers , print one price in one paper use contet chat gpt chat 
MRP pringitng feature 

Build a feature called MRP Sticker Generator for BikriKhata.com.

Goal:
Allow any business in Nepal (importer, manufacturer, wholesaler, retailer, small shop owner) to easily create printalso able MRP stickers on A4 paper without needing Microsoft Word or design software.

Focus ONLY on MRP sticker generation in V1.

Requirements:

Core Concept

The system should be extremely simple.

User creates a sticker by entering:

1. Sticker Title
    Example:
    * MRP NRS 95/-
    * MRP NRS 210/-
    * SALE PRICE NRS 150/-
    * RETAIL PRICE NRS 500/-
2. Description Lines

Instead of fixed fields, allow unlimited custom lines.

Example:

Line 1:
Imported & Distributed By:

Line 2:
B.J INTERNATIONAL PVT.LTD

Line 3:
Exim Code: 3041761350137NP

Line 4:
Phone Number: +977-1-5103474

Line 5:
Batch No: A123

Line 6:
Made in India

Users can add, remove, reorder, or edit any line.

No limit on number of lines.

This makes the system usable for:

* Importers
* Manufacturers
* Retailers
* Wholesalers
* Distributors
* Repackaging businesses

Sticker Designer

User can customize:

Title:

* Font size
* Font family
* Bold on/off
* Alignment
* Text color

Description:

* Font size
* Font family
* Alignment
* Line spacing

Sticker:

* Width
* Height
* Border on/off
* Border thickness
* Rounded corner radius
* Padding
* Background color

Preset Sizes

Provide presets:

Tiny:
25mm x 15mm

Small:
35mm x 20mm

Medium:
45mm x 25mm

Large:
60mm x 30mm

Custom:
User enters width and height

Live Preview

As user edits:

* Preview updates instantly
* No page refresh
* WYSIWYG preview

Smart Layout Engine

User selects:

A4 Portrait
A4 Landscape

System automatically calculates:

* Number of rows
* Number of columns
* Stickers per page

Based on:

* Sticker size
* Margins
* Spacing

Show:

“65 stickers fit on one page”

or

“120 stickers fit on one page”

Quantity

User enters:

Number of stickers required

Example:

500 stickers

System calculates:

Pages required

Example:

65 stickers/page
500 stickers needed

Total pages:
8

Multiple MRP Support

Allow multiple sticker designs in one session.

Example:

MRP 95
MRP 125
MRP 130
MRP 150

Generate separate pages automatically.

Bulk Import

Allow CSV or Excel upload.

Columns:

Title
Line1
Line2
Line3
Line4
Line5
Line6

Generate all stickers automatically.

Templates

Allow user to save templates.

Examples:

Ice Cream Template
Cosmetics Template
Grocery Template
Imported Product Template
Manufacturer Template

Nepal Compliance Assistant

Provide optional suggestions only.

Show reminder:

For imported goods, you may need:

* MRP
* Importer details

For manufacturers, you may need:

* MRP
* Batch Number
* Weight
* Manufacturing Date
* Expiry Date

Do NOT force fields.

Users should be free to design any label they want.

MRP in Nepal must be displayed clearly and is generally required on goods sold in Nepal. Labels are commonly required to contain MRP and other identifying information depending on product type and business category. (Nepal News)

Export

Support:

* Print directly
* Download PDF
* Download DOCX
* Save design

Generated files must preserve:

* Font sizes
* Layout
* Alignment
* Sticker spacing

UX Rules

The entire process should take less than 30 seconds.

User flow:

Create Sticker
→ Add Title
→ Add Description Lines
→ Select Sticker Size
→ Preview
→ Print or Download

No complicated forms.

The product should feel like Canva but specifically for MRP sticker creation.

also update doc and maintain the document as we are doing from
  erlier you can go through whole project and see how we are
  doiing how codument each and everythin that needed in future
  and how we are writen test script for all the feature after
  development  