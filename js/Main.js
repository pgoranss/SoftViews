// Some global variables
var graph;
var globalVars;
var compositions;
var resources;
var filename = "Untitled";

// Jquery main executed after page load
$(function(){
	
  // Initialize the views
  globalVars = new GlobalVariablesHandler();
  compositions = new CompositionHandler();
  resources = new ResourcesHandler();	
	  
  graph = new NodeGraph();	
  
  // consider moving to NodeGraph
  $("#canvas").mouseup(function(e){
     if (openWin.css("display") == "none"){
       var children = $(e.target).children();
       if (children.length > 0){
         var type = children[0].tagName;
         if (type == "desc" || type == "SPAN"){
           graph.addNodeAtMouse();
         }
       }
     }
  });
  
  // ui code
  var openWin = $("#openWin");
  openWin.hide();   
  $("#clear").click(function(){
    graph.clearAll();
  });
 
  $("#save").click(saveFile);
  
  function saveFile(){  	 
	if(graph.checkSavedNodes() == false) {
	  alert("Some nodes are Hidden or still in Edit Mode\n" +
			"All nodes must be visible and saved before file can be saved");
	  return;
	}	  
	var name = "";  
	if (!(name=prompt("Please enter filename",filename))) {
		return;
	}    
	if (name == "" || name == nameMessage){
      alert("Please Name Your File");
      return;
    }	   
	filename = name;
    $.post("json/save.php", {data:graph.toJSON(), name:name}, function(data){
      alert("Your file was saved.");
    });
  }
  
  $("#canvas").mousedown(function(){
    openWin.fadeOut();
  });
  
  $("#open").click(function(){
    var fileList =  $("#files");
    fileList.html("<div>loading...<\/div>");
    openWin.fadeIn();
    fileList.load("json/files.php?"+Math.random()*1000000);
  });
  
  var nameMessage = "Untitled";

  
  $(".file").live('click', function() {

    var name = $(this).text();
    openWin.fadeOut();

    $.getJSON("files/" + name + ".json", {n:Math.random()}, function(data){
       graph.fromJSON(data);
       filename = name;
    });
    
  }).live('mouseover', function(){
    $(this).css({"background-color": "#ededed"});
  }).live("mouseout", function(){
    $(this).css({"background-color": "white"});
  });

  // Give the canvas a background color
  var svg = $("#canvas svg:first");  
  svg.css({"background-color" : "#C4CDDE"});  
  
});   


// Rotate through like 15 colors since we
// May have many variables to highlight
// This list can be expanded later on...
var colorIdx = 0;
var colors = new Array(
	"#46577C",
	"#50467C",
	"#6B467C",
	"#7C4657",
	"#46727C",
	"#5C72A3",
	"#8394B9",
	"#7C4657",
	"#467C6B",
	"#B9A883",
	"#A38D5C",
	"#7C5046",
	"#467C50",
	"#577C64",
	"#727C46",
	"#7C6B46"
);

function colorRotate() {	
	if (colorIdx > colors.length) {
		colorIdx = 0;
	}
	return colors[colorIdx++];
}

function addSlashes(str) {
    str = str.replace(/\\/g,'&bkslash;');
    str = str.replace(/\'/g,'&squote;');
    str = str.replace(/\"/g,'&quote;');
    str = str.replace(/\0/g,'&nc;');
    str = str.replace(/\n/g,'&nl;');
    str = str.replace(/{/g,'&obraces;');
    str = str.replace(/}/g,'&cbraces;');
    str = str.replace(/:/g,'&cl;');
    str = str.replace(/,/g,'&cm;');
    str = str.replace(/\t/g,'&tb;');
    return str;
  }

  function remspecialchar(str) {
    str = str.replace(/&bkslash;/g,"\\");
    str = str.replace(/&squote;/g,"\'");
    str = str.replace(/&quote;/g,"\"");
    str = str.replace(/&nc;/g,"\0");
    str = str.replace(/&nl;/g,"\n");
    str = str.replace(/&obraces;/g,"{");
    str = str.replace(/&cbraces;/g,"}");
    str = str.replace(/&cl;/g,":");
    str = str.replace(/&cm;/g,",");
    str = str.replace(/&tb;/g,"\t");
    return str;
  }   
  

/* 
 * Would like to implement a remove comments function
 * for better source code parsing
 * */
function removeComments(txt) {

}


