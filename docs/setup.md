# Setup Kicad BOM Plugin Manager

This instruction are for setting up KiCad BOM Plugin Manager to use KiCad_BOM_Wizard.

---
#### READ ME - Important notes!

before you continue, please note the following:

- If you `haven't` installed KiCad_BOM_Wizard globally via the npm method, then you will need to replace any references to `kicad_bom_wizard` with node `node SCRIPT_ROOT_DIR/KiCad_BOM_Wizard.js`.

- In some system, you may have to replace node with nodejs.

- MAC OSX users only!

  ```bash
  there have been reports that `node` will not run in KiCad BOM generator unless you use the full path.
  If you have this issues, try replacing `node` with `PATH_TO_NODE/node` where PATH_TO_NODE is your system absolute path to node.

  - It might this: `/usr/local/bin/node`
  ```
  Here's where it was first reported: [kiCad.info](https://forum.kicad.info/t/kicad-bom-wizard-plugin-with-customisable-output-can-make-html-and-csv-bom/2142/7?u=opticalworm)

---
# Setup

1. In KiCad, open `Eeschema`.
2. Now click on `Tools` -> `Generate Bill of Materials`.
3. Now Click on `Add Plugin`.
4. In the new window, find the location of the `KiCad_BOM_Wizard` and then click open.
5. When asked, enter a name. For example, `HTML`.
6. Update the `Command line:` with the one for the 3 options bellow.

#### Generate HTML BOM
```
kicad_bom_wizard "%I" "%O.html" "HTML"
```

#### Generate CSV BOM
```
kicad_bom_wizard "%I" "%O.csv" "CSV"
```

#### Use your own template to generate BOMs

```
kicad_bom_wizard "%I" "%O.html" "Path_To_Your_Template_conf/Your_Template"
```
