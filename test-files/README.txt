Test Files for Functional Verification
=======================================

Sample data files for end-to-end testing of each use case.
Upload these files in the app to verify column detection and processing UI.

Files
-----

ecommerce-inriver.csv
  Use case: Optimize → ecommerce
  Format: InRiver PIM export with MaterialSAPMaterialNo, MaterialSeriesName,
          MaterialLongDescriptionEcom_en, MaterialLongDescriptionEcom_de columns.
  Expected: Should detect MaterialLongDescriptionEcom columns automatically.

amazon-template.csv
  Use case: Optimize → amazon
  Format: Amazon flat file with vendor_sku#1.value, item_name#1.value,
          bullet_point#1..5.value, rtip_product_description#1.value columns.
  Expected: Should detect vendor_sku, bullet_point columns automatically.

partoo-stores.csv
  Use case: Optimize → partoo
  Format: Partoo export with 5-row header structure (grouping, defaults,
          technical IDs, display names, field descriptions) then data rows.
          Headers are read from row 4; data starts at row 6.
  Expected: Should skip to Model step with auto-mapped columns.

next-fashion.csv
  Use case: Optimize → next
  Format: NEXT supplier format with Next Supplier Code, Manufacturers Style No,
          Product Description (Item Title), Copy Design Features (Tone of Voice),
          colour, size, and composition columns.
  Expected: Should show Translator panel with auto-mapped columns.

aboutyou-fashion.csv
  Use case: Optimize → aboutyou
  Format: AboutYou format with Style No supplier, Style name supplier,
          Supplier Style Name (Style wording for Shop),
          Style Long Description for Shop columns.
  Expected: Should show Translator panel with auto-mapped columns.

csv-translation-triumph.csv
  Use case: Generate → CSV Translation
  Format: Triumph PIM export with MaterialSAPMaterialNo,
          MaterialMaterialDescription, MaterialSeriesName, MaterialBrand,
          MaterialSubBrand, MaterialB2CSeriesDescription_en,
          MaterialB2CStyleDescription_en, MaterialB2CUSPS_en columns.
  Expected: Should detect Triumph format and show language selection.

Image Analysis (no file provided)
  Use case: Generate → Image Analysis
  Upload any JPG, PNG, or WebP image to test the image preview grid.
