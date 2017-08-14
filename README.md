# XL Release Relationship Visualization Plugin

## Overview ##


XL Release offers outstanding capabilities for pipeline composition and execution. This plugin extends those capabilities
with the ability to visualize and navigate the relationships amongst pipelines.

![Overview](docs/img/overview.png)
  
## Features ##

* Navigate to target release/template with double click.
* Visualize releases, templates and their design, runtime relationship.
* Automatic layout arrangement.
* Drag and drop layout arrangement.

## Requirements ##

* **XL Release Server** 7+
		

## Installation ##


Plugin can be downloaded directly from the plugin's repository on [Github](https://github.com/xebialabs-community/xlr-relationship-visualization-plugin/releases).

Place the plugin's **jar** file in the __&lt;xlr-home&gt;/plugins__ directory. 

## Usage ##

When working with releases or templates, you will find an additional option called **`Relationships`** in the drop down menu.
![Menu](docs/img/menu.png)

The plugin will analyse all **`xlrease.CreateRelease`** tasks in the current release/template and its targets to build up the relationship graph.

## Development ##

This plugin is built using Node.js, Webpack and Gradle.
Execute `./gradlew clean build` in the project root to build.

### Setup development XL Release Server ###

You can setup your local development XL Release Server to point to the compiled build by modifying the classpath variable, `XL_RELEASE_SERVER_CLASSPATH`, in `<xlr-home>/bin/run.sh` 

Example :

```
DEV_HOME="/Users/ravan/labs/repos/xebialabs-community/xlr-relationship-visualization-plugin"
DEV_SERVER_CLASSPATH="${DEV_HOME}/build/app:${DEV_HOME}/src/main/resources/:${DEV_HOME}/src/main/jython/"
XL_RELEASE_SERVER_CLASSPATH="${DEV_SERVER_CLASSPATH}:${classpath_dirs}"

#XL_RELEASE_SERVER_CLASSPATH="${classpath_dirs}"
```

### Live Update ###

Once you've started the development XLR server, you can execute `npm run watch` in the project root.  Now everytime you edit the source, it will be automatically compiled and your browser automatically refreshed to reflect the changes.

