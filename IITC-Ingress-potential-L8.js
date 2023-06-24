// ==UserScript==
// @author         diadomraz
// @name           Check for potential L8 portals.
// @category       Highlighter
// @version        0.2
// @description    Hides any portal lower than level 7 and allows to check/record resonator status.
// @id             IITC-Ingress-potential-L8@diadomraz
// @updateURL      https://raw.githubusercontent.com/diadomraz/IITC-Ingress-potential-L8/main/IITC-Ingress-potential-L8.js
// @downloadURL    https://raw.githubusercontent.com/diadomraz/IITC-Ingress-potential-L8/main/IITC-Ingress-potential-L8.js
// @match          https://intel.ingress.com/*
// @grant          none
// ==/UserScript==


function wrapper(plugin_info) {
    // ensure plugin framework is there, even if iitc is not yet loaded
    if(typeof window.plugin !== 'function') window.plugin = function() {};

    // use own namespace for plugin
    window.plugin.PotentialLevelEight = function() {};

    /**
     * Indicates whether portals are displayed at the current level.  Simply using zoom level
     * does not factor in other tools that adjust display capabilities.
     */
     window.plugin.PotentialLevelEight.zoomLevelHasPortals = function() {
        return window.getMapZoomTileParameters(window.getDataZoomForMapZoom(window.map.getZoom())).hasPortals;
    };

    //A list of found portals for export
    window.plugin.PotentialLevelEight.portals=[];

    window.plugin.PotentialLevelEight.hidePortal = function(data, conditional) {
        var d = data.portal.options.data;
        var health = d.health;
        var guid = data.portal.options.ent[0];

            // Hide any portal that meets the conditions.
        var style = {};

        if (conditional(guid, d) == false && window.plugin.PotentialLevelEight.zoomLevelHasPortals()) {

            style.fillOpacity = 0.0;
            style.radius = 0.1;
            style.opacity = 0.0;

        } else {
            window.plugin.PotentialLevelEight.setStyleByLevel(style, d, guid);
        }

        data.portal.setStyle(style);

    }

    window.plugin.PotentialLevelEight.setStyleByLevel = function(style, data, guid){
        switch (data.level) {
            case 7:
              style.fillColor = 'yellow';
              var details = window.portalDetail.get(guid);
              if (details && details !== 'undefined'&& details.resonators && details.resonators !== 'undefined'){
                let sumres=0;
                for (let index = 0; index < details.resonators.length; ++index) {
                    sumres += (details.resonators[index].level==8?1:0);
                }
                if(sumres==7){
                  style.fillColor = '#8B0000';
                  style.opacity = 1;
                  if(!window.plugin.PotentialLevelEight.portals[guid]){
                    //console.log("Found for upgrade: "+details.title + " - " + (details.latE6/1000000) + "," + (details.lngE6/1000000));
                    window.plugin.PotentialLevelEight.portals[guid]={"title":details.title, "latlng": (details.latE6/1000000) + "," + (details.lngE6/1000000)};
                  }
                }
                else {
                  style.fillColor = 'white';
                  style.opacity = 1;
                }
              }
              else {
                  //console.log("need data for "+guid);
              }
            break;
            case 8: style.fillColor = 'magenta'; break;
          }
    }

     window.plugin.PotentialLevelEight.notDeployed = function(guid, data) {
        return (data.resCount == 8 && data.level>6)
    }

    window.plugin.PotentialLevelEight.highlightDeployed = function(data) {
        window.plugin.PotentialLevelEight.hidePortal(data, window.plugin.PotentialLevelEight.notDeployed);
    }
    window.plugin.PotentialLevelEight.exportData = function(data) {
        window.plugin.PotentialLevelEight.hidePortal(data, window.plugin.PotentialLevelEight.notDeployed);
    }
    window.plugin.PotentialLevelEight.generateCsvData = function() {
        var csvData = "GUID;Name;LatLong\n";
        for (var i in window.plugin.PotentialLevelEight.portals){
           var str=window.plugin.PotentialLevelEight.portals[i]["title"];
           str.replace(/\"/g, "\\\"")
           csvData += i + ";\""+str+ "\";"+window.plugin.PotentialLevelEight.portals[i]["latlng"] + "\n";
        };

        return csvData;
    };

    window.plugin.PotentialLevelEight.downloadCSV = function() {
        var csvData = window.plugin.PotentialLevelEight.generateCsvData();
        var todayDate = new Date().toISOString().slice(0, 10);
        todayDate = todayDate.replace(/(-|\s)/g,"");
        var link = document.createElement("a");
        link.download = 'Portal_Export.'+todayDate+'.csv';
        link.href = "data:text/csv," + csvData;
        link.click();
    }

    var setup = function() {
        window.addPortalHighlighter('Level 7 & 8', window.plugin.PotentialLevelEight.highlightDeployed);
        $('#toolbox').append('<a onclick="window.plugin.PotentialLevelEight.downloadCSV();return false;">Download L7</a>');
    }

    setup.info = plugin_info; //add the script info data to the function as a property
    if(!window.bootPlugins) window.bootPlugins = [];
    window.bootPlugins.push(setup);
    // if IITC has already booted, immediately run the 'setup' function
    if(window.iitcLoaded && typeof setup === 'function') setup();
} // wrapper end
// inject code into site context
var script = document.createElement('script');
var info = {};
if (typeof GM_info !== 'undefined' && GM_info && GM_info.script) info.script = { version: GM_info.script.version, name: GM_info.script.name, description: GM_info.script.description };
script.appendChild(document.createTextNode('('+ wrapper +')('+JSON.stringify(info)+');'));
(document.body || document.head || document.documentElement).appendChild(script);

