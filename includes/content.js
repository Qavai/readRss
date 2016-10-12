// @include http://*/*

(function(){

 var o = {
     name:                          'readRss_content_script',
     version:                       '1.0',
     copyright:                     '(c) Eugene Ivanov, 2013...2016 e-ivanov.ru/read_rss eugene.ivanov@gmail.com',
     preInit: function() {
        var that = this;

		if (!window) return false;

      	that.isOpera = typeof window.opera != 'undefined';
        that.isFF = typeof window.opera == 'undefined' && typeof window.chrome == 'undefined';

        that.port_sendMessage = function(data, port) {
            if (!that.isFF) {
                if (that.isOpera) {
	       			port.postMessage(data);
	       		} else {
        		    port = port || chrome.runtime.connect({name: "ei_core"});
       	    		port.postMessage(data, "*");
	       		}
	       	} else {
       		    port = port || self.port;
      	        port.emit("message", data);
	       	}
           	return port;
        }

        if (!that.isFF) {
            if (that.isOpera) {
    			this.connect = opera.extension;
                opera.extension.onmessage = function(event) {
                    that.msg_handler(event.data);
                };
                opera.extension.ondisconnect = function(event) {
                 	that.connect = opera.extension;
                };
            } else {
                this.connect = chrome.runtime.connect({name: "ei_core"});
                this.connect.onMessage.addListener(function(msg) {
                	that.msg_handler(msg);
                });
                this.connect.onDisconnect.addListener(function(msg) {
                	that.connect = chrome.extension.connect({name: "ei_core"});
                });
            }
        } else {
            self.port.on("message", function(message) {
                that.msg_handler(message);
            });
        }

        that.onLoad();
     },

     msg_handler: function(msg) {
        var that = this;
     },

     onLoad: function() {
        var that = this;

        var url = window.location.href;

        var feeds = [];
        if (!this.isFeedDocument()) {
        	feeds = this.findFeedLinks();
        }

	    that.connect = that.port_sendMessage({
	    	"doing": "function",
	    	"func" : "rss_feeds_please",
	    	"field" : 'feeds',
	    	"value" : {
	    		"list"	: feeds,
	    		"url"	: url
	    	}
	    }, that.connect);

     },

    // See if the document contains a <link> tag within the <head> and
    // whether that points to an RSS feed.
    findFeedLinks : function() {
      // Find all the RSS link elements.
      var result = document.evaluate(
          '//*[local-name()="link"][contains(@rel, "alternate")] ' +
          '[contains(@type, "rss") or contains(@type, "atom") or ' +
          'contains(@type, "rdf")]', document, null, 0, null);

      var feeds = [];
      var item;
      while (item = result.iterateNext()) {
        feeds.push({"href": item.href, "title": item.title});
      }

      return feeds;
    },

    // Check to see if the current document is a feed delivered as plain text,
    // which Chrome does for some mime types, or a feed wrapped in an html.
    isFeedDocument : function() {
      var body = document.body;

      var soleTagInBody = "";
      if (body && body.childElementCount == 1) {
        soleTagInBody = body.children[0].tagName;
      }

      // Some feeds show up as feed tags within the BODY tag, for example some
      // ComputerWorld feeds. We cannot check for this at document_start since
      // the body tag hasn't been defined at that time (contains only HTML element
      // with no children).
      if (soleTagInBody == "RSS" || soleTagInBody == "FEED" ||
          soleTagInBody == "RDF") {
        	//chrome.extension.sendRequest({msg: "feedDocument", href: location.href});
        return true;
      }

      // Chrome renders some content types like application/rss+xml and
      // application/atom+xml as text/plain, resulting in a body tag with one
      // PRE child containing the XML. So, we attempt to parse it as XML and look
      // for RSS tags within.
      if (soleTagInBody == "PRE") {
        var domParser = new DOMParser();
        var doc = domParser.parseFromString(body.textContent, "text/xml");

        if (currentLogLevel >= logLevels.error) {
          var error = doc.getElementsByTagName("parsererror");
          if (error.length) {

          }
        }

        // |doc| now contains the parsed document within the PRE tag.
        if (containsFeed(doc)) {
          // Let the extension know that we should show the subscribe page.
          	//chrome.extension.sendRequest({msg: "feedDocument", href: location.href});
          return true;
        }
      }

      return false;
    }

 };

 o.preInit();

})();
