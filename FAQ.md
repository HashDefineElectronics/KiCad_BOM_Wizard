# Frequently asked questions

The following are some of the common issues you might have while installing or using the plugin for the first time.

If you are having issues that aren't covered in this document then please checkout the forum just incase.

[KiCad Forum](https://forum.kicad.info/t/kicad-bom-wizard-plugin-with-customisable-output-can-make-html-and-csv-bom/2142)

## [1] KiCad's BOM plugin manager failed with error 2!
Unfortunately, there are a handfull of possible issues that can cause the BOM manager to return the error 2 message. It could be a mixure of one or more problem with your node.js setup. You may have to go through one or more solution in this section.

- Your system uses nodejs instead of node.
- KiCad may not know where in your system node is install.

***Error message:***
```bash
Run command:
node "/home/user/Document/KiCad_BOM_Wizard.js" "/home/user/Desktop/test/test.xml" "/home/user/Desktop/test/test.html"

Command error. Return code -1

Error messages:
execvp(node, /home/user/Document/KiCad_BOM_Wizard.js, /home/user/Desktop/test/test.xml, /home/user/Desktop/test/test.html) failed with error 2!

```

***1. Solution***

In some systems, you might have to use ***nodejs*** instead of ***node***. For example, if you've install node.js using ubuntu package manager (ie apt-get).

***2. Solution***

Use the full system path to ***node***. This will ensure that KiCad uses the correct program to run KiCad_BOM_Wizard.

 Here are some common location that you might find your copy of node in.
- Window: ```"C:/Program Files/node"```
- Mac: ```/usr/local/bin/node```
- Ubuntu: ```/usr/bin/node```

***Example:***
```bash
"/usr/bin/node" "/home/user/Document/KiCad_BOM_Wizard.js" "%I" "%O.html"
```

## [2] root permission issue when install the plugin.
In some system, npm default install uses root directories. Unfortunately, this does mean that if you try to install KiCad_BOM_Wizard globally then you are likely to run to permission error.

Don't panic, we do have a options to over come this problem.

___As a reference, here's an example of what the error message could look like:___
```bash
npm http GET https://registry.npmjs.org/kicad_bom_wizard
npm http 304 https://registry.npmjs.org/kicad_bom_wizard
npm http GET https://registry.npmjs.org/xml2js
npm http 304 https://registry.npmjs.org/xml2js
npm http GET https://registry.npmjs.org/sax
npm http GET https://registry.npmjs.org/xmlbuilder
npm http 304 https://registry.npmjs.org/xmlbuilder
npm http 304 https://registry.npmjs.org/sax
npm http GET https://registry.npmjs.org/lodash
npm http 304 https://registry.npmjs.org/lodash
npm ERR! Error: ENOENT, chmod '/usr/local/lib/node_modules/kicad_bom_wizard/KiCad_BOM_Wizard.js'
npm ERR! If you need help, you may report this log at:
npm ERR!     <http://github.com/isaacs/npm/issues>
npm ERR! or email it to:
npm ERR!     <npm-@googlegroups.com>

npm ERR! System Linux 3.13.0-37-generic
npm ERR! command "/usr/bin/nodejs" "/usr/bin/npm" "install" "-g" "kicad_bom_wizard"
npm ERR! cwd /home/miceuz/Xaltura/tindie
npm ERR! node -v v0.10.25
npm ERR! npm -v 1.3.10
npm ERR! path /usr/local/lib/node_modules/kicad_bom_wizard/KiCad_BOM_Wizard.js
npm ERR! code ENOENT
npm ERR! errno 34
npm ERR!
npm ERR! Additional logging details can be found in:
npm ERR!     /home/miceuz/Xaltura/tindie/npm-debug.log
npm ERR! not ok code 0
```

***1. Solution***

Good News! npm org are well ware of this issue and have provides some great instructions on what you can do to come this issues.

[NPM - fixing npm permission](https://docs.npmjs.com/getting-started/fixing-npm-permissions)

If you are planning on using node and npm for future projest other than for KiCad_BOM_Wizard then I would definitely do one of the two option for NPM instruction for fixing this issue.

***2. Solution***

If making changes to NPM directory isn't what you want, then you could instead not install the plugin global and instead install it where you want it. The easiest way to do this is to download the project using git and then running the npm install command inside the plugin directory.

***This will require you to type in the full path to KiCAd_BOM_Wizard.js in KiCad's BOM Manager***


```bash
cd ~/
git clone https://github.com/HashDefineElectronics/KiCad_BOM_Wizard.git
cd KiCad_BOM_Wizard/
npm install --production .
```

### [3] Error: Cannot find module 'xml2js'

This error message means that the plugin dependency wasn't isntall correctly or at all. Either npm had an issue while install the plugin or npm install wasn't run before use.

This could be the case if you download the plugin zip file directly from github and not run the install command afterwards.

***1. Solution***

run the following command inside the plugin directory.
```bash
npm install
```
