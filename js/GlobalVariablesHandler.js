function GlobalVariablesHandler() {
	
	var variables = new Array();
	var id = 0;
	
	var DEFAULT_NUM = 9999999999;
	
	// Constructor stuff
	var mainContent = $("#global_view .main_content");

	mainContent.append("<div class='globalVarList'/>");
	
	var globalVarList = mainContent.children(".globalVarList").last();

	this.add = function(name, nodeId) {
		if (variables[name]) {
			return; // we already have this one
		}
		variables[name] = new GlobalVariable(name, id++, nodeId);		

	}
	
	this.update = function(nodeId) {
		if (!graph) return; // This is the first run so ignore
		
		// first clear everything out
		this.removeVarsInNode(nodeId);
		
		// Search for global vars in this node
		var nodes = graph.getNodes();
		var txt = nodes[nodeId].getText();
		
		// Take out any "functions" from this text
		var openBracketCount = 0;
		var closeBracketCount = 0;
		var buffer = "";
		var blockStart = DEFAULT_NUM; // some really large number

		var lines = txt.split(/\r\n|\r|\n/);
		for (var n=0; n < lines.length; n++) {
			if (blockStart == DEFAULT_NUM &&
					lines[n].match(/\{/)) {
				// Start of block
				blockStart = n;
			}
			if (blockStart != DEFAULT_NUM) {
			  var result = new Array();
			  if (result = lines[n].match(/\{/g))
				  openBracketCount += result.length; 
			  
			 
			  if (result = lines[n].match(/\}/g)) 
				  closeBracketCount += result.length; 
			  
			  // Erase this line
			  lines[n] = "";

			  if (openBracketCount == closeBracketCount) 
				  blockStart = DEFAULT_NUM;
	
			}
		}
		
		// Loop through again looking for only global variables
		// since every other line should have removal code
		for (var n=0; n < lines.length; n++) {
		  var result = lines[n].match(/\s*var\s+(\w+)/);
		  if (result) {
			  this.add(result[1], nodeId);		    	
		  }
		}
	}
	
	this.removeVarsInNode = function(nodeId) {
		for (var i in variables) {			
			if (variables[i].nodeId == nodeId) {
				variables[i].remove();
				delete variables[i];
			}
		}
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
	// GlobalVariable CLASS
	///////////////////////////////	
	function GlobalVariable(name, id, nodeId) {
		this.nodeId = nodeId;
		var myColor = colorRotate();
		globalVarList.append("<div class='globalVar'/>");
		
		var globalVarDiv = globalVarList.children(".globalVar").last();		
		
		globalVarDiv.append("<div class='globalVarTxt varTxt'>" + name + "</div>");
		
		var globalVarTxt = globalVarDiv.children(".globalVarTxt").last();
		
		globalVarTxt.css({"display" : "inline",
			              "cursor" : "pointer"});
		
		globalVarDiv.append("<div class='subMenu'/>");
		var subMenu = globalVarDiv.children(".subMenu").last();

		subMenu.hide();
		
		globalVarTxt.click(function() {
			var showSubMenu = false;
			if (subMenu.css("display") == "none") {
				showSubMenu = true;
			}
			if ( showSubMenu == true ) {			
				///////////////////////////////////////////////////////////
				// We have to search for this global variable everywhere
				//////////////////////////////////////////////////////////
				subMenu.html(""); // Clear out anything that was in here			
				
				var nodes = graph.getNodes();
	
				for (var i in nodes) {
					// Get the text from this node
					var txt = nodes[i].getText();
					var nodeName = nodes[i].getNodeName();
					//Find instances of 'name' in the txt					
					if (txt.match(name)) {					
					    var found = false;
						// Now highlight source code
						var buffer = "";
						var lines = txt.split(/\r\n|\r|\n/);
						for (var n=0; n < lines.length; n++) {
							var outline = lines[n];
							var regex = new RegExp("\\W" + name + "\\W","");
							var regex2 = new RegExp("^" + name + "\\W","");
														
							if (lines[n].match(regex) || lines[n].match(regex2)) {
								found = true;
								outline = "<div class='globalHighLight globVar"+ id + 
								          "' style='color:"+ myColor +";'>" + outline + "</div>";
							}	
							buffer += outline + "\n";
						}
						
						if (found) {
							subMenu.append("<div class='globVarFound varFound' value='"+ i +"'>" +
								       " found in " + nodeName + "</div>");	
							var globVarFound = subMenu.children(".globVarFound").last();
							
							
							globVarFound.click(function() {
								var n = $(this).attr("value");
								nodes[n].moveToFront();			
							});
						
			    			// Put the buffer back into savedTxt
							nodes[i].setSavedText(buffer);	
							
							var scrollTo = $(".globVar" + id).last();
							var container = nodes[i].savedTxt;								
							container.scrollTop(
								    scrollTo.offset().top - container.offset().top + container.scrollTop()
							);
						}
					}
				
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
			$(".globVar" + id).each(function(index) {
				var h = $(this);
				if (h.html() != null) {
					var innerHtml = h.html();
					h.before(innerHtml);					
					h.remove();
				}										
			});					
		}

		this.remove = function() {
			globalVarDiv.remove();
		}

	}

}

