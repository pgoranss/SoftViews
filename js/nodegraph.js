function NodeGraph(){
  var win = $(window);
  var canvas = $("#canvas");
  var overlay = $("#overlay");
  var sidebar = $("#sidebar_main");
  var currentNode;
  var currentConnection = {};
  var connections = {};
  var connectionId = 0;
  var newNode;
  var nodes = {};
  var nodeId = 0;
  var mouseX = 0, mouseY = 0;
  var preDragWidth = win.width();
  var preDragHeight = win.height();
  var loops = [];
  var pathEnd = {};
  var zindex = 1;
  var hitConnect;
  var key = {};
  var SHIFT = 16;

  var topHeight = 0;

  canvas.css({"position" : "absolute", "left" : sidebar.width()});

  
  var paper = new Raphael("canvas", "100", "100");    
  
  function resizePaper(){
	paper.setSize(win.width() - sidebar.width(), win.height() - topHeight);
	
	// resize views...	
	// Need to subtract 24 pixels since that's about how tall 
	// the horizontal scrollbar is
	var viewHeight = 
		((win.height() - topHeight) - $(".btn").height()) / 3 - 24;	
	$("#compositions_view").height(viewHeight);
	$("#global_view").height(viewHeight);
	$("#resources_view").height(viewHeight);
    
  }
  win.resize(resizePaper);
  resizePaper();
  
  
  canvas.append("<div id='hit' />");
  hitConnect = $("#hit");
  hitConnect.css({"position" : "absolute", "left" : 100, "top" : 0, "z-index" : 4000, "border" : "none", 
                  "width" : 10, "height": 10, "cursor":"pointer", "font-size": "1px"});
                      
  ////////////////////////////////////////////////////////
  // This section handles being able to resize the 
  // Classes, Global Variables, and Resources boxes
  // on the left side of the page 
  /////////////////////////////////////////////////////////
  var intervalID = 0;
  $('.view_header').not("#compositions_header").css("cursor", "s-resize");
  $('.view_header').not("#compositions_header").mouseup(function(e) {	  
	  clearInterval(intervalID);	  
  }).
  mousedown(function(e){    		  
      var view = $(this);            
      var prev_header;
      var post_header;
      var prev_index = 0;
      var post_index = 0;

      $(".view_header").each(function(index){	  
    	  if ($(this).attr("id") == view.attr("id")) {
    		  prev_index = index - 1;
    		  post_index = index + 1
    	  }
       });       
      $(".view_header").each(function(index){
     	 if (index == prev_index) {     		
     		prev_header = $(this);        		
     	 } 
     	 if (index == post_index) {
     		post_header = $(this);
     	 }
       }); 
  
      intervalID = setInterval(
    	function() {
    	  var top = view.position().top;
    	  var upper = view.prev();
    	  var lower = view.next();
    		      		   
    	  var offset = prev_header.position().top + 
                       prev_header.height() + 10; 
	      var newH = mouseY - offset;
    		  
	      upper.css({"height": newH });
	      
	      if (!post_header) post_header = view;
	      
	      top = post_header.position().top;
	      upper = post_header.prev();    
	      lower = post_header.next();
	      newH = sidebar.height() - post_header.position().top - 12; 
          lower.css({"height": newH });
    	}, 
      20);
  });  // end mousedown
  
  /////////////////////////////////////////////////////////
  /////////////////////////////////////////////////////////





  function connectNode(dir){
    var node, x, y;
    dir = dir.toLowerCase();            
      
    if (dir == "top"){    			
      x = pathEnd.x - currentNode.width() / 2;
      y = pathEnd.y + topHeight + 5;
    }else if (dir == "bottom"){    	
      x = pathEnd.x - currentNode.width() / 2;
      y = pathEnd.y + topHeight - 5 - currentNode.height();
    }
    
    // Check for out of bounds conditions and adjust
	if (x < 0) x = 0;	
	if (y < topHeight) y = topHeight;
	    
    node = new Node(x, y, currentNode.width(), currentNode.height());
    saveConnection(node, dir);
    currentNode = node;
  }
  
  function createConnection(a, conA, b, conB){
      var link = paper.path("M 0 0 L 1 1");
      link.attr({"stroke-width":2});
      link.parent = a[conA];
      
      a.addConnection(link);
      currentConnection = link;
      currentNode = a;
      saveConnection(b, conB);
  }
  
  function saveConnection(node, dir){
    if (!currentConnection) return;
    if (!currentConnection.parent) return;    
    
    currentConnection.startNode = currentNode;
    currentConnection.endNode = node;
    currentConnection.startConnection = currentConnection.parent;
    currentConnection.endConnection = node[dir.toLowerCase()];

    currentConnection.id = connectionId;
    connections[connectionId] = currentConnection;
    connectionId++;
    
    currentNode.updateConnections();
    node.addConnection(currentConnection);

    $(currentConnection.node).mouseenter(function(){
      this.raphael.attr("stroke","#FF0000");
    }).mouseleave(function(){
      this.raphael.attr("stroke","#000000");
    }).click(function(){
      if (confirm("Are you sure you want to delete this connection?")){
        this.raphael.remove();
        delete connections[this.raphael.id];
      }
    });
  }
  
  $(document).keydown(function(e){
    key[e.keyCode] = true;
  }).keyup(function(e){
    key[e.keyCode] = false;
  });
  
  $(document).mousemove(function(e){
    mouseX = e.pageX;
    mouseY = e.pageY - topHeight;
  }).mouseup(function(e){
	//// START NODE CREATION	  
	overlay.hide();
	var creatingNewNode = newNode;

    hitConnect.css({"left":mouseX - sidebar.width() - 5,     	            
    	            "top":mouseY + topHeight - 5});

    for (var i in nodes){
      if (nodes[i]){
        var n = nodes[i];
        if (n != currentNode){
          var nLoc = n.content.position();
          
          if (hitTest(toGlobal(nLoc, n.top), hitConnect)){
        	// Destination of line is top           	
        	var from = currentConnection.parent.attr("class");
            if (from == "top") {
            	alert("Error: Cannot connect nodes top to top");
            	currentConnection.remove();
            }
            else {
            	saveConnection(n, "top");
            }
            newNode = false;
            break;
          }else if (hitTest(toGlobal(nLoc, n.bottom), hitConnect)){
          	// Destination of line is bottom
          	var from = currentConnection.parent.attr("class");
            if (from == "bottom") {
            	alert("Error: Cannot connect nodes bottom to bottom");
            	currentConnection.remove();
            }
            else {
                saveConnection(n, "bottom");           	
            }
            
            newNode = false;
            break;
          }
        }
      }
    }
    
    
    hitConnect.css("left", "-100px");

    if (newNode){    	
        var dir;
        var currDir = currentConnection.parent.attr("class");
        if (currDir == "top"){
          dir = "bottom";
        }else if (currDir == "bottom"){
          dir = "top";
        }
        
        if (pathEnd.x == undefined || pathEnd.y == undefined){
          currentConnection.remove();
        }else{
          connectNode(dir);          
        }
      
    }
    newNode = false;

    for (var i in loops){
      clearInterval(loops[i]);
    }
    try{
      if (loops.length > 0) document.selection.empty();
    }catch(e){}
    loops = [];
    
    if (creatingNewNode) currentNode.txt[0].focus();

    //// End NODE CREATION
  });
    
  function toGlobal(np, c){
    var l = c.position();
    return {position : function(){ return {left: l.left + np.left, top : l.top + np.top}; },
            width : function(){ return c.width(); },
            height : function(){ return c.height(); }};
  }
  
  function showOverlay(){
    overlay.show();
    overlay.css({"width" : win.width(), "height" : win.height()}); //, "opacity": 0.1});
  }
  
  function startDrag(element, bounds, dragCallback){
	  
    showOverlay();
    var startX = mouseX - element.position().left;
    var startY = mouseY - element.position().top;
    if (!dragCallback) dragCallback = function(){};
      var id = setInterval(function(){
      var x = mouseX - startX;
      var y = mouseY - startY;
      if (bounds){
        if (x < bounds.left) x = bounds.left;
        if (x > bounds.right) x = bounds.right;
        if (y < bounds.top) y = bounds.top;
        if (y > bounds.bottom) y = bounds.bottom;
      }
      element.css("left", x).css("top",y);
      dragCallback();
    },topHeight);
    loops.push(id);
  }
  
  function hitTest(a, b){
    var aPos = a.position();
    var bPos = b.position();
    
    var aLeft = aPos.left;
    var aRight = aPos.left + a.width();
    var aTop = aPos.top;
    var aBottom = aPos.top + a.height();
    
    var bLeft = bPos.left;
    var bRight = bPos.left + b.width();
    var bTop = bPos.top;
    var bBottom = bPos.top + b.height();
    
    // http://tekpool.wordpress.com/2006/10/11/rectangle-intersection-determine-if-two-given-rectangles-intersect-each-other-or-not/
    return !( bLeft > aRight
      || bRight < aLeft
      || bTop > aBottom
      || bBottom < aTop
      );
  }
    
 function clear(){
    nodeId = 0;
    connectionsId = 0;
    for (var i in nodes){
      nodes[i].remove();
    }
    
    compositions.clear();
    globalVars.clear();
    resources.clear();
  }
  
  this.clearAll = function(){
    clear();
    defaultNode();
    currentConnection = null;
    currenNode = null;
  }
  
  this.addNode = function(x, y, w, h, noDelete){
    return new Node(x, y, w, h, noDelete);
  }
  
  var defaultWidth = 200;
  var defaultHeight = 100;
  
  this.addNodeAtMouse = function(){
    //alert("Zevan");
    var w = currentNode.width() || defaultWidth;
    var h = currentNode.height () || defaultHeight;
    var temp = new Node(mouseX - sidebar.width(), mouseY + topHeight, w, h);
    currentNode = temp;
    currentConnection = null;
  }
  
  function defaultNode(){
    var temp = new Node(canvas.width() / 2 - defaultWidth / 2, 
                        win.height() / 2 - defaultHeight / 2,
                        defaultWidth, defaultHeight, false);
    temp.txt[0].focus();
    currentNode = temp;
  }
  defaultNode();

  this.fromJSON = function(data){
    clear(); // This calls clear() on all the views as well    
    
    for (var i in data.nodes){
      var n = data.nodes[i];
      //var ex = (i == "0") ? true : false;
      var ex =  false;

      var temp = new Node(n.x, n.y, n.width, n.height, ex, n.id, n.name);

      var addspecialchars= remspecialchar(n.txt); // really this is add all characters
      temp.txt.val(addspecialchars);
      temp.setSavedText(addspecialchars);

      // We have to call these here because only at this
      // point have the nodes been filled with their text
	  compositions.add(temp.id);
	  globalVars.update(temp.id);
	  resources.update(temp.id);
      
    }
    for (i in data.connections){
      var c = data.connections[i];
      createConnection(nodes[c.nodeA], c.conA, nodes[c.nodeB], c.conB);
    }
    
  }
  
  this.checkSavedNodes = function() {
	  for (var i in nodes){
		  var n = nodes[i]; 
	      if (!n.savedTxt.is(":visible")) {
	    	  return false;
	      }	  
	  }
	  return true;
  }
  
  this.toJSON = function(){
    var json = '{"nodes" : [';
    for (var i in nodes){
    	var n = nodes[i]; 
    	globalVars.resetHighlighting(n.id);
        compositions.resetHighlighting(n.id);
        resources.resetHighlighting(n.id);
    }
    
    for (var i in nodes){
      var n = nodes[i];                    

      json += '{"id" : ' + n.id + ', ';
      json += '"x" : ' + n.x() + ', ';
      json += '"y" : ' + n.y() + ', ';
      json += '"width" : ' + n.width() + ', ';
      json += '"height" : ' + n.height() + ', ';
      json += '"name" : "' + n.getNodeName() + '", ';
      json += '"txt" : "' + addSlashes(n.getText()) + '"},';
    }
    json = json.substr(0, json.length - 1);
    json += '], "connections" : [';
    
    var hasConnections = false;
    for (i in connections){
      var c = connections[i];
      if (!c.removed){
      json += '{"nodeA" : ' + c.startNode.id + ', ';
      json += '"nodeB" : ' + c.endNode.id + ', ';
      json += '"conA" : "' + c.startConnection.attr("class") + '", ';
      json += '"conB" : "' + c.endConnection.attr("class") + '"},';
      hasConnections = true;
      }
    }
    if (hasConnections){
      json = json.substr(0, json.length - 1);
    }
    json += ']}';
    return json;
  }
  
  function closeAllExpandBoxes() {
	  for (var i in nodes) {
		  var n = nodes[i];		  
		  n.expandBox.css("left", n.width());
		  n.expandBox.children().html(">");
		  
		  var items = n.inheritBox.children(".inherited_item");
  	      items.each(function(index) {								   					 
			     var inherited_item = $(this).html();
			     var parent = n.getParent();
			     while (parent != null) {				    	 
			    	 parent.removeHighLight(inherited_item, i);
			    	 parent = parent.getParent()				    	 
			     }				     				   
		    });
		  
		  n.inheritBox.hide();
	  }
	  
  }
  
  this.getNodes = function() {
	  return nodes;
  }
  

////////////////////////////
// NODE CLASS
///////////////////////////////
  
  function Node(xp, yp, w, h, noDelete, forceId, forceName){
	///////////////////////////////////////////
	// We have new node
	// Do pre-init stuff here
	///////////////////////////////////////////
	   
    if (forceId){
       nodeId = forceId;
    }
    this.id = nodeId;
    var id = nodeId;
    
    nodes[nodeId] = this;
    nodeId++;
    
    var nodeName = "Untitled.js";
    if (forceName) {
    	nodeName = forceName;
    }
    var curr = this;
    this.connections = {};
    var connectionIndex = 0;
    var myParent = null;
    var text = "";
    var highlighted = false;
	///////////////////////////////////////////
	///////////////////////////////////////////


    this.addConnection = function(c){
      curr.connections[connectionIndex++] = c;
      return c;
    }
	    
    canvas.append("<div class='node' />");
    var n = $(".node").last();
    n.css({"position" : "absolute",      
           "left" : xp, "top" : yp,
           "width" : w, "height" : h,   
           "border" : "1px solid gray",
           "background-color" : "white"});
    n.css("z-index", zindex++);     
    n.mouseenter(function(){	    	
        n.css("z-index", zindex++);
      });    
    
    this.content = n;        
    
    this.width = function(){
      return n.width();
    }
    this.height = function(){
      return n.height();
    }
    this.x = function(){
      return n.position().left;
    }
    this.y = function(){
      return n.position().top;
    }	    
         
    var nodeWidth = n.width();
    var nodeHeight = n.height();
    
    //////////////////////////////////////////
    // Node Bar
    //////////////////////////////////////////
    n.append("<div class='bar'/ align=center>");
    var bar = $(".node .bar").last();
    bar.css({"background-color" : "#46577D",             
             "padding" : "0", 
             "margin": "0",
             "font-size" : "9px", 
             "cursor" : "move"});
    
    bar.mousedown(function(e){    	
        if (renameClicked) {
      	  renameClicked = false;
      	  return;
        }
       
        currentNode = curr;
        n.css("z-index", zindex++);
        e.preventDefault();
        
        startDrag(n, {left : 0, "top": topHeight, right : win.width() - sidebar.width() - n.width() - 10, bottom : win.height() - n.height() - 10},
        updateConnections);
      }); // end mousedown
	            
    //////////////////////////////////////////
    // Node Close (X)
    //////////////////////////////////////////
    if (!noDelete){
      n.append("<div class='ex'>X<\/div>");
      var ex = $(".node .ex").last();
      ex.css({"position":"absolute","padding-right" : 2, "padding-top" : 1, "padding-left" : 2,
              "color" : "white", "font-family" : "sans-serif",
              "top" : 0, "left": 0, "cursor": "pointer",
              "font-size" : "10px", "background-color" : "#46577D", "z-index" : 100});
      ex.hover(function(){
        ex.css("color","gray");
      }, function(){
        ex.css("color","white");
      }).click(function(){      
        if (confirm("Are you sure you want to delete this node?")){
          curr.remove();
          compositions.remove(id);
          globalVars.removeVarsInNode(id);
          resources.removeVarsInNode(id);
        }
      });
    }
	 
    //////////////////////////////////////////
    // Node Title
    //////////////////////////////////////////
    bar.append("<div class='nodeTitle'>" + nodeName + "<\/div>");
    var nodeTitle = $(".node .nodeTitle").last();
    nodeTitle.css({
    	"display" : "inline",
    	"width" : "80%",
    	"color" : "white",    	
  	    "text-align" : "center",
  	    "font-weight" : "bold",
        "font-size" : "13px"});
    
    //////////////////////////////////////////
    // Rename Button
    //////////////////////////////////////////        
    bar.append("<div class='rename'>rename<\/div>");
    var rename = $(".node .rename").last();  
    rename.css({"float" : "right",
    	       "display" : "inline",
    	       "font-size" : "11px",
    	       "color" : "white",
    	       "cursor" : "pointer",
    	       "text-decoration" : "underline"});
    
    var renameClicked = false;
    rename.mousedown(function(){
    	renameClicked = true; // So we don't drag after rename addicentally
    	var name = prompt("Please enter filename\nEx. Thing.js");
    	if (name == null) {
    		return;
    	}
    	if (name == "") {
    		alert("ERROR: name cannot be blank");
    		return;
    	}    	
    	renameNode(name);  	    	

    });
    this.rename = rename;    
    
    //////////////////////////////////////////
    // Text area (edit area)
    //////////////////////////////////////////  	    
    n.append("<textarea class='txt' spellcheck='false'></textarea>");
    var txt = $(".node .txt").last();
    txt.css("position","absolute");
   
    txt.css({"width" : nodeWidth - 5,
             "height" : nodeHeight - bar.height() - 5,
             "resize" : "none", 
             "background-color" : "#FDFFD1",
             "font-size" : "12px" , 
             "font-family" : "Lucida Console, Monospace",
             "border" : "none","z-index":4});          
    this.txt = txt;         	      

    //////////////////////////////////////////
    // Saved Text area
    //////////////////////////////////////////     
    n.append("<div class='savedTxt'></div>");
    var savedTxt = $(".node .savedTxt").last();
    savedTxt.css("position","absolute");	   
    savedTxt.css({"width" : nodeWidth,
             "height" : nodeHeight - bar.height(),
             "resize" : "none", 	            
             "font-size" : "12px", 
             "background-color" : "white",
             "font-family" : "Lucida Console, Monospace",
             "overflow" : "scroll",
             "border" : "none","z-index":4});          
    this.savedTxt = savedTxt;         
	      
    //////////////////////////////////////////
    // Edit/Save Button
    //////////////////////////////////////////  	    
    n.append("<div class='editSave'>EDIT</div>");
    var editSave = $(".node .editSave").last();
    editSave.css({"position" : "absolute" , "z-index" : 10,
        "width" : "33px", "height" : "12px",
        "left" : nodeWidth - 33, "top" : nodeHeight,           
        "font-size" : "10px",
        "background-color" : "#FDFFB8",
  	    "text-align" : "center",
  	    "font-weight" : "bold",            
        "border" : "1px solid gray",            
        "cursor" : "pointer"});	   
    // Set the hover (title) field
    editSave.attr("title", "Click to EDIT source code");
	    
    editSave.click(function() {	    	
    	savedTxt.toggle();
    	// Copy whatever is in txt to saveTxt
    	var tmp = txt.val() + "";
    	tmp = tmp.replace(/\</g, "&lt;")
    	tmp = tmp.replace(/>/g, "&gt;")
    	savedTxt.html("<pre>" + tmp + "</pre>");	    	
    	
    	if (savedTxt.is(":visible")) {
    		compositions.update(id);
    		globalVars.update(id);
    		resources.update(id);
    		closeAllExpandBoxes();
    		
    		editSave.css({"background-color" : "#FDFFB8"});	  // yellow
    		editSave.html("EDIT");
    		editSave.attr("title", "Click to EDIT source code");
    	}
    	else {
    		editSave.css({"background-color" : "#99FF7D"}); // green
    		editSave.html("SAVE");
    		editSave.attr("title", "Click to SAVE source code");
    	}

    });
	    
    editSave.mouseover(function() {
    	editSave.css("background-color", "#EBEFF2");	    	
    }).mouseleave(function() {
    	if (savedTxt.is(":visible")) {
    		editSave.css("background-color", "#FDFFB8");
    	}
    	else {
    		editSave.css({"background-color" : "#99FF7D"}); // green
    	}
    });
	    
    //////////////////////////////////////////
    // Expand Box (arrow) for Inheritance view
    //////////////////////////////////////////      
    n.append("<div class='expandBox'/>");
    var expandBox = $(".node .expandBox").last();
    expandBox.css({"position" : "absolute" , "z-index" : 10,
        "width" : "12px", "height" : nodeHeight - bar.height() ,
        "left" : nodeWidth, "top" : bar.height() - 1,           
        "font-size" : "10px",                  
        "background-color" : "#D0D6D6",             	    
        "text-align" : "center",            
  	    "font-weight" : "bold",  
        "border" : "1px solid gray",            
        "cursor" : "pointer"});	   
    expandBox.append("<div style='position: relative; top: 50%;font-size:18px;'>></div>");
    // Set the hover (title) field
    expandBox.attr("title", "Click to view Inherited Items");
    expandBox.mouseover(function() {
    	expandBox.css("background-color", "#EBEFF2");
    }).mouseleave(function() {
    	expandBox.css("background-color", "#D0D6D6");
    });
    this.expandBox = expandBox;

    expandBox.click(function() {
    	var items;
    	if (inheritBox.is(':hidden')) {	    		
    	   inheritBox.html(getInheritedDataFormatted());

    	   items = inheritBox.children(".inherited_item");
    	   var parent = myParent;
		     while (parent != null) {
			   items.each(function(index) {								   					 
				     var inherited_item = $(this).html();					     						    	 
				     parent.searchAndHighLight(inherited_item, id);					    	 					    	 				    	 					    			     				  
			   });	
			   parent.setHighlighted(true);
			   parent = parent.getParent()
		     }	
    	   
	    	$(this).css("left", n.width() + inheritBox.width());
	    	$(this).children().html("<");
	    	inheritBox.show();
    	}
    	else {
    		items = inheritBox.children(".inherited_item");
    	    items.each(function(index) {								   					 
			     var inherited_item = $(this).html();
			     var parent = myParent;
			     while (parent != null) {				    	 
			    	 parent.removeHighLight(inherited_item, id);
			    	 parent = parent.getParent()				    	 
			     }				     				   
		    });
    		
	    	$(this).css("left", n.width());
	    	$(this).children().html(">");
	    	inheritBox.hide();	    		
    	}
    });

    //////////////////////////////////////////
    // Inheritance Box
    //////////////////////////////////////////      
    n.append("<div class='inheritBox'/>");
    var inheritBox = $(".node .inheritBox").last();
    inheritBox.css({"position" : "absolute" , "z-index" : 10,
        "width" : (nodeWidth / 2), "height" : nodeHeight - bar.height() ,
        "left" : nodeWidth, "top" : bar.height() - 1,           
        "font-size" : "10px",                  
        "background-color" : "#EBEFF2",            	  	    
        "text-align" : "center",            
  	    "font-weight" : "bold",  
        "border" : "1px solid gray", 
        "overflow-y" : "scroll"});	    
    inheritBox.hide();	
    this.inheritBox = inheritBox;
	    	
    //////////////////////////////////////////
    // Resizer
    //////////////////////////////////////////      
    n.append("<div class='resizer' />");
    var resizer = $(".node .resizer").last();
    
    resizer.css({"position" : "absolute" , "z-index" : 10,
                 "width" : "10px", "height" : "10px",
                 "left" : nodeWidth - 11, "top" : nodeHeight - 11,
                 "background-color" : "white", "font-size" : "1px",
                 "border" : "1px solid gray",
                 "cursor" : "pointer"});
    
    resizer.mousedown(function(e){
        currentNode = curr;
        e.preventDefault();
        startDrag(resizer, {left : 20, top : 20, right : 500, bottom : 500},
  	      function(){
  	        var loc = resizer.position();
  	        var x = loc.left;
  	        var y = loc.top;
  	        n.css({"width" : x + resizer.width() + 1,
  	               "height" : y + resizer.height() + 1});
  	        
  	        txt.css({"width" : n.width() - 5, "height" : n.height() - bar.height() - 5});
  	        savedTxt.css({"width" : n.width(), "height" : n.height() - bar.height()});
  	        
  	        //positionLeft();
  	        //positionRight();
  	        positionTop();
  	        positionBottom();
  	        positionEditSave();
  	        positionExpandBox();
  	        positionInheritBox();
  	        
  	        updateConnections();
        	}
        ); // end StartDrag function
      }); // end mousedown    
	  
    //////////////////////////////////////////
    // Top and Bottom Node Connectors
    //////////////////////////////////////////     
    
    //n.append("<div class='left'>");
    n.append("<div class='top'>");
    //n.append("<div class='right'>");
    n.append("<div class='bottom'>");	    	    
    
    //var left = $(".node .left").last();
    //left.css("left","-11px");
    
    
    var top = $(".node .top").last();
    top.css("top","-11px");
    
    
    //var right = $(".node .right").last();
    
    var bottom = $(".node .bottom").last();

	    
    //setupConnection(left);
    //setupConnection(right);
    setupConnection(top);
    setupConnection(bottom);
    
    //positionLeft();
    //positionRight();
    positionTop();
    positionBottom();
	    
    //this.left = left;
    //this.right = right;
    this.top = top;
    this.bottom = bottom;
	    
	    
    // We don't care about left and ride nodes now
    //left.hide();
    //right.hide();     
	    	 
    this.updateConnections = updateConnections;	
	        
    //left.mousedown(addLink);
    //right.mousedown(addLink);
    top.mousedown(addLink);
    bottom.mousedown(addLink);	     	  	    
	    
    //////////////////////////////////////////
    // Functions section (Private)
    ////////////////////////////////////////// 
	    
    function showNMenu (selectedText) {	  
  	  viewMenu.css({"left":mouseX - 10, "top":mouseY + topHeight});
  	  viewMenu.show();	  
    }
	    
    function renameNode(newName) {
      nodeName = newName;  
      nodeTitle.html(newName); 
    }
	    
   // function positionLeft(){
   //   left.css("top", n.height() / 2 - 5);
   // }
   // function positionRight(){
   //   right.css("left",n.width() + 1).css("top", n.height() / 2 - 5);
   // }
    
    function positionTop(){
      top.css("left", n.width() / 2 - 5);
    }
    function positionBottom(){
      bottom.css("top",n.height() + 1).css("left", n.width() / 2 - 5);
    }
    	    
    function positionEditSave(){
    	  //"left" : 0, "top" : nodeHeight - 11,
    	editSave.css("top",n.height());
    	editSave.css("left",n.width() - 33);
    }
	    
    function positionExpandBox(){	    	
	    expandBox.css("height", n.height() - bar.height());
	    expandBox.css("top",bar.height() - 1);
	    	
	    if (inheritBox.is(':hidden')) {
	    	expandBox.css("left",n.width());	
    	}
    	else {
    		expandBox.css("left", n.width() + inheritBox.width());	    		
    	}
    }
    
    function positionInheritBox(){	    	
    	inheritBox.css("width", n.width() / 2);
        inheritBox.css("height", n.height() - bar.height());
        inheritBox.css("top",bar.height() - 1);
        inheritBox.css("left",n.width());		    	
    }	    
 
	            
    function setupConnection(div){
      div.css({"position" : "absolute", "width" : "10px", "padding":0,
               "height" : "10px", "background-color" : "black",
               "font-size" : "1px", "cursor" : "pointer"});
    }
    
    function updateConnections(){
	       for (var i in curr.connections){
	         var c = curr.connections[i];
	         if (!c.removed){
	           var nodeA = c.startNode.connectionPos(c.startConnection);
	           var nodeB = c.endNode.connectionPos(c.endConnection);
	           var startX = nodeA.x;
	           var endX = nodeB.x;
	           c.attr("path","M " + startX  + " " + nodeA.y + " L " + endX + " " + nodeB.y);
	            
	         }
	       }
	}
    
   function addLink(e){
		  preDragWidth = win.width();
		  preDragHeight = win.height();
		   
	      currentNode = curr;
	      e.preventDefault();
	      showOverlay();
	      var link = paper.path("M 0 0 L 1 1");
	      link.attr({"stroke-width":2});
	      currentConnection = link;
	      currentConnection.parent = $(this);
	      
	      curr.addConnection(link);
	      var loc = $(this).position();
	      var nLoc = n.position();
	     
	      var x = loc.left + nLoc.left + 5;
	      var y = loc.top + nLoc.top - topHeight + 5;
	      newNode = true;
           
	      var id = setInterval(function(){
	    	var endX = mouseX - sidebar.width();	    
	        link.attr("path","M " + x + " " + y + " L " + endX + " " + mouseY);
	        
	        pathEnd.x = endX;
	        pathEnd.y = mouseY;
	      }, 30);
	      loops.push(id);
	}	    
	    	    
	    
    function getInheritedDataFormatted () {
    	var buffer = "";
    	var results = getInheritedData();
    	
    	if (results == null) {
    		
    		return "No parent Class";	    		
    	}
    	
		// Put the results in the output buffer			
		var inherits = false;

		for (var key in results) {
			if (results[key] == 2) {
				buffer += "<div class='inherited_item'>" + key + "</div>"
				inherits = true; // mark this as true now
			}
		}
		

		if (buffer != "") {
			buffer = "<div class='inherited_header'>Inherited Methods:</div>" + buffer;
		}
				
		var buffer2 = "";
		
		for (var key in results) {
			if (results[key] == 1) {
				buffer2 += "<div class='inherited_item'>" + key + "</div>";
				inherits = true; // mark this as true now
			}			
		}
		if (buffer2 != "") {							
			buffer += "<br><div class='inherited_header'>Inherited Members:</div>" + buffer2; 
		}

		if (!inherits) buffer = "<div class='inherited_header'>Nothing inherited from parent</div>";
					
    	return buffer;	    	
    	
    }
	    
    function getInheritedData () {
       var parent = "";
 	   for (var i in curr.connections){
 		         var c = curr.connections[i];
 		       if (!c.removed){
 
 		       if (c.startConnection.attr("class") == "bottom") {
	        	   // This is the parent, check if it's this node's parent
	              if (c.startNode.id != id) {
	        		 parent = nodes[c.startNode.id];
	        	  }
	           }
	           else if (c.endConnection.attr("class") == "bottom") { 
	        	  if (c.endNode.id != id) {
	        		  parent = nodes[c.endNode.id]; 
	        	  } 		        		 		        	   
	           } 	 		           
	        }
	   }
       
      
       if (parent != "") { 	  
    	  myParent = parent;
    	  return parent.getPublicData();
       } 
       else {
    	  return null;
       } 	      
    	
    }
	    
    //////////////////////////////////////////
    // Functions section (Public)
    ////////////////////////////////////////// 
    this.remove = function(){
	     for (var i in curr.connections){
	       var c = curr.connections[i];
	       c.remove();
	       delete connections[c.id];
	       delete curr.connections[i];
	     }
	     n.remove();
	     delete nodes[id];
    }	  
    
    this.connectionPos = function(conn){
        var loc = conn.position();
        var nLoc = n.position();
        var point = {};
        point.x = nLoc.left + loc.left + 5;
        point.y = nLoc.top - topHeight + loc.top + 5;
        return point;
    }
    
    
    this.getPublicData = function() {
    	
    	var tmp = savedTxt.html();
    	// remove pre tags
    	tmp = tmp.replace(/^<pre>/, "");
    	tmp = tmp.replace(/<\/pre>$/, "");
    	
    	// Now highlight source code
		var lines = tmp.split(/\r\n|\r|\n/);

		var members = new Array();
		
		for (var n=0; n < lines.length; n++) {							
		  var result = lines[n].match(/this\.(\w+)/);
		  if (result) {				  
			  members[result[1]] = 1;
		  }			 
		}
		
		for (var n=0; n < lines.length; n++) {							
		  var result = lines[n].match(/this\.(\w+)\s*=\s*function/);
		  if (result) {				  
			  members[result[1]] = 2;
		  }			 
		}			
		
		// Make sure none of these are coming from the parent's parent or grandparent etc
		// Use recursion here
		var inheritedData;
		do {
			var results = getInheritedData();
			for (var key in results) {
				members[key] = results[key];
			}				
		} while (inheritedData != null);
		
		return members;
		
    }	     
	    
    this.moveToFront = function() {
      n.css("z-index", zindex++);
    }
    
    this.setNodeName = function(n) {
    	nodeName = n;
    }
    
    this.getNodeName = function() {
    	return nodeName;
    }
    
    this.getText = function() {	    	
    	var tmp = savedTxt.html();
    	// remove pre tags
    	tmp = tmp.replace(/^<pre>/, "");
    	tmp = tmp.replace(/<\/pre>$/, "");
    	return tmp;
    }
    
    this.setSavedText = function(txt) {
    	savedTxt.html("<pre>" + txt + "</pre>");
    }
    
    this.getParent = function() {
    	return myParent;
    }
    
    this.setHighlighted = function(val) {
    	highlighted = val;
    }
	    
    this.searchAndHighLight = function(str, sourceNodeId) {	 
    	if (highlighted) {
    		return; // already done by another node
    	}
    	var buffer = "";
    	var txt = this.getText();
		var lines = txt.split(/\r\n|\r|\n/);
		
		for (var n=0; n < lines.length; n++) {
			var outline = lines[n];
			if (lines[n].match("this." + str)) {					
				outline = "<div class='inheritHighLight inheritVar"+ sourceNodeId + 
				          "'>" + outline + "</div>";
			}	
			buffer += outline + "\n"
		}			
		this.setSavedText(buffer);
    }
	    
    this.removeHighLight = function(str, sourceNodeId) {
    	this.setHighlighted(false);
    	$(".inheritVar" + sourceNodeId).each(function(index) {
			var h = $(this);							    
			var innerHtml = h.html();					
			h.before(innerHtml);				
			h.remove();																						
		});	
    }
	    
    this.hideMe = function() {
    	// hide connections then hide node
    	for (var i in this.connections) {
    		this.connections[i].hide();
    	}
    	n.hide();
    }
    this.showMe = function() {
    	// hide connections then hide node
    	for (var i in this.connections) {
    		this.connections[i].show();
    	}
    	n.show();
    }
    
    // Do all this stuff last;
    compositions.add(id);
    globalVars.update(id);
    resources.update(id);
	    

  } // end Node()   
    
} // end NodeGraph