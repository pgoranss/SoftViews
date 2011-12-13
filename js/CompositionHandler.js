function CompositionHandler() {
	
	var variables = new Array();
	var START_ID = 0;
	var id = START_ID;
	
	// Constructor stuff
	var mainContent = $("#compositions_view .main_content");	
	mainContent.append("<div class='compClassList'/>");
		
	var compClassList = mainContent.children(".compClassList").last();
	
	this.add = function(nodeId) {		
		if (variables[nodeId]) {
			this.update(nodeId);
			return; // we already have this one
		}
		variables[nodeId] = new ClassObj(nodeId, id++);	
	}
	
	this.remove = function(nodeId) {
		variables[nodeId].remove();
		delete variables[nodeId];
	}
	
	this.update = function(nodeId) {
		variables[nodeId].setName();
	}
	
	this.resetHighlighting = function(nodeId) {
		for (var i in variables) {
			if (variables[i].nodeId == nodeId) {				
				variables[i].resetMePub();				
			}
		}		
	}
	
	this.clear = function() {
		for (var i in variables) {
	      variables[i].remove();
		  delete variables[i];
		}
	}	
	
    //////////////////////////////
	// ClassObj CLASS
	///////////////////////////////
	function ClassObj(nodeId, id) {	
		this.nodeId = nodeId;
		var myColor = colorRotate();
		
		compClassList.append("<div class='compVar'/>");
		var compVarDiv = compClassList.children(".compVar").last();

		var className = findName();
		
		compVarDiv.append("<div class='compVarTxt varTxt'>" + className + 
				           "</div>");
		
	    compVarDiv.append("<div class='showhideclass'>hide<div>");	    		
		
		var compVarTxt = compVarDiv.children(".compVarTxt").last();
		var showhideclass = compVarDiv.children(".showhideclass").last();
		showhideclass.hide();
		showhideclass.click(function() {
			var nodes = graph.getNodes();
			var n = nodes[nodeId];
			if ($(this).html() == "hide") {			
				n.hideMe();			
				$(this).html("show");
			}
			else {
				n.showMe();			
				$(this).html("hide");
			}
		});

		compVarTxt.css({"display" : "inline",
			              "cursor" : "pointer"});
		
		compVarDiv.append("<div class='subMenu'/>");
		var subMenu = compVarDiv.children(".subMenu").last();

		subMenu.hide();
		
		compVarTxt.click(function() {
			var showSubMenu = false;
			if (subMenu.css("display") == "none") {
				showSubMenu = true;
			}
			if ( showSubMenu == true ) {			
				///////////////////////////////////////////////////////////
				// We have to search for this class everywhere
				//////////////////////////////////////////////////////////			
				subMenu.html(""); // Clear out anything that was in here			
				
				var nodes = graph.getNodes();
	
				var foundanything = false;
				for (var i in nodes) {
					// Get the text from this node
					var txt = nodes[i].getText();
					var nodeName = nodes[i].getNodeName();
					//Find instances of 'name' in the txt	
					var regex = new RegExp("new\\s+" + className + "\\W","");
					var regex1 = new RegExp("\\.prototype\\W+new\\s+" + className + "\\W","");
					if (txt.match(regex) && !txt.match(regex1)) {
						
						foundanything = true;
						subMenu.append("<div class='compVarFound varFound' value='"+ i +"'>" + 
								       " composed in " + nodeName + "</div>");	
						var compVarFound = subMenu.children(".compVarFound").last();						
						compVarFound.click(function() {							
							var n = $(this).attr("value");
							nodes[n].moveToFront();
						});
					
						// Now highlight source code
						var buffer = new Array();
						var locVars = new Array();
						var lines = txt.split(/\r\n|\r|\n/);
						for (var n=0; n < lines.length; n++) {
							var outline = lines[n];
							
							if (lines[n].match(regex)) {
								outline = "<div class='compHighLight compVar"+ id + 
								          "' style='color:"+ myColor +";'>" + outline + "</div>";
								
								// We also need to store any variables this "new" statement
								// is dumped into so we can make a second pass
								var regex2 = new RegExp("([\\w\.]+)\\s*=\\s*new\\s+" + className,"");
								var result = lines[n].match(regex2);
	
								if (result) locVars.push(result[1]);
							}	
							buffer.push(outline);
						}
						
						// Do it again but now search for locVars
						var finalbuffer = "";
						
						for (var n=0; n < buffer.length; n++) {
							var outline = buffer[n];
							
							for (var k=0; k<locVars.length; k++) {	
							  var regex3 = new RegExp("[^\.\\w]" + locVars[k] + "\\W","");
							  if (buffer[n].match(regex3)) {
								  // highlight this line if it hasn't already been
								  if (!outline.match("compHighLight compVar" + id)) {
								    outline = "<div class='compHighLight compVar"+ id + 
						            "' style='color:"+ myColor +";'>" + outline + "</div>";
								  }
								  break;
								  
							  }						
							}
							
							finalbuffer += outline + "\n"
						}
						
	
		    			// Put the buffer back into savedTxt
						nodes[i].setSavedText(finalbuffer);
						
						var scrollTo = $(".compVar" + id).last();
						var container = nodes[i].savedTxt;								
						container.scrollTop(
							    scrollTo.offset().top - container.offset().top + container.scrollTop()
						);
					}
                    									
				}
				
				if (!foundanything) {
					subMenu.append("<div class='compVarFound varFound'>No composition found</div>");
				}

				subMenu.show();
			} 
			else {
				// Unhilight everything				
			    resetMe();
			    subMenu.hide();			    			    			   
			}
		});
		
		this.resetMePub = function() {			
			resetMe();
		}
		
		function resetMe() {
			
			$(".compVar" + id).each(function(index) {
				var h = $(this);
				if (h.html() != null) {
					var innerHtml = h.html();
					h.before(innerHtml);					
					h.remove();
				}				
			});
			

		}
		
		function findName() {
			if (!graph) {  
				// This is the first run, opening  				
			  return "";	
			}
			
			var nodes = graph.getNodes();					
			
			var txt = nodes[nodeId].getText();
			var className = "";
			var lines = txt.split(/\r\n|\r|\n/);
			for (var n=0; n < lines.length; n++) {
				var outline = lines[n];
				var result = lines[n].match(/\s*function\s+(\w+)\s*\(/);

				if (result) {				  
			      className += result[1];
			      break; // We are only going to look for the first instance
				}		
			}
			
			return className;
		}
		
		
		this.setName = function() {
			var name = findName();
			className = name;
			compVarTxt.html(name);
			if (name.match(/\S/)) {
				showhideclass.show();
			}
			else {
				showhideclass.hide();
			}
		}
		
		this.remove = function() {
			compVarDiv.remove();
		}
		
	}

}



