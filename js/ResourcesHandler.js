function ResourcesHandler() {
	
	var variables = new Array();
	var id = 0;	
	
	// Constructor stuff
	var mainContent = $("#resources_view .main_content");
	mainContent.append("<div class='resourcesList'/>");

	var resourcesList = mainContent.children(".resourcesList").last();	
	
	this.add = function(url, nodeId) {
		if (variables[url]) {
			return; // we already have this one
		}
		variables[url] = new Resource(url, id++, nodeId);		

	}
	
	
	this.update = function(nodeId) {
		if (!graph) return; // This is the first run so ignore
		
		// first clear everything out
		this.removeVarsInNode(nodeId);
		
		// Search for resource vars in this node
		var nodes = graph.getNodes();
		var txt = nodes[nodeId].getText();
		
		var lines = txt.split(/\r\n|\r|\n/);
		for (var n=0; n < lines.length; n++) {
		
			var result = lines[n].match(/([\/\w]+\.(png|gif|jpg|jpeg))['"]/i);
		
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
	
	this.clear = function() {
		for (var i in variables) {
			variables[i].remove();
			delete variables[i];			
		}
	}
	
	this.resetHighlighting = function(nodeId) {
		for (var i in variables) {			
			if (variables[i].nodeId == nodeId) {
				variables[i].resetMePub();				
			}
		}		
	}		
	
    //////////////////////////////
	// Resource CLASS
	///////////////////////////////	
	function Resource(url, id, nodeId) {
		this.nodeId = nodeId;
		var myColor = colorRotate();

		resourcesList.append("<div class='resourceVar'/>");
		var resourceVarDiv = resourcesList.children(".resourceVar").last();
		
		resourceVarDiv.append("<div class='resourceVarTxt varTxt'>" + url + "</div>");		
		
		var resourceVarTxt = resourceVarDiv.children(".resourceVarTxt").last();
		resourceVarTxt.css({"display" : "inline",
			              "cursor" : "pointer"});
		
		resourceVarDiv.append("<div class='subMenu'/>");
		var subMenu = resourceVarDiv.children(".subMenu").last();

		subMenu.hide();
		
		resourceVarTxt.click(function() {
			var showSubMenu = false;
			if (subMenu.css("display") == "none") {
				showSubMenu = true;
			}
			if ( showSubMenu == true ) {			
				///////////////////////////////////////////////////////////
				// We only need to search for this resource in the
				// node it came from since we just want to highlight 
				// its url location
				//////////////////////////////////////////////////////////
				subMenu.html(""); // Clear out anything that was in here			

				var nodes = graph.getNodes();
												
				// Get the text from this node
				var txt = nodes[nodeId].getText();
		        var nodeName = nodes[nodeId].getNodeName();
						
				subMenu.append("<div class='resourceFound varFound' value='"+ nodeId +"'>" +
								    "found in " + nodeName + "</div>");	
				var resourceFound = subMenu.children(".resourceFound").last();						
				resourceFound.click(function() {
					nodes[nodeId].moveToFront();
				});
										
				// Now highlight source code
				var buffer = "";
				var lines = txt.split(/\r\n|\r|\n/);
				for (var n=0; n < lines.length; n++) {
					var outline = lines[n];
					
					if (lines[n].match(url)) {
						outline = "<div class='resourceHighLight resourceVar"+ id + 
						          "' style='color:"+ myColor +";'>" + outline + "</div>";
					}	
					buffer += outline + "\n";
				}
    			// Put the buffer back into savedTxt
				nodes[nodeId].setSavedText(buffer);	
				
				var scrollTo = $(".resourceVar" + id).last();
				var container = nodes[nodeId].savedTxt;								
				container.scrollTop(
					    scrollTo.offset().top - container.offset().top + container.scrollTop()
				);
				
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
			$(".resourceVar" + id).each(function(index) {
				var h = $(this);
				if (h.html() != null) {
					var innerHtml = h.html();
					h.before(innerHtml);
					h.remove();
				}				
			});

		}

		
		this.remove = function() {
			resourceVarDiv.remove();
		}
		
		

	}

}
