$(function() {
    var reader = new Reader($('body'));
});

var Reader = function(rootEl) {
    var that = this;

	this.rootEl = rootEl;

    if (window.location.search.indexOf('fullscreen') != -1 || window.location.hostname == 'rss.loc') {
        $('body').css({"width" : "auto", "height" : "auto"});
    } else {
        /*
        $('#content').css({"min-height": 499});
        setTimeout(function() {
	        $('#content').css({"min-height": 500});
        }, 100);
        */
    }

    var s = [];

    s.push('<div id="content">');

    s.push('<div id="options-root">');
    s.push('<a id="pause-button" title="On/off net active" href="/pause/"></a>');
    s.push('<a id="options_link" href="../options/options.html?popup=1" title="Options"></a>');
    s.push('<a href="/feeds/list/" id="subscriptions-button" title="My subscriptions">Subscriptions</a>');
    s.push('<a href="/feeds/add/" id="feed-add-button" title="Subscribe to rss-feed"></a>');
    s.push('</div>');

    s.push('<div id="root"></div>');
    s.push('</div>');

    s.push('<div id="pop-menu-feed-add" class="popup-menu dn">');
    s.push('<p>http: rss-url or url of html-page for search rss:</p>');
    s.push('<form>');
    s.push('<input type="text" name="search" placeholder="http://" value="" />');
    s.push('<button class="button_wait" name="submit">');
    s.push('<div>Next...</div>');
    s.push('<img class="dn" width="20" height="20" src="../images/hourglass.gif" />');
    s.push('</button>');
    s.push('<input type="submit" name="cancel" value="Cancel" />');

    s.push('<p class="import">Import OPML-file: </p><input type="file" name="import" value="" />');

    s.push('<p class="date-limit">Save only items with a date earlier: <select name="time_store_limit">');
    s.push('<option value="7">1 week</option>');
    s.push('<option value="14">0.5 month</option>');
    s.push('<option value="30">1 month</option>');
    s.push('<option value="90">3 months</option>');
    s.push('<option value="180" selected>6 months</option>');
    s.push('<option value="365">1 year</option>');
    s.push('<option value="730">2 years</option>');
    s.push('<option value="1095">3 years</option>');
    s.push('<option value="3650">10 years</option>');
    s.push('<option value="0">All time</option>');
    s.push('</select></p>');

    s.push('</form>');
    s.push('</div>');


    s.push('<ul id="pop-menu-folder-actions" class="popup-menu dn">');
    s.push('<li class="pop-menu-folder-edit dn">');
    s.push('<a href="/pop-menu-folder-edit/">Edit</a>');
    s.push('</li>');
    s.push('<li class="pop-menu-folder-unsubs dn">');
    s.push('<a href="/pop-menu-folder-unsubs/">Unsubscribe</a>');
    s.push('</li>');
    s.push('<li class="pop-menu-folder-show-updated">');
    s.push('<a href="/pop-menu-folder-show-updated/"><span>&#10003;</span> Show updated only</a>');
    s.push('</li>');
    s.push('<li class="pop-menu-folder-del dn">');
    s.push('<a href="/pop-menu-folder-del/">Del</a>');
    s.push('</li>');
    s.push('</ul>');

    this.rootEl.html(s.join(''));
    this.printEl = this.rootEl.find('#root');

    this.isFF = typeof window.chrome == 'undefined';

    that.port_sendMessage = function(data, port) {
        if (!that.isFF) {
    		port = port || chrome.runtime.connect({name: "ei_core"});
        	port.postMessage(data, "*");

	   	} else {
    	    port = port || self.port;
            port.emit("message", data);
	   	}
       	return port;
    }

    if (!this.isFF) {
        chrome.runtime.onConnect.addListener(function(port) {
            if (port.name == 'ei_core') {
                port.onMessage.addListener(function(msg) {
                    that.msg_handler(msg);
                });
            }
        });

        this.connect = chrome.runtime.connect({name: "ei_core"});
        this.connect.onMessage.addListener(function(msg) {
        	that.msg_handler(msg);
        });


    } else {
        addon.port.on("message", function(message) {
            that.msg_handler(message);
        });
    }

	that.connect = that.port_sendMessage({doing: "popup_ignition"}, that.connect);
}

Reader.prototype = {

	type : "rss",
	under_type : "reader",

    class_forum_subscribe : 'forum-is-subscribe',
    class_forum_filters_save : 'forum-is-filters-save',

    array : [],

	messages_callbacks : [],
    options  : {},
	folders : [],

	destroy : function() {
        var that = this;
        this.printEl.html('');
	},

	init : function(coreInfo) {
        var that = this;

        this.messages_callbacks.push({
            "type"		: "",
            "under_type": "",
            "func"		: "storage_get_element_value",
        	"field" 	: "popup_options",
        	"callback" 	: function(popup_options) {
        		that.ignition(popup_options);
        	}
        });

        that.port_sendMessage({"doing": "function", "func" : "storage_get_element_value", "field" : "popup_options", "value" : "", "type" : "", "under_type" : ""}, that.connect);
	},

    ignition : function(popup_options) {
    	var that = this;

        var activeTab = popup_options['activeTab'];
        that.popup_options = popup_options;

        $('body').unbind('click').bind('click', function(event) {
            var el = event.target;
            var $el = $(el);
            var pu_menu_opened = $('.popup-menu');

            if (!$el.hasClass('menu-actions') && !$el.parents('#pop-menu-feed-add').length) {
                pu_menu_opened.addClass('dn');
                $('#feed-add-button').removeClass('active');
            }
        });

        $(window).unbind('resize').bind('resize', function() {
            that.window_resize(false);
        });

        $(window)
            .unbind('keydown').bind('keydown', function(event) {

            	if ((event.target.nodeName+'').toLowerCase() == 'input') return true;

                var key = event.keyCode;
                var ctrlKey = event.ctrlKey;

                //mprint(key);

                switch (key) {
                    // <-
                        /*
                    case (37): {
                        if (!ctrlKey) {
                            that.topicOne_next();
                        } else {
                            that.topicOne_prev();
                        }

                        return false;
                    }
                        */
                    // j
                    case (74): {
                        that.topicOne_next();
                        return false;
                    }
                    // k
                    case (75): {
                        that.topicOne_prev();
                        return false;
                    }
                    // m
                    case (77): {
                        that.topicOne_keepread();
                        return false;
                    }
                    // v
                    case (86): {
                        that.topicOne_open();
                        return false;
                    }
                    // ->
                    /*
                    case (39): {
                        return false;
                    }
                    */
                    // del
                    /*
                    case (46): {
                        topicOne_hide();
                        return false;
                    }
                    */
                    // ins
                    case (45): {
                        that.topicOne_star();
                        return false;
                    }
                }

            }
        );

        $(window)
            .unbind('keyup').bind('keyup', function(event) {

                var key = event.keyCode;
                var ctrlKey = event.ctrlKey;

            	if ((event.target.nodeName+'').toLowerCase() == 'input' && key != 27) return true;

                //mprint(key);

                switch (key) {
                    // a
                    case (65): {
				        $('#feed-add-button').trigger('click');
                        return false;
                    }
                    // Esc
                    case (27): {
		            	var pu_menu_el = $('#pop-menu-feed-add');
        			    if (!pu_menu_el.hasClass('dn')) {
					        $('#feed-add-button').trigger('click');
					    }
                        return false;
                    }
                }

            });

        //------------------
        var pause_set_class = function() {
        	var el = $('#pause-button');

        	var field = "isPause";
        	that.messages_callbacks.push({
        	    "type"		: "",
        	    "under_type": "",
        	    "func"		: "storage_get_element_value",
        		"field" 	: field,
        		"callback" 	: function(isPause) {
            	    var classToggle = 'pause-button-is-pause';

            	    if (!isPause) {
            	    	el.removeClass(classToggle);
            	    } else {
            	    	el.addClass(classToggle);
            	    }
        		}
        	});
    		that.port_sendMessage({"doing": "function", "func" : "storage_get_element_value", "field" : field, "value" : 0, "type" : "", "under_type" : ""}, that.connect);
        }

        $('#pause-button').unbind('click').bind('click', function() {
    	    var isPause = $(this).hasClass('pause-button-is-pause') ? 0 : 1;

			that.port_sendMessage({"doing": "function", "func" : "storage_set_element_value", "field" : "isPause", "value" : isPause}, that.connect);

    	    pause_set_class();

            return false;
        });
    	pause_set_class();

        $('#feed-add-button').unbind('click').bind('click', function() {
            var el = $(this);

            var root = el;

            var pu_menu_el = $('#pop-menu-feed-add');

            pu_menu_el.toggleClass('dn');
            root.toggleClass('active');

            var sr_ofs = root.offset();
            pu_menu_el.css({"top" : sr_ofs.top+23}); //"left" : sr_ofs.left,

            var el = $('#pop-menu-feed-add input[name=search]');
            if (!pu_menu_el.hasClass('dn')) {
            	el[0].focus();
            } else {
            	el[0].blur();
            }

            el = $('#pop-menu-feed-add input[name=subscribe]');
            if (el.length) {
                if (!pu_menu_el.hasClass('dn')) {
                	el[0].focus();
                } else {
                	el[0].blur();
                }
            }

            return false;
        });

        $('#subscriptions-button').unbind('click').bind('click', function() {
            var el = $(this);

            el.toggleClass('active');

    		that.func_sendMessage("storage_get_element_value", 'popup_options', {}, function(o) {
    			o['activeTab'] = !el.hasClass('active') ? 'reader' : 'subs';
    			that.popup_options = o;
    	        that.func_sendMessage("storage_set_element_value", 'popup_options', o, function(){});

    	        that.printEl.empty();

                if (o['activeTab'] == 'subs') {
        	        that.print_subs(that.sortType, that.popup_options.subs.filter);
                } else {
        	        that.reader_update();
                }
    		});

            return false;
        });

        if (that.popup_options['activeTab'] == 'subs') {
        	$('#subscriptions-button').addClass('active');
        } else {
        	$('#subscriptions-button').removeClass('active');
        }

        $('#pop-menu-feed-add input[name=cancel]').unbind('click').bind('click', function() {
   			$('#finded-feed-list').remove();

	        $('#pop-menu-feed-add [name=submit]')[0].disabled = false;
	        $('#pop-menu-feed-add [name=submit] img').addClass('dn');
            $('#pop-menu-feed-add input[name=search]').val('');
        	$('#feed-add-button').trigger('click');
            return false;
        });

        $('#pop-menu-feed-add input[name=import]').unbind('change').bind('change', function() {
            var el = $(this);

            var time_store_limit = $('#pop-menu-feed-add [name=time_store_limit]').val()*(3600*24);

            var file = this.files[0];
            if (file) {
                var reader;
                reader = new FileReader();
                reader.readAsText(file, "UTF-8");
                reader.onload = function(evt) {
                    var fileString = evt.target.result;
                    if (fileString.length > 0) {
                        var func = 'opml_import';
                    	that.messages_callbacks.push({
                    	    "type"		: "",
                    	    "under_type": "",
                    	    "func"		: func,
                    		"field" 	: "file",
                    		"callback" 	: function(data) {
						        el.parents('form:first')[0].reset();

                                var elTextOk = $('<div class="item-one-send-ok item-one-send-abs">Import ok</div>');

                                elTextOk.insertAfter(el);
                                setTimeout(function() {
                                    elTextOk.fadeOut('fast', function() {
                                        elTextOk.remove();
                                        elTextOk = null;
						            	$('#pop-menu-feed-add input[name=cancel]').trigger('click');
                                    });
                                }, 1000);
                    		}
                    	});

                		that.port_sendMessage({"doing": "function", "func" : func, "field" : "file", "value" : {"file" : fileString, "time_store_limit" : time_store_limit}, "type" : "", "under_type" : ""}, that.connect);
                    }
                };
            }
		});


        $('#pop-menu-feed-add [name=submit]').unbind('click').bind('click', function() {
            var button = this;
            var $button = $(this);

            var el = $('#pop-menu-feed-add input[name=search]');
            var time_store_limit = $('#pop-menu-feed-add [name=time_store_limit]').val()*(3600*24);
            var value = $.trim(el.val());

            var printError = function() {
                var elTextOk = $('<div class="item-one-send-err item-one-send-abs">Empty or not url</div>');

                elTextOk.insertAfter(el);
                setTimeout(function() {
                    elTextOk.fadeOut('fast', function() {
                        elTextOk.remove();
                        elTextOk = null;
                    });
                }, 2000);

                return false;
            }

            if (!value || !value.match(/^https*:\/\//i)) {
            	return printError();
            }

            var feeds_import_callback = function(data) {
            	$('#pop-menu-feed-add input[name=cancel]').trigger('click');
            }

            var feed_add_callback = function(data) {
        		$('#finded-feed-list').remove();

                var printError = function() {
                    var elTextOk = $('<div class="item-one-send-err item-one-send-abs">Error while loading this feed.</div>');

                    elTextOk.insertAfter(el);
                    setTimeout(function() {
                        elTextOk.fadeOut('fast', function() {
                            elTextOk.remove();
                            elTextOk = null;
                        });
                    }, 2000);

                    return false;
                }

        		if (typeof data['html_feed_list'] != 'undefined') {
        			var c = data['html_feed_list'];
        			var l = c.length, e, i;

        			var s = [];

        			s.push('<form id="finded-feed-list">');
        			if (l) {
	        			s.push('<fieldset>');
	        			s.push('<legend>These feeds was finded on that page.</legend>');
	        			s.push('<p>Please select for subscribe:</p>');
	        			s.push('<ul>');
	        		} else {
	        			s.push('<b class="formError">Have not feeds on that page. Please input another url</b>');
	        		}

        			for (i=0; i < l; i++) {
        				e = c[i];

        				s.push('<li>');
        				s.push('<input type="checkbox" checked name="feed_href[]" value="'+e.href+'" /><a href="'+e.href+'" target="_blank" title="'+e.href+'">'+e.title+'</a>');
        				s.push('</li>');
        			}
        			if (l) {
	        			s.push('</ul>');
	        			s.push('<input type="submit" name="subscribe" value="Subscribe" />');
	        			s.push('<input type="submit" name="sub_cancel" value="Cancel" />');
	        			s.push('</fieldset>');
	        		} else {
	        		}
        			s.push('</form>');

        			var elTextStatus = $(s.join('')).insertAfter(el.parent());

        			if (!l) {
                        setTimeout(function() {
                            elTextStatus.fadeOut('fast', function() {
                                elTextStatus.remove();
                                elTextStatus = null;
                            });
                        }, 2000);
                    }

			    	button.disabled = false;
			        $button.find('img').addClass('dn');

                    $('#pop-menu-feed-add input[name=sub_cancel]').bind('click', function() {
    		    		$('#finded-feed-list').remove();
                        return false;
                    });

                    $('#pop-menu-feed-add input[name=subscribe]').bind('click', function() {
                        var el = this;

                        var list = $('#pop-menu-feed-add input[name=feed_href\\[\\]]:checked');

                        var l = list.length, i, feed_list = [];
                        for (i=0; i < l; i++) {
                        	feed_list.push(list[i].value);
                        }

                        var printError = function() {
                            var elTextOk = $('<div class="item-one-send-err item-one-send-abs">Select at least one feed</div>');

                            elTextOk.insertAfter(el);
                            setTimeout(function() {
                                elTextOk.fadeOut('fast', function() {
                                    elTextOk.remove();
                                    elTextOk = null;
                                });
                            }, 2000);

                            return false;
                        }

                        if (!feed_list.length) {
                        	return printError();
                        }

                        var func = feed_list.length == 1 ? 'feed_add' : 'feeds_import';
                    	that.messages_callbacks.push({
                    	    "type"		: "",
                    	    "under_type": "",
                    	    "func"		: func,
                    		"field" 	: "url",
                    		"callback" 	: function(data) {
                    			if (feed_list.length == 1) {
				        			feed_add_callback(data);
				        		} else {
				        			feeds_import_callback(data);
				        		}
                    		}
                    	});
                		that.port_sendMessage({"doing": "function", "func" : func, "field" : "url", "value" : {"list" : feed_list, "time_store_limit" : time_store_limit}, "type" : "", "under_type" : ""}, that.connect);
                		this.disabled = true;

                        return false;
                    })[0].focus();

        		} else {
               		button.disabled = false;
			        $button.find('img').addClass('dn');

	        		if (typeof data['feedInfo']['primaryKey'] == 'undefined') {
    	    			printError();
    	    		} else {
				    	$('#feed-add-button').trigger('click');
				        $('#pop-menu-feed-add input[name=search]').val('');
				    	$('.tabs .tabs-all').trigger('click');
    	    		}
        		}
            }

        	that.messages_callbacks.push({
        	    "type"		: "",
        	    "under_type": "",
        	    "func"		: "feed_add",
        		"field" 	: "url",
        		"callback" 	: function(data) {
        			feed_add_callback(data);
        		}
        	});
    		that.port_sendMessage({"doing": "function", "func" : "feed_add", "field" : "url", "value" : {"list" : [value], "time_store_limit" : time_store_limit}, "type" : "", "under_type" : ""}, that.connect);

    		button.disabled = true;
	        $button.find('img').removeClass('dn');

       		$('#finded-feed-list').remove();

            return false;
        });

    	if (this.isFF) {
            $('#options_link').unbind('click').bind('click', function() {
    			that.port_sendMessage({"doing": "function", "func" : "options_open", "field" : "", "value" : ""}, that.connect);
                return false;
            });
        }

        if (that.popup_options['activeTab'] == 'subs') {
	        that.print_subs(that.sortType, that.popup_options.subs.filter);
        } else {
	        that.print_events(that.popup_options.reader.page, that.popup_options.reader.sort, that.popup_options.reader.filter);
        }




    	that.func_sendMessage("activetab_get_feeds", 'feeds', {}, function(o) {
    		//console.log(o);

    	});

    },

    images_finded : [],
    images_finded_index : [],

    images_find_and_load : function() {
    	var that = this;

   	    var $topicList = $('.topic-list > ul', this.printEl);

        var rootOffset = $topicList.offset();
        var windowTop = $topicList.scrollTop();
        var windowHeight = $topicList.height();
        var threshold = 500;

        var images = [], images_index = [];
        var images_to_del = [];

        $('.topic-one article img', $topicList).each(function(index, element) {
            var $element = $(element);
            var offset = $element.offset();

            var is_find = false;

            var id, one_image;

            var top = offset.top + windowTop - rootOffset.top;
            var down = offset.top + $element.height() + windowTop - rootOffset.top;

            if ((top - threshold >= windowTop && top - threshold < windowTop + windowHeight)
            	||
            	(down + threshold >= windowTop && down - threshold < windowTop + windowHeight)
            	||
            	(top - threshold < windowTop && down + threshold > windowTop + windowHeight)
            ) {
    	        is_find = true;
            }

           	id = ($element.data('image-id') || 0)|0;

           	if (id) {

           		one_image = {
                	"id" : id,
                	"element" : element
                };

                if (is_find) {

                	if (!$element.hasClass('loaded')) {
        	            images_index.push(id);
                    	images.push(one_image);
                	}

        	    } else {
                	if ($element.hasClass('loaded')) {
	                	images_to_del.push(one_image);
	                }
        	    }
        	}

        });

        var l = images.length, i, e;
        for (i=0; i < l; i++) {
        	e = images[i];

            (function(e) {

            	that.func_sendMessage("image_get_content", "id", e.id, function(o) {

                   	var image = e.element;
                   	var $image = $(image);

		        	if (!$image.hasClass('loaded')) {

		        		//!!!todo if null, print error image
		        		if (o) {
	                        image.src = o;
	                    }

                        $image.addClass('loaded');
                        $('<a class="loaded-lll" href="'+$image.data('src')+'" target="_blank">L</a>').insertAfter($image);
		        	}

            	});

            }(images[i]));

        }


        l = images_to_del.length;
        for (i=0; i < l; i++) {
        	e = images_to_del[i];

            (function(e) {

                var image = e.element;
                var $image = $(image);

	        	if ($image.hasClass('loaded')) {

                    image.src = "../images/file.png";

                    $image.removeClass('loaded');
                    $image.next('.loaded-lll').remove();
                }

            }(images_to_del[i]));

        }



    },

    msg_handler : function(msg) {
    	var that = this;

        if (msg.doing == 'ignition_ok') {
	        that.init(msg.coreInfo);
        }

        if (msg.doing == 'popUp_Init') {
    	    that.init(msg.coreInfo);
        }

        if (msg.doing == 'popUp_Refresh') {
            that.folders = [];

            if (typeof msg.filter != 'undefined') {
        	    that.popup_options.reader.filter = msg.filter;
            }


            //=========================
           	var o = that.popup_options;
            if (o['activeTab'] == 'subs') {
        	    that.print_subs(that.sortType, that.popup_options.subs.filter);
            } else {
        	    that.reader_update();
            }
            //=========================

        }

        if (msg.doing == 'popUp_Refresh_counts') {
            if (typeof msg.filter != 'undefined') {
        	    that.popup_options.subs.filter = filter;
            }

           	that.folders_refresh();
        }

        if (msg.doing == 'answer_function') {
            var c = this.messages_callbacks;
            var j = get_el_by_fields(c, {
        	    "type"		: msg.type,
        	    "under_type": msg.under_type,
        		"func" 		: msg.func,
        		"field" 	: msg.field
        		}
        	);

        	if (j != -1) {
        		var callback = c.splice(j, 1);
        		callback[0]['callback'].call(that, msg.value);
        	}
        }
    },

    func_sendMessage : function(msg, field, value, callback) {
        var that = this;

    	this.messages_callbacks.push({
    	    "type"		: this.type,
    	    "under_type": this.under_type,
    	    "func"		: msg,
    		"field" 	: field,
    		"callback" 	: callback
    	});

		that.port_sendMessage({"doing": "function", "func" : msg, "field" : field, "value" : value, "type" : this.type, "under_type" : this.under_type}, that.connect);
    },

    feed_get : function(item) {
    	var r = {};

    	var c = this.folders, j;
    	if (c.length) {
    		j = get_el_by_field(c, 'primaryKey', item.folder_id);
    		if (j != -1) {
    			c = c[j];
    			c = c['innerList'];
    			if (c && c.length) {
            		j = get_el_by_field(c, 'primaryKey', item.feed_id);
            		if (j != -1) {
            			c = c[j];
				    	return c;
            		}
    			}
    		}
    	}

    	return r;
    },

    search_text : '',

    search_text_set : function(text) {
        this.search_text = text;
    },

    search_text_update_notify : function(text) {
        this.func_sendMessage("storage_set_element_value", 'search_text', text, function(){});
    },

    counts : {"all" : 0, "new" : 0},

    counts_set : function(counts) {
        this.counts = counts;
    },

    page_active  : 1,

    page_set : function(page) {
        this.page_active = page;
    },

    sortType  : 'datetime',

    sort_set : function(sortType) {
        this.sortType = sortType;
    },

    page_update_notify : function(id, page) {
    	this.func_sendMessage("page_update", id, page, function() {});
    },

    subs_page_update : function(id, page) {
    	this.func_sendMessage("subs_page_update", id, page, function() {});
    },

    sort_update : function(sortType) {
        var that = this;

		that.func_sendMessage("storage_get_element_value", 'popup_options', {}, function(o) {
			o['reader']['sort'] = sortType;
   			that.popup_options = o;
	        that.func_sendMessage("storage_set_element_value", 'popup_options', o, function(){});
		});
    },

    filter_update : function(filters, callback) {
        var that = this;
		that.func_sendMessage("storage_get_element_value", 'popup_options', {}, function(o) {
			o['reader']['filter'] = filters;
   			that.popup_options = o;
	        that.func_sendMessage("storage_set_element_value", 'popup_options', o, function() {
        		that.func_sendMessage("calc_cache_icon_counts", '', '', function(popup_options) {
        			callback();
        		});
	        });
		});
    },

    subs_filter_update : function(filters, callback) {
        var that = this;
		that.func_sendMessage("storage_get_element_value", 'popup_options', {}, function(o) {
			o['subs']['filter'] = filters;
   			that.popup_options = o;
	        that.func_sendMessage("storage_set_element_value", 'popup_options', o, function() {
       			callback();
	        });
		});
    },

    forum_list_scroll : function(forum_id) {
    	var root = $('.forum-list');
    	var el = root.find('#forum-list-one-'+forum_id);
    	if (el.length) {
    		var pos = el.position();
    		var top = pos.top;
    		var rootH = root.height();
    		var topSet = top-(rootH/2)+(el.height()/2);
    		if (topSet > rootH/2) {
	    		root[0].scrollTop = topSet;
	    	}
    	}
    },

    forum_active : 0,

    forum_active_set : function(forum_id) {
        this.forum_active = forum_id;
        this.forum_active_update(forum_id);

        $('.item-one.forum-list-one').removeClass('active is_new');
        $('#forum-list-one-'+forum_id+'').addClass('active');
    },

    forum_active_update : function(forum_id) {
        var that = this;

		that.func_sendMessage("storage_get_element_value", 'popup_options', {}, function(o) {
			o['subs']['filter']['activeItem']['primaryKey'] = forum_id;
   			that.popup_options = o;
	        that.func_sendMessage("storage_set_element_value", 'popup_options', o, function(){});
		});
    },

    forums_inner_print : function(group_id, page, clickFromPager, reLoad) {
        var that = this;

        clickFromPager = clickFromPager || false;
        reLoad = reLoad || false;

        if (!$('body').length) return false;

        var s = [], i;

        var groups = that.folders;
        var i = get_el_by_field(groups, 'primaryKey', group_id);
        if (i == -1) {
        	return false;
        }

        var currentGroup = groups[i];

		var users = !currentGroup['innerList'] ? [] : currentGroup['innerList'];
        var group_counts = users.length;
        var group_type = currentGroup['root_id'];
        var lenAll = group_counts;
		if (typeof users == 'undefined') users = [];

		var countAll = users.length;

		lenAll = countAll;

        var onPage = 10;//this.pager_options.onPage;

        if (!page) {
        	page = currentGroup['activePage'];
        	if (!page) {
        		page = 1;
        	}
        }

        if (that.forum_active == group_id && !clickFromPager && reLoad) {
        	//page = 1;
        }

        var isSearchStart = (!page);

        if ((page-1)*onPage >= lenAll && lenAll > 0) {
            page = Math.ceil(lenAll/onPage);
        }

        var startPos = (page-1)*onPage;

        var max_len = (!onPage) ? lenAll : Math.min(lenAll, startPos+onPage);

        var itemsToDraw = [];

        var lt,
            lasttime,
            add_class,
            lineHidden,
            item,
            pager_arr = [];

        var needToLoadMore = false;

        if (!users.length) {
        	needToLoadMore = true;
        }

        for (i=startPos; i < max_len; i++) {

        	if (typeof users[i] == 'undefined') {
        		needToLoadMore = true;
        		break;
        	}

            itemsToDraw.push(users[i]);
        }

        var root = $('#forum-list-forums');

        var len = itemsToDraw.length;

        if (!root.length) {
            root = $('<div id="forum-list-forums"></div>');
            root.insertBefore('.forum-list');
        }

        var $itemList = $('.forum-forums', root);
        var is_was_draw_list = $itemList.length;

        root
          .find('.waiting-image').remove();

        var listTitle = '', forum_url, image_url;

        s.push('<h1>'+currentGroup['title']+'</h1>');

        s.push(listTitle+'<ul class="forum-forums">');

        var is_exists_filters_save = false;

        if (!len) {
           	s.push('<div class="item-list topic-list"><div class="item-list-empty">Have not feeds</div></div>');
        } else {

            for (i=0; i < len; i++) {
                item = itemsToDraw[i];

                forum_url = item.url;
                if (forum_url.indexOf('://') == -1) {
                	forum_url = 'http://' + item['domain'] + forum_url;
                }

                image_url = item.image_url;
                if (image_url && image_url.indexOf('://') == -1) {
                	image_url = 'http://' + item['domain'] + image_url;
                }

                add_class = 'forum-level forum-level-0';
                if (item.subscribe) {
	                add_class += ' '+that.class_forum_subscribe;
	            }
                if (item.is_filters_save) {
	                add_class += ' '+that.class_forum_filters_save;
	                is_exists_filters_save = true;
	            }

                s.push('<li data-id="'+item.primaryKey+'" data-root_id="'+item.folder_id+'" id="forum-'+item.primaryKey+'" class="'+add_class+'">');
                if (image_url) {
	                s.push('<img class="forum-feed-img" src="'+image_url+'" />');
	            }
                s.push('<a class="forum-feed-link-img" href="'+item.link+'" title="'+that.escape(item.link+'\n'+item.link_301)+'" target="_blank"><img title="" src="http://s2.googleusercontent.com/s2/favicons?domain='+item.domain+'&alt=feed" /></a>');
                s.push('<a class="forum-title" href="'+forum_url+'" title="'+that.escape(item.title+'\n'+forum_url)+'" target="_blank">'+item.title+'</a>');
                s.push('<a class="forum-feed-link" href="'+item.link+'" title="'+that.escape(item.link+'\n'+item.link_301)+'" target="_blank">'+(item.link_301 || item.link)+'</a>');
                s.push('<p class="forum-feed-description" title="'+that.escape(item.description)+'">'+item.description+'</p>');
                s.push('<a href="/forum/'+item.primaryKey+'/delete/" class="forum-delete-action" title="Delete subscription"></a>');
                s.push('<a href="/forum/'+item.primaryKey+'/subscribe/" class="forum-subscribe-action" title="Subscribe/unsibscribe"></a>');
                s.push('</li>');
            }
        }

        s.push('</ul><div class="clear"></div>');

        if (onPage > 0) {
            that.print_pager_ordinal(pager_arr, page, Math.ceil(lenAll/onPage), 3);
        }

        s = s.concat(pager_arr);

        root.html(s.join(''))
        	.css({"opacity" : 1});

        $itemList = $('.forum-forums', root);

        //------- pager --->
        $('.pager-nav a', root)
         .unbind('click').bind('click', function() {
            var el = $(this);
            var pageSet = parseInt(this.href.replace(/.*?\/page,(\d+)\/.*$/, '$1'));

            var clickFromPager = true;
            that.forums_inner_print(group_id, pageSet, clickFromPager);

            var $itemList = $('.forum-forums', root);

            if ($itemList.length) {
                $itemList[0].scrollTop = 0;
            }

            return false;
        });
        //------- pager ---<

        $('.forum-forums > li a.forum-subscribe-action', root)
            .unbind('click').bind('click', function(event) {
                var el = $(this);
                var elRoot = el.parent();

                var forum_id = parseInt(elRoot[0].getAttribute('data-id'));
                var root_id = parseInt(elRoot[0].getAttribute('data-root_id'));

                var c = that.array;
                var cFav = that.array[0];
                var j = (!root_id) ? 0 : get_el_by_field(c, 'primaryKey', root_id);

                if (j != -1) {
                	var root_element = c[j];
                	var ci = root_element['innerList'];
                    j = get_el_by_field(ci, 'primaryKey', forum_id);
                    if (j != -1) {

		                var loadAdded = [];

	                	c = ci[j];
	                	c['subscribe'] = !c['subscribe'] ? that.getCurrentTime() : 0;
	                	if (!c['activePage']) {
	                		c['activePage'] = 1;
	                	}
			            that.array_update_notify([c]);

			            if (c['subscribe']) {
                        	loadAdded.push({
                        		"eventKey" 		: c['forum_id'],
                        		"msgType" 		: 'forum_filters_save',
                        		"objectType" 	: c['primaryKey'],
                        		"timeNextUpdate": c['subscribe'],
                        		"tryCount" 		: 10,
                            	"priority" 		: 3,
                        		"url" 			: '',
                        		"user_id" 		: 0,
                        		"datetime" 		: 0,
                        		"text"			: ''
                        	});

                    	    that.func_sendMessage("cron_update", 0, loadAdded, function() {});
    		        	}

			            elRoot.toggleClass(that.class_forum_subscribe);

	                	that.subs_update();
                    }
                }

                return false;
            });

        $('.forum-forums > li a.forum-delete-action', root)
            .unbind('click').bind('click', function(event) {
                var el = $(this);
                var elRoot = el.parent();

                var forum_id = parseInt(elRoot[0].getAttribute('data-id'));
                var root_id = parseInt(elRoot[0].getAttribute('data-root_id'));

                var c = that.folders;
                var j = (!root_id) ? 0 : get_el_by_field(c, 'primaryKey', root_id);

                if (j != -1) {
                	var root_element = c[j];
                	var ci = root_element['innerList'];
                    j = get_el_by_field(ci, 'primaryKey', forum_id);
                    if (j != -1) {

	                	c = ci[j];

                    	that.func_sendMessage("feeds_delete", 0, {"array" : [c]}, function(array) {
		                	that.subs_update();
                    	});
                    }
                }

                return false;
            });

        //-------------
        $('.forum-forums li a.forum-title', root)
            .unbind('click').bind('click', function(event) {
                var el = $(this);

                return true;

                var user_id = parseInt(el[0].href.replace(/.*?(\d+)$/, '$1'));
                var user_name = el.html();

                var root = $('#user_info');
	            if (root.length) {
    	            root.hide();
                	root[0]['user_id'] = 0;
                }
                if (that.user_info_view_timer_load) {
                	clearTimeout(that.user_info_view_timer_load);
                	that.user_info_view_timer_load = null;
                }

                event.stopPropagation();
                event.preventDefault();

                $('.tabs-letters').trigger('click');
                that.letter_add_notify(user_id, user_name, true);
                that.user_info_hide();

                return false;
            });

        that.forum_active = group_id;
        that.forum_active_update(group_id);

        that.subs_page_update(group_id, page);
        currentGroup['activePage'] = page;
    },

    folder_edit : function(folder_id, folder_title) {
        var that = this;

        var j = get_el_by_field(that.array, 'primaryKey', folder_id);
        if (j != -1) {

        	that.array[j]['title'] = folder_title;

	    	this.func_sendMessage("folder_edit", folder_id, that.array[j], function(folder_item) {});
            $('#contact-one-'+folder_id+' dl dt span:first').html(folder_title);
        }
    },

    folders_get : function(callback) {
    	this.func_sendMessage("folders_get", 0, "", callback);
    },

    folder_delete : function(array) {
        var that = this;

        var c = that.array;

        var i, j;
        var len = array.length;

        for (i=0; i < len; i++) {
            j = get_el_by_field(c, 'primaryKey', array[i]['primaryKey']);
            if (j != -1) {
                c.splice(j, 1);
                $('#contact-one-'+array[i]['primaryKey']).remove();
                //!!! делать активной папку до удалённой
            }
        }

	    this.func_sendMessage("folder_delete", 0, array, function(array_deleted) {});
    },

    print_sort_control : function(arr, sortType) {
    	var sortByTitle = (sortType == 'datetime') ? ' времени комментариев' : ' карме моих комментариев';
        arr.push('<a href="#" class="sort-control sort-control-'+sortType+'" title="Сортировка по'+sortByTitle+'"></a>');
    },

    print_pager : function(arr, $page_current, $countPagesAll) {
        var $page_current_;

        if ($countPagesAll > 1) {

            var $base_url = '';

            var $page_item_prev = ($page_current < $countPagesAll) ? '<li>&larr;&nbsp;<a href="'+$base_url+'/page,'+($page_current+1)+'/">сюда</a></li>' : '<li>&larr;&nbsp;сюда</li>';
            var $page_item_next = ($page_current > 1) ? '<li><a href="'+$base_url+'/page,'+($page_current-1)+'/">туда</a>&nbsp;&rarr;</li>' : '<li>туда&nbsp;&rarr;</li>';

            var $page_item = '<li><a href="'+$base_url+'/page,{$page}/">{$pageTitle}</a></li>';

            var $pager_nav_page = [];

            if ($page_current > 1) {
                $page_current_ = $page_current;

                var $pageMinusLimit = Math.max($page_current_-5, 0);

                while (--$page_current_ > $pageMinusLimit) {
                    $pager_nav_page.push($page_item.replace('{$page}', $page_current_).replace('{$pageTitle}', $page_current_));
                }

                if ($page_current > 5) {
                    $pager_nav_page.push($page_item.replace('{$page}', 1).replace('{$pageTitle}', '&rarr;'));
                }
            }

            $pager_nav_page.unshift('<li class="active"><a href="'+$base_url+'/page,'+$page_current+'/">'+$page_current+'</a></li>');

            if ($page_current < $countPagesAll) {
                $page_current_ = $page_current;

                var $pagePlusLimit = Math.min($page_current_+4, $countPagesAll);

                while (++$page_current_ <= $pagePlusLimit) {
                    $pager_nav_page.unshift($page_item.replace('{$page}', $page_current_).replace('{$pageTitle}', $page_current_));
                }

                if ($page_current < $countPagesAll-4) {
                    $pager_nav_page.unshift($page_item.replace('{$page}', $countPagesAll).replace('{$pageTitle}', '&larr;'));
                }
            }

            arr.push('<div class="pager-nav">');
            arr.push('<ul class="pager-nav-prev-next">');
            arr.push($page_item_prev);
            arr.push($page_item_next);
            arr.push('</ul>');
            arr.push('<ul class="pager-nav-page">');
            arr.push($pager_nav_page.join(''));
            arr.push('</ul>');
            arr.push('</div>');
        } else {
            arr.push('<div class="pager-nav dn">');
            arr.push('</div>');
        }
    },

    print_pager_ordinal : function(arr, $page_current, $countPagesAll, $left_right_count) {
        var $page_current_;

        if ($countPagesAll > 1) {

            var $base_url = '';

            var $page_item_prev = ($page_current > 1) ? '<li>&larr;&nbsp;<a href="'+$base_url+'/page,'+($page_current-1)+'/">сюда</a></li>' : '<li>&larr;&nbsp;сюда</li>';
            var $page_item_next = ($page_current < $countPagesAll) ? '<li><a href="'+$base_url+'/page,'+($page_current+1)+'/">туда</a>&nbsp;&rarr;</li>' : '<li>туда&nbsp;&rarr;</li>';

            var $page_item = '<li><a href="'+$base_url+'/page,{$page}/">{$pageTitle}</a></li>';

            var $pager_nav_page = [];

            if ($page_current > 1) {
                $page_current_ = $page_current;

                var $pageMinusLimit = Math.max($page_current_-($left_right_count+1), 0);

                while (--$page_current_ > $pageMinusLimit) {
                    $pager_nav_page.unshift($page_item.replace('{$page}', $page_current_).replace('{$pageTitle}', $page_current_));
                }

                if ($page_current > $left_right_count+1) {
                    $pager_nav_page.unshift($page_item.replace('{$page}', 1).replace('{$pageTitle}', '&larr;'));
                }
            }

            $pager_nav_page.push('<li class="active"><a href="'+$base_url+'/page,'+$page_current+'/">'+$page_current+'</a></li>');

            if ($page_current < $countPagesAll) {
                $page_current_ = $page_current;

                var $pagePlusLimit = Math.min($page_current_+$left_right_count, $countPagesAll);

                while (++$page_current_ <= $pagePlusLimit) {
                    $pager_nav_page.push($page_item.replace('{$page}', $page_current_).replace('{$pageTitle}', $page_current_));
                }

                if ($page_current < $countPagesAll-$left_right_count) {
                    $pager_nav_page.push($page_item.replace('{$page}', $countPagesAll).replace('{$pageTitle}', '&rarr;'));
                }
            }

            arr.push('<div class="pager-nav">');
            arr.push('<ul class="pager-nav-prev-next">');
            arr.push($page_item_prev);
            arr.push($page_item_next);
            arr.push('</ul>');
            arr.push('<ul class="pager-nav-page">');
            arr.push($pager_nav_page.join(''));
            arr.push('</ul>');
            arr.push('</div>');
        } else {
            arr.push('<div class="pager-nav dn">');
            arr.push('</div>');
        }
    },

    array_update_notify : function(c, is_not_full_array) {
        var that = this;

    	this.func_sendMessage("array_update_notify", 0, {"array" : c, "is_not_full_array" : is_not_full_array}, function() {
        	if (["new", "all", "star"].indexOf(that.under_type) != -1) {
        		var under_type_rev = that.under_type == "new" ? 'all' : 'new';
                if (!is_not_full_array) {
	    	       	Popup.listUpdateData(that.type, under_type_rev);
                } else {
                    if (is_not_full_array == 'mark_all_read') {
		    	       	Popup.listUpdateData(that.type, under_type_rev);
            	    }
                }
            }
    	});
    },

    array_sort : function() {
        this.array.sort(function(a, b) {
            var r = b['datetime'] - a['datetime'];
            if (!r) r = b['primaryKey'] - a['primaryKey'];
            return r;
        });
    },

    array_add : function(arr, isUnshift) {
        var that = this;
    	if (typeof isUnshift == 'undefined') isUnshift = false;

    	if (!isUnshift) {
	        this.array = this.array.concat(arr);
	    } else {
	        this.array = arr.concat(this.array);
	    }

        var c = this.array, len = c.length, i;
        for (i=0; i < len; i++) {
			if (typeof c[i] == 'undefined') {
		        for (i=0; i < len; i++) {
		        	delete c[i];
		        }
				break;
			}
        }

        this.array_sort();
    },

    array_new_filter: function(arr) {
        var len = arr.length, i, ret = [];
        for (i=0; i < len; i++) {
        	if (arr[i]['New']) {
        		ret.push(arr[i]);
        	}
        }
    	return ret;
    },

    array_del_filter: function(arr) {
        var len = arr.length, i, ret = [];
        for (i=0; i < len; i++) {
        	if (arr[i]['deleted']) {
        		ret.push(arr[i]);
        	}
        }
    	return ret;
    },

    array_del : function(arr, dont_del_undefined) {
    	dont_del_undefined = dont_del_undefined || false;

        var len = arr.length, i, j, needClear = false;

        for (i=0; i < len; i++) {
            if (!this.array.length) {
				break;
            }
            j = get_el_by_field(this.array, 'primaryKey', arr[i]['primaryKey']);
            if (j != -1) {
                this.array.splice(j, 1);
            } else {
                if (!dont_del_undefined) {
                	this.array.splice(0, 1);
                }
                needClear = true;
            }
        }
        if (needClear && this.array.length) {
        	len = this.array.length;
		    for (i=0; i < len; i++) {
		    	delete this.array[i];
		    }
        }
    },

    array_update : function(arr) {
        var i, j;

        var len = arr.length;

        for (i=0; i < len; i++) {
            j = get_el_by_field(this.array, 'primaryKey', arr[i]['primaryKey']);
            if (j != -1) {
                this.array[j] = arr[i];
            }
        }

        var c = this.array, len = c.length, i;
        for (i=0; i < len; i++) {
			if (typeof c[i] == 'undefined') {
		        for (i=0; i < len; i++) {
		        	delete c[i];
		        }
				break;
			}
        }

        this.array_sort();
    },

    folders_refresh : function() {
        var that = this;

	    that.func_sendMessage("feeds_get", 0, "", function(data) {
       	    that.forum_active_set(data['forum_active_id']);
       	    that.folders = data['list'];
            that.folders_print();
	    });
    },

    array_set : function(arr) {
        this.array = [];

        var i;

        var len = arr.length;

        for (i=0; i < len; i++) {
            this.array.push(arr[i]);
        }
    },

    reader_update : function() {
        var that = this;

        that.array = [];

	    this.reader_data_load(this.page_active, 20, this.sortType, that.popup_options.reader.filter, 0, function(c, countAll) {
	       	if (!window) return false;

			var l = that.reader_data_process(that.page_active, 20, that.sortType, that.popup_options.reader.filter, c, countAll);

            that.array_set(l);
	        that.print_events(that.page_active, that.sortType, that.popup_options.reader.filter);
	    });
    },

    reader_data_get : function(page, sortType, filters, offset, func) {
        var that = this;

	    this.reader_data_load(page, 20, sortType, filters, offset, function(c, countAll) {
	       	if (!window) return false;

			var l = that.reader_data_process(page, 20, sortType, filters, c, countAll);

            that.array_set(l);
            func(l, countAll, c);
	    });
    },

    reader_data_load : function(page, onPage, sortType, filters, offset, get_handler) {
        var that = this;

   	    var activeItem = filters['activeItem'];
   	    var activeMode = 0;

        var c = that.folders, j, ci;
        if (c.length) {
        	j = get_el_by_field(c, 'primaryKey', activeItem['folder_id']);
        	if (j != -1) {
        		c = c[j];
        		ci = c['innerList'];

        		if (activeItem['type'] == 'feed' && ci && ci.length) {
        			c = ci;
            		j = get_el_by_field(c, 'primaryKey', activeItem['primaryKey']);
            		if (j != -1) {
            			c = c[j];
		    			activeMode = c['activeMode'];
            		}
        		} else {
	    			activeMode = c['activeMode'];
        		}
        	}
        }

	    that.func_sendMessage(
	    	"data_get",
	    	0, {
	    		"page" : page,
	    		"onPage" : onPage,
	    		"sortType" : sortType,
	    		"filters" : filters,
	    		"activeMode" : activeMode,
	    		"offset" : offset
	    	},

	    	function(data) {
	    		get_handler(data['list'], data['countAll']);
	    	}
	    );

    },

    reader_data_process : function(page, onPage, sortType, filters, c, countAll) {
        var l = this.array;

        var startPos;
    	startPos = (page-1)*onPage;

        var k = countAll;
        if (k > 0 && !l.length) {
        	while (--k >= 0) {
        		l.push(undefined);
        	}
        }

        if (c.length) {
        	k = c.length;
        	while (--k >= 0) {
        		l[startPos+k] = c[k];
        	}
        }

        return l;
    },

    topicOne_scrollSet : function(el) {
    	var that = this;

    	var c = that.array, i, l;

    	var offset = 0;
    	var onPage = 20;
        var lenAll = c.length;

        var $topicList = $('.topic-list > ul', this.printEl);

        var offsetTop = el.position().top;
        var $topicList_top = $topicList.scrollTop();
        $topicList_top += offsetTop;
        $topicList.scrollTop($topicList_top);

        var list = $topicList.find('>li');
        var primaryKey = el.attr('data-primaryKey')|0;
        var index = get_el_by_field(c, 'primaryKey', primaryKey);
        var elPage = Math.floor(index/onPage)+1;

        var activePageEl = $('.pager-nav-page li.active a', this.printEl);
        if (activePageEl.length) {
        	var activePage = activePageEl.html()|0;

        	if (elPage != activePage) {
	            var pager_arr = [];
    	        that.print_pager_ordinal(pager_arr, elPage, Math.ceil(lenAll/onPage), 3);
                //that.page_active = elPage;
                //that.page_update_notify(that.group_id_active, elPage);

	            $('.pager-nav', this.printEl).replaceWith(pager_arr.join(''));

	            pager_arr = null;
        	}
        }

        var nextAll = el.nextAll(':not(.is_topic_hidden)');
        if (nextAll.length < onPage-6) {

            var elLast = nextAll.filter(':last');
            if (!elLast.length) elLast = el;

            var allPages = Math.ceil(c.length/onPage);

            if (elPage && elPage < allPages) {

            	mprint(that.popup_options.reader.filter.activeItem.activeMode);//!!!
            	if (that.popup_options.reader.filter.activeItem.activeMode == 1) {
                	l = c.length;
                	for (i=0; i < Math.min(elPage*onPage, l); i++) {
                		if (typeof c[i] != 'undefined') {
    						if (!c[i]['New']) {
    							offset--;
    						}
                		}
                	}
                }

            	elPage++;
                that.reader_data_get(elPage, that.popup_options.reader.sort, that.popup_options.reader.filter, offset, function(arr, countAll, arr_page) {
                	if (!arr_page.length) {
                       	mprint('!!!!! topicOne_scrollSet() no data, page='+elPage);
                       	return false;
                	}

				    var $topicList = $('.topic-list > ul', that.printEl);

			        var s = that.events_print_array(arr_page);
			        var newTopics = $(s.join(''));
			        s = null;

                    newTopics.appendTo($topicList);
                    newTopics = null;
                    that.init_events_to_topic_items($topicList);
                });

            }
        }
    },

    topicOne_readed_set : function(el) {
    	var that = this;

        var isReaded = el.hasClass(that.topicOne_classReaded);

        if (!isReaded) {
            el.addClass(that.topicOne_classReaded);

            var id = parseInt(el[0].getAttribute('data-primaryKey'));

            var c = that.array;
            var j = get_el_by_field(c, 'primaryKey', id);
            if (j != -1) {
            	c = c[j];

            	if (c['New']) {
	                c['New'] = 0;

	        	    var countsNew = !c['New'] ? -1 : 1;

	                var feed_id = c['feed_id'];
	                var folder_id = c['folder_id'];

	                var f = that.folders, fe;

	                j = get_el_by_field(f, 'primaryKey', folder_id);
	                if (j != -1) {
	                	f[j]['countsNew'] += countsNew;

	                	fe = f[j]['innerList'];
    	                j = get_el_by_field(fe, 'primaryKey', feed_id);
    	                if (j != -1) {
    	                	fe[j]['countsNew'] += countsNew;
    	                }
	                }
	                if (folder_id != 1) {
    	                j = get_el_by_field(f, 'primaryKey', 1);
    	                if (j != -1) {
    	                	f[j]['countsNew'] += countsNew;
    	                }
    	            }

                    that.func_sendMessage("new_counts_change", 0, {"item" : c}, function() {
           	        	var ret = that.folders_print();

           	        	var ai = ret['activeFolderItem'];

           	        	var root = $('#feed-header');
           	        	root.find('.counts-button-new b').html(ai.countsNew);
           	        	root.find('.counts-button-all b').html(ai.counts);
           	        	root.find('.counts-button-star b').html(ai.countsStar);
                    });
    		    }
    		}
        }
    },

    topicOne_classActive : 'topic-one-active',
    topicOne_classReaded : 'topic-one-readed',

    topicOne_move : function(where, elSet, override) {
    	var that = this;

        var $topicList = $('.topic-list > ul', this.printEl);

        override = override || false;

        var active = $('.'+that.topicOne_classActive, $topicList);

        var activeSet = (where == 'set') ? elSet : null;
        if (!active.length && where != 'set') {
            activeSet = $('.topic-one:first', $topicList);
        } else {
            if (where == 'next') {
                activeSet = active.nextAll(':visible:first');
            }
            if (where == 'prev') {
                activeSet = active.prevAll(':visible:first');
            }
        }

        if (where == 'set') {
            if (elSet.hasClass(that.topicOne_classActive) && elSet[0] == activeSet[0] && !override) {
                return false;
            }
        }

        if (activeSet && activeSet.length) {
            active.removeClass(that.topicOne_classActive);
            activeSet.addClass(that.topicOne_classActive);
            that.topicOne_scrollSet(activeSet);
            that.topicOne_readed_set(activeSet);
        } else {
            if (active.length && (where == 'next' || where == 'prev')) {
            }
        }
    },

    topicOne_next : function() {
        this.topicOne_move('next');
    },

    topicOne_prev : function() {
        this.topicOne_move('prev');
    },

    topicOne_keepread : function() {
        var that = this;

	    var $topicList = $('.topic-list > ul', this.printEl);

        var active = $('.'+that.topicOne_classActive, $topicList);

        if (active.length) {
            $('.topic-actions .topic-actions-keepread', active).trigger('click');
        }
    },

    topicOne_star : function() {
        var that = this;

	    var $topicList = $('.topic-list > ul', this.printEl);
        var active = $('.'+that.topicOne_classActive, $topicList);

        if (active.length) {
            $('.topic-actions .topic-actions-star', active).trigger('click');
        }
    },

    topicOne_open : function() {
        var that = this;

	    var $topicList = $('.topic-list > ul', this.printEl);
        var active = $('.'+that.topicOne_classActive, $topicList);

        if (active.length) {
            var href = $('.topic-one-title a', active).attr('href');

            if (typeof chrome.tabs == 'undefined') {
		       	window.open(href);
            } else {
		       	chrome.tabs.create({url: href});
            }
        }
    },

    init_events_to_topic_items : function(context) {
        var that = this;

        $('.topic-one', context)
            .unbind('click').bind('click', function() {
                var el = $(this);
                that.topicOne_move('set', el);
            }
        );

        //--------
        $('.item-one .topic-actions-star', context).unbind('click').bind('click', function() {
            var el = $(this);

            var elRoot = el.parents('.item-one:first');
            var EventID = elRoot[0].getAttribute('data-primaryKey');

            var c = that.array;
            var i = get_el_by_field(c, 'primaryKey', EventID);
            if (i != -1) {

                c[i]['star'] = 1 - c[i]['star'];

                if (that.under_type != "star") { //!!! activeMode
                	if (!c[i]['star']) {
	                    elRoot.removeClass('topic-starred');
	                } else {
	                    elRoot.addClass('topic-starred');
	                }

                    that.func_sendMessage("sub_star", 0, {"item" : c[i]}, function() {
                            //!!! redraw counts
                    });

                } else {
                    that.func_sendMessage("sub_star", 0, {"item" : c[i]}, function() {
	                    c.splice(i, 1);

                        elRoot.fadeOut('fast', function() {
                            elRoot.remove();

                            //!!! redraw
                        });
                    });
                }
            }

            return false;
        });
        //--------
        $('.item-one .topic-actions-keepread', context).unbind('click').bind('click', function() {
            var el = $(this);

            var elRoot = el.parents('.item-one:first');
            var EventID = elRoot[0].getAttribute('data-primaryKey');

            var c = that.array;
            var i = get_el_by_field(c, 'primaryKey', EventID);
            if (i != -1) {
            	c = c[i];

                c['New'] = 1 - c['New'];

                if (!c['New']) {
	                elRoot.removeClass('topic-keepread');
	            } else {
	                elRoot.addClass('topic-keepread');
	            }

		        var countsNew = !c['New'] ? -1 : 1;

	   	        var feed_id = c['feed_id'];
	   	        var folder_id = c['folder_id'];

	   	        var f = that.folders, fe, j;

		        j = get_el_by_field(f, 'primaryKey', folder_id);
		        if (j != -1) {
		        	f[j]['countsNew'] += countsNew;

		        	fe = f[j]['innerList'];
    		        j = get_el_by_field(fe, 'primaryKey', feed_id);
    		        if (j != -1) {
    		        	fe[j]['countsNew'] += countsNew;
    		        }
		        }
		        if (folder_id != 1) {
    		        j = get_el_by_field(f, 'primaryKey', 1);
    		        if (j != -1) {
    		        	f[j]['countsNew'] += countsNew;
    		        }
    		    }

                that.func_sendMessage("new_counts_change", 0, {"item" : c}, function() {
               	    var ret = that.folders_print();

               	    var ai = ret['activeFolderItem'];

               	    var root = $('#feed-header');
               	    root.find('.counts-button-new b').html(ai.countsNew);
               	    root.find('.counts-button-all b').html(ai.counts);
               	    root.find('.counts-button-star b').html(ai.countsStar);
                });
            }

            return false;
        });

    },

    set_handlers : function() {
        var that = this;

	    var $topicList = $('.topic-list > ul', this.printEl);

        //-----> фокусирую на невидимой ссылке внутри списка для того чтобы можно было прокручивать список клавишами "вверх-вниз"
        var ankerIntoListForFocus = $('> li:first a.topicAnker', $topicList);
        if (ankerIntoListForFocus.length) {
            ankerIntoListForFocus[0].focus();
        }
        //-----<

        that.init_events_to_topic_items($topicList);

        //==============
        $('.js-pager-nav-prev')
            .bind('click', function() {
                that.topicOne_move('prev');
                return false;
        });

        $('.js-pager-nav-next')
            .bind('click', function() {
                that.topicOne_move('next');
                return false;
        });


        setTimeout(function() {
    	    var timer = null;

    		$topicList.bind("scroll", function(event) {

    			if (!timer) {
        			timer = setTimeout(function() {

        				timer = null;

        				that.images_find_and_load();

        			}, 400);
    			}

        	});

			that.images_find_and_load();

        }, 300);

    },

    window_resize : function(byHand) {
    	var that = this;

        var w = $(window);

        var height = w.height();
        var width = w.width();

        var heightSaved = w[0]['heightSaved'];
        var widthSaved = w[0]['widthSaved'];

        if (!byHand && typeof widthSaved != 'undefined' && widthSaved == width && heightSaved == height) {
            return true;
        }

        w[0]['heightSaved'] = height;
        w[0]['widthSaved'] = width;

        var body = $('body');

        var bodyPad = parseInt(body.css('marginBottom'))+parseInt(body.css('marginTop'))+parseInt(body.css('paddingBottom'))+parseInt(body.css('paddingTop'));
        var footerHeight = 10;//$('#footer').height() + 10;

        var mainContentOfs = $('#root').offset();

        if ($('.subscriptionsList').length) {
            var forum_header_height = $('#feed-header', that.printEl).height();
            var forum_footer_el = $('.pager-nav:not(.dn)', that.printEl);
            var forum_footer_height = !forum_footer_el.length ? 0 : forum_footer_el.height();

            var tl = $('.topic-list > ul', that.printEl);
            var tlPad = parseInt(tl.css('marginBottom'))+parseInt(tl.css('marginTop'))+parseInt(tl.css('paddingBottom'))+parseInt(tl.css('paddingTop'));

            var topic_list_height = height - forum_footer_height - forum_header_height - mainContentOfs.top - bodyPad - footerHeight - tlPad - 2 - 8;
            tl.css({"max-height" : topic_list_height, "height" : topic_list_height});

            var vfr_First_height = $('.subscriptionsList > .view-folder-main-root', that.printEl).height();

            var view_folder_scroll_height = height - mainContentOfs.top - bodyPad - footerHeight;
            $('.subscriptionsList', that.printEl).css({"max-height" : view_folder_scroll_height, "height" : view_folder_scroll_height});
        }

    	var root = $('.item-list.forum-list');
        if (root.length) {
        	footerHeight = 34;

	        var view_folder_scroll_height = height - mainContentOfs.top - bodyPad - footerHeight;
    	    root.css({"max-height" : view_folder_scroll_height, "height" : view_folder_scroll_height});
    	}
    },

    folders_set_handlers : function() {
        var that = this;

        $('.subscriptionsList .view-folder-one-title, .subscriptionsList .view-subscriptions-one-title', this.printEl)
         .off('click').on('click', function() {
            var el = $(this);

           	var primaryKey = that.popup_options.reader.filter['activeItem']['primaryKey'] = el.attr('data-id');
           	var folder_id = that.popup_options.reader.filter['activeItem']['folder_id'] = el.attr('data-folder_id');
           	var type = that.popup_options.reader.filter['activeItem']['type'] = el.attr('data-type');

           	var activeMode = 0;

        	var c = that.folders, j;
        	if (c.length) {
        		j = get_el_by_field(c, 'primaryKey', folder_id);
        		if (j != -1) {
        			c = c[j];
        			activeMode = c['activeMode'];

        			c = c['innerList'];

        			if (type == 'feed' && c && c.length) {
                		j = get_el_by_field(c, 'primaryKey', primaryKey);
                		if (j != -1) {
                			c = c[j];
		        			activeMode = c['activeMode'];
                		}
        			}
        		}
        	}

           	that.popup_options.reader.filter['activeItem']['activeMode'] = activeMode;
           	var activeItem = that.popup_options.reader.filter['activeItem'];

            that.filter_update(that.popup_options.reader.filter, function() {
                that.func_sendMessage("mode_set", 0, {"item" : activeItem, "activeMode" : activeMode}, function() {
			        $('.subscriptionsList .view-subscriptions-one-container, .subscriptionsList .view-folder-one-container', that.printEl).removeClass('active');

			        if (type == 'feed') {
				        $('.subscriptionsList #subscription-one-'+primaryKey+' .view-subscriptions-one-container', that.printEl).addClass('active');
			        } else {
				        $('.subscriptionsList #folder-one-'+primaryKey+' .view-folder-one-container', that.printEl).addClass('active');
			        }

	                that.reader_update();
                });
            });

            return false;
        });

        //--------
        $('.folder_add', this.printEl).off('click').on('click', function() {

            Boxy.inputValue('Добавить группу:', function(value) {
                if (!value) return false;

                that.folder_add(value, 1);
            });

            return false;
        });

        $('.view-folder-one-header .menu-actions').off('click').on('click', function() {
            var el = $(this);

            var sub_root = el.parent();
            var root = el.parents('.view-folder-root:first');

   			var show_updates_only = that.popup_options["reader"]['show_updates_only'];

            var id = parseInt(root[0].getAttribute('data-id'));

            var pu_menu_el = $('#pop-menu-folder-actions');

            if (show_updates_only) {
            	pu_menu_el.find('.pop-menu-folder-show-updated span').addClass('dn');
            } else {
            	pu_menu_el.find('.pop-menu-folder-show-updated span').removeClass('dn');
            }

            pu_menu_el[0]['readrss_active_menu'] = id;

            pu_menu_el.toggleClass('dn');
            //sub_root.toggleClass('hover');

            var sr_ofs = el.offset();

            pu_menu_el.css({"left" : sr_ofs.left-10, "top" : sr_ofs.top+20});

            return false;
        });

        $('.pop-menu-folder-show-updated a').off('click').on('click', function(event) {
            var pu_menu_el = $('#pop-menu-folder-actions');
    		that.func_sendMessage("storage_get_element_value", 'popup_options', {}, function(o) {
    			o["reader"]['show_updates_only'] = 1-o["reader"]['show_updates_only'];
    	        that.func_sendMessage("storage_set_element_value", 'popup_options', o, function(){});

    	        that.popup_options = o;

                that.folders_print();

	            pu_menu_el.toggleClass('dn');
    		});

            return false;
        });

        $('.pop-menu-folder-edit a').off('click').on('click', function(event) {
            var pu_menu_el = $('#pop-menu-folder-actions');

            var folder_id = pu_menu_el[0]['readrss_active_menu'];

            var j = get_el_by_field(that.array, 'primaryKey', folder_id);
            if (j != -1) {

            	var folder_title = that.array[j]['title'];

                Boxy.inputValue('Редактировать группу:', function(value) {
                    if (!value) return false;
                    that.folder_edit(folder_id, value);

                }, {"initialValue" : folder_title});
            }

            return false;
        });

        $('.pop-menu-folder-del a').off('click').on('click', function(event) {
            var pu_menu_el = $('#pop-menu-folder-actions');

            var folder_id = pu_menu_el[0]['readrss_active_menu'];

            var j = get_el_by_field(that.array, 'primaryKey', folder_id);
            if (j != -1) {

            	var folder_title = that.array[j]['title'];

                Boxy.confirm('Точно удалить группу &quot;'+folder_title+'&quot;?', function() {
                    that.folder_delete([that.array[j]]);

                });
            }

            return false;
        });
    },

    //that.popup_options.reader.filter['activeItem']
    folders_get_activeItem : function(activeItem) {
        var that = this;

   	    var activeData = {};

        var c = that.folders, j, ci;
        if (c.length) {
        	j = get_el_by_field(c, 'primaryKey', activeItem['folder_id']);
        	if (j != -1) {
        		c = c[j];
        		ci = c['innerList'];

        		if (activeItem['type'] == 'feed' && ci && ci.length) {
        			c = ci;
            		j = get_el_by_field(c, 'primaryKey', activeItem['primaryKey']);
            		if (j != -1) {
            			c = c[j];
		    			activeData = c;
            		}
        		} else {
	    			activeData = c;
        		}
        	}
        }

        return activeData;
    },

    folders_print : function() {
        var that = this;

		var rootEl = $('.folders-list', that.printEl);
		var is_exists_root = rootEl.length;

        var item, el, s_el, group_title, group_counts, add_class, itemNext, isActive;

        var s = [];
        var activeFolderItem = {};

        var len = that.folders.length;

        var is_show_updates_only = that.popup_options['reader']['show_updates_only'];

    	if (len) {
    		for (var ii=0; ii < len; ii++) {
    			item = that.folders[ii];

    			if (item.primaryKey == -1) {
    				continue;
    			}

    			add_class = "";

    			group_title = item.title;
    			if (item.primaryKey == 1) {
    				group_title = 'All items';
    			}

    			group_counts = (!is_show_updates_only) ? item.countsNew : item.counts;
    			if (that.under_type == 'new') {
    	    		group_counts = item.countsNew;
    			}
    			if (that.under_type == 'star') {
    	    		group_counts = item.countsStar;
    			}

    			if (!group_counts && item.primaryKey != 1) {
                    add_class += ' dn';
    			}

                if (!item.root_id) {
                    add_class += ' view-folder-main-root';
                }
                if (item.root_id) {
                    add_class += ' view-folder-scroll';
                }

                if (0&&item.subscribe) {
        	        add_class += ' '+that.class_forum_subscribe;
        	    }

                isActive = that.popup_options.reader.filter['activeItem']['primaryKey'] == item.primaryKey && that.popup_options.reader.filter['activeItem']['type'] == 'folder';
                if (isActive) {
                	activeFolderItem = item;
                }

                s_el = '<ul data-id="'+item.primaryKey+'" id="folder-one-'+item.primaryKey+'" class="view-folder-root openClose '+add_class+'">\
                              <li class="view-folder-one view-folder-one-level-1">\
                                <div class="view-folder-one-container buttonHide_root '+(isActive ? ' active' : '')+'">\
                                  <div class="view-folder-one-header">\
                    ';

                if (item.root_id) {
                    s_el += '\
                            <div class="openCloseButton __openCloseButtonOff '+(item.is_open ? ' openCloseButtonClose' : '')+' fl">\
                              <input class="icon fr opened" name="submit" type="submit" value="" />\
                            </div>\
                    ';
                }

                s_el += '\
                           <a class="view-folder-one-title'+(!group_counts ? ' folder-empty-counts' : '')+'" href="#" title="'+that.escape(item.title)+'" data-folder_id="'+item.primaryKey+'" data-id="'+item.primaryKey+'" data-type="folder">\
                            <span class="folder-title">\
                             '+group_title+'\
                            </span>\
                            <span class="folder-counts item-counts">\
                             <b>'+(!item.countsNew ? '&nbsp;' : item.countsNew)+'</b>\
                            </span>\
                           </a>\
                          <b class="menu-actions'+(item.primaryKey == 1 ? '' : ' dn')+'" title="Menu">&#9660;</b>\
                         </div>\
                       </div>\
                ';

                s_el += '\
                  <ul class="view-folder-root openClose">\
                ';

                if (!is_exists_root) {
                    s.push(s_el);
                } else {
                	el = rootEl.find('#folder-one-'+item.primaryKey);
                	if (!el.length) {
                		//!!! добавлять

                	} else {
                		if (!group_counts) {
                			if (item.primaryKey != 1) {
	                			el.addClass('dn');
	                		} else {
	                			el.removeClass('dn');
	                		}
                			el.find('.item-counts b').html('&nbsp;');
                		} else {
                			el.removeClass('dn');
                			el.find('.item-counts b').html(!item.countsNew ? '&nbsp;' : item.countsNew);
                		}
                	}
                }

                for (var jj=0; jj < item.innerList.length; jj++) {
                	var e = item.innerList[jj];

                	feed_counts = (!is_show_updates_only) ? e.countsNew : e.counts;
                	if (that.under_type == 'new') {
        	    		feed_counts = e.countsNew;
                	}
                	if (that.under_type == 'star') {
        	    		feed_counts = e.countsStar;
                	}

                    isActive = that.popup_options.reader.filter['activeItem']['primaryKey'] == e.primaryKey && that.popup_options.reader.filter['activeItem']['type'] == 'feed';
                    if (isActive) {
                    	activeFolderItem = e;
                    }

                    s_el = '\
                        <li id="subscription-one-'+e.primaryKey+'" class="view-subscriptions-one'+(!feed_counts && !is_show_updates_only ? ' dn' : '')+'">\
                         <div class="view-subscriptions-one-container buttonHide_root'+(isActive ? ' active' : '')+'">\
                          <div class="view-subscriptions-one-header">\
                           <a class="view-subscriptions-one-title {$item.no_counts_class}" href="#" title="'+that.escape(e.title)+'" data-folder_id="'+e.folder_id+'" data-id="'+e.primaryKey+'" data-type="feed">\
                            <span class="forum-icon">\
                             <img title="" src="http://s2.googleusercontent.com/s2/favicons?domain='+e.domain+'&alt=feed" />\
                            </span>\
                            <span class="forum-title">\
                             '+e.title+'\
                            </span>\
                        ';

                    if (0&&e.image_url) {
                        s_el += '\
                                <span class="forum-image">\
                                 <img title="" src="'+e.image_url+'" />\
                                </span>\
                            ';
                    }

                    s_el += '\
                            <span class="forum-counts item-counts">\
                             <b>'+(!e.countsNew ? '&nbsp;' : e.countsNew)+'</b>\
                            </span>\
                           </a>\
                          </div>\
                         </div></li>\
                        ';

                    if (!is_exists_root) {
                        s.push(s_el);
                    } else {
                    	el = rootEl.find('#subscription-one-'+e.primaryKey);
                    	if (!el.length) {
                    		//!!! добавлять

                    	} else {
                    		if (!feed_counts) {
                    			if (!is_show_updates_only) {
	                    			el.addClass('dn');
	                    		} else {
	                    			el.removeClass('dn');
	                    		}
                    			el.find('.item-counts b').html('&nbsp;');
                    		} else {
                    			el.removeClass('dn');
                    			el.find('.item-counts b').html(!e.countsNew ? '&nbsp;' : e.countsNew);
                    		}
                    	}
                    }
                }

                if (!is_exists_root) {
                    s.push('\
                      </ul>\
                    ');

                    s.push('\
                        </li>\
                        </ul>\
                    ');
                }
    		}
    	}

    	return {
    		"arr" : s,
    		"activeFolderItem" : activeFolderItem
    	};
    },

    author_print : function(item, feed_host) {
    	var url = item.author_url;
    	if (feed_host == 'habrahabr.ru' && !url) {
			url = 'http://habrahabr.ru/users/'+item.author+'/';
    	}
        if (feed_host.indexOf('.livejournal.com') != -1 && !url) {
			url = 'http://'+item.author+'.livejournal.com';
    	}

    	var email = (!item.author_email ? '' : ' ('+item.author_email+')');

    	var s = (!url ? item.author + email : '<a href="'+url+'" target="_blank" title="'+url+'">'+item.author+email+'</a>')

    	return s;
    },

    item_dates_print : function(item) {
        var s = [];

        s.push('<li class="topic-date">');

        s.push('<abbr title="Published: '+this.date_format_simply(item.datetime, 1)+'" class="published">');
        s.push(this.date_format_simply(item.datetime));
        s.push('</abbr>');
        s.push('<br />');

        if (item.datetime != item.time_load) {
            s.push('<abbr title="Recieved: '+this.date_format_simply(item.time_load, 1)+'" class="recieved">');
            s.push(this.date_format_simply(item.time_load));
            s.push('</abbr>');
        }

        s.push('</li>');

    	return s.join('');
    },

    enclosure_print : function(item, text) {
        var that = this;

    	var cats = item.enclosure;
    	if (!cats) return "";

    	cats = JSON.parse(cats);

    	if (cats && !cats.length) return "";

    	var s = [];
    	s.push('<ul class="topic-one-enclosure-list">');
    	var i, l = cats.length, e, url, type, title, len, ee, is_audio, is_video, is_flash, is_image, is_use_iframe, $width, $height, $isBig;
    	for (i=0; i < l; i++) {
    		e = cats[i];

	    	if (typeof e === 'object' && e.length > 2) {
		    	s.push('<li class="item-one-file">');

	    		url = e[0];
	    		type = e[1];
	    		len = e[2];
	    		title = e[3] || "";
	    		if (!title) {
	    			ee = url.split(/\//i);
	    			if (ee) {
	    				title = ee[ee.length-1];
	    				title = title.replace(/%20/ig, ' ');
	    			}
	    		}

	    		var lenKb = len;
	    		var lenSuff = "bytes";
	    		if (len >= 1024) {
		    		lenKb = Math.round(len/1024);
		    		lenSuff = 'Kb';
    	    		if (lenKb >= 1024) {
    		    		lenKb = Math.round(lenKb/1024);
			    		lenSuff = 'Mb';
        	    		if (lenKb >= 1024) {
        		    		lenKb = Math.round(lenKb/1024);
    			    		lenSuff = 'Gb';
        	    		}
    	    		}
	    		}

    	    	s.push('<a href="'+url+'" title="'+url+'" target="_blank">'+title+'</a> <i>'+type+'</i> '+(!lenKb ? '' : '<b>'+lenKb+' '+lenSuff+'</b>')+'');

    	    	is_image = type == 'image/jpeg' || type == 'image/jpg' || type == 'image/gif' || type == 'image/png';
        	   	if (is_image && (text+'').indexOf('src="'+url+'"') == -1) { //!!! регистр делать  маленьким
                    s.push('<br />');
	    	    	s.push('<img src="'+url+'" title="'+url+(!lenKb ? '' : '\n'+lenKb+' '+lenSuff)+'" />');
                }

    	    	is_audio = type == 'audio/mpeg';
        	   	if (is_audio) {
                    s.push('<br />');
                    s.push('<audio controls preload="none">');
                    s.push('<source type="'+type+'" src="'+url+'" />');
                    s.push('</audio>');
                }

    	    	is_video = type == 'video/mp4' || type == 'video/x-m4v';
        	   	if (is_video) {

     				is_use_iframe = false;
     				if (url.substr(0, 16) == 'http://vimeo.com') {
     					url = 'http://player.vimeo.com/video/'+url.substr(17)+'?fullscreen=1&amp;show_title=0&amp;show_byline=0&amp;show_portrait=0&amp;autoplay=0';
    	 				is_use_iframe = true;
     				}

     				if (url.substr(0, 31) == 'http://www.youtube.com/watch?v=') {
     					//url = 'http://www.youtube.com/embed/'+url.substr(31); //that.urlencode
     					url = 'https://www.youtube.com/v/'+url.substr(31)+'?version=3&amp;hl=en_US';
    	 				is_use_iframe = true;
     				}

                    s.push('<br />');

                    if (!is_use_iframe) {
	                    s.push('<video controls width="400" height="300" preload="none">'); //poster="'+img+'"
    	                s.push('<source type="'+type+'" src="'+url+'" />');
        	            s.push('</video>');
        	        } else {
    	                //s.push('<iframe class="video" src="'+url+'" frameborder="0" allowfullscreen></iframe>');

    	                s.push('<object class="video">');
    	                s.push('<param name="movie" value="'+url+'"></param>');
    	                s.push('<param name="allowFullScreen" value="true"></param>');
    	                s.push('<param name="allowscriptaccess" value="always"></param>');
    	                s.push('<embed src="'+url+'" type="application/x-shockwave-flash" allowscriptaccess="always" allowfullscreen="true"></embed>');
    	                s.push('</object>');
        	        }
                }

    	    	is_flash = type == 'application/x-shockwave-flash';
        	   	if (is_flash) {
                    s.push('<br />');
                    s.push('<iframe src="'+url+'" height="320" width="500" frameborder="0" allowfullscreen></iframe>');

                    /*
                    s.push('<object align="middle" width="400" height="326">'); //poster="'+img+'"
                    s.push('<param name="allowScriptAccess" value="never">');
                    s.push('<param name="allowFullScreen" value="true">');
                    s.push('<param name="wmode" value="transparent">');
                    s.push('<param name="movie" value="'+url+'">');
                    s.push('<embed width="400px" height="326px" type="application/x-shockwave-flash" src="'+url+'" allowscriptaccess="never" allowfullscreen="true" quality="best" bgcolor="#ffffff" wmode="transparent" flashvars="playerMode=embedded" pluginspage="http://www.macromedia.com/go/getflashplayer" style="display: none !important;">');
                    s.push('</object>');
                    */
                }

    	    	s.push('</li>');
	    	}
    	}
    	s.push('</ul>');

    	return s.join('');
    },

    make_link_abs : function(base, rel) {
		var ret = base;

		if (rel.substr(0, 1) == '#') {
			ret += rel;
		} else {
			var bp = this.parse_url(base);
			ret = bp.scheme + '://' + bp.host + rel;
		}

		return ret;
    },

    comments_print : function(item) {
    	var cmt_link = item.comments_link;
    	var cmt_count = item.comments_count;
    	if ((!cmt_link || (cmt_link && cmt_link.indexOf('://') == -1)) && !cmt_count) return "";

    	cmt_link = cmt_link || item.link || item.guid;

    	if (cmt_link.indexOf('://') == -1) {
			cmt_link = this.make_link_abs(item.link, cmt_link);
    	}

    	var s = [];
    	s.push('<div class="item-one-comment-link"><a href="'+cmt_link+'" title="'+cmt_link+'" target="_blank">Comments</a>'+(!cmt_count ? '' : ' <b>('+cmt_count+')</b>')+'</div>');

    	return s.join('');
    },

    geo_print : function(item) {
    	var c = item.geo;
    	if (!c) return "";

    	c = JSON.parse(c);

    	var s = [], e, crds, params = [], i, l, r;

    	params.push('zoom=9');

    	s.push('<div class="item-one-geo">');

    	if (typeof c.point != 'undefined') {
    		e = c.point.split(/\s/i);
    		crds = this.urlencode(e.join(', '));
	    	s.push('<a class="geo-point" href="https://maps.google.com/maps?q='+crds+'&sll='+crds+'" title="" target="_blank">'+c.point+'</a>');

	    	params.push('markers=size:small%7Ccolor:yellow%7Clabel:S%7C'+crds); //center='+crds+'&zoom=3&
	    }
    	if (typeof c.line != 'undefined') {
    		e = c.line.split(/\s/i);
    		crds = [];
    		l = e.length;
    		for (i=0; i < l; i+=2) {
       			crds.push(e[i] + ',' + e[i+1]);
    		}

	    	params.push('path=color:0x0000ff|weight:5|'+crds.join('|'));
	    	s.push('<a class="geo-line" href="https://maps.google.com/maps?q='+crds+'&sll='+crds+'" title="" target="_blank">Track of '+c.line.length+' points</a>');
	    }

    	s.push('<img class="geo-map-img" src="https://maps.googleapis.com/maps/api/staticmap?size=325x300&maptype=roadmap&'+params.join('&')+'&sensor=false" title="" />');
    	s.push('</div>');

    	return s.join('');
    },

    feed_image_print : function(feed_data, print_please) {
        var image_url = "";
        if (this.popup_options.reader.filter['activeItem']['type'] == 'folder' || print_please) {
            image_url = feed_data.image_url;
            if (image_url && image_url.indexOf('://') == -1) {
            	image_url = 'http://' + feed_data['domain'] + image_url;
            }

            if (image_url) {
            	image_url = '<li class="topic-feed-img"><img src="'+image_url+'" title="From feed:\n'+feed_data.title+'" /></li>';
            }
        }
    	return image_url;
    },

    category_print : function(item, feed_host) {
    	var cats = item.category;
    	if (!cats) return "";

    	cats = JSON.parse(cats);

    	if (cats && !cats.length) return "";

    	var s = [];
    	s.push('<ul class="topic-one-category">');
    	var i, l = cats.length, e, url, title, tag;
    	for (i=0; i < l; i++) {
    		e = cats[i];

	    	s.push('<li>');

	    	if (typeof e === 'object' && e.length == 2) {
	    		tag = e[0];
	    		title = e[1];
	    	} else {
	    		tag = e;
	    		title = e;
	    	}

        	if (feed_host == 'habrahabr.ru') {
    			url = 'http://habrahabr.ru/search/?q='+tag+'&target_type=posts';
        	}
            if (feed_host.indexOf('.livejournal.com') != -1) {
    			url = 'http://'+feed_host+'/tag/'+tag;
        	}
	    	s.push(!url ? '<a href="/category/'+tag+'/">'+title+'</a>' : '<a href="'+url+'" target="_blank" title="'+url+'">'+title+'</a>');

	    	s.push('</li>');
    	}
    	s.push('</ul>');

    	return s.join('');
    },

    events_print_array : function(c) {
        var that = this;

        var add_class,
        	add_class2,
        	aa,
        	full_text_in,
        	text_in,
        	is_have_cmt,
        	comments_link,
        	comments_link_mini,
        	comment_title,
        	is_sub_add_class,
        	title,
        	text_parent,
        	track_comments,
        	track_comments_len,
        	tritem,
        	pic_sm,
        	tt,
        	no_counts_class,
        	item_host,
        	tri;

        var add_html = '',
        	group_title = '',
        	feed_counts,
        	isActive,
        	group_url,
        	feed_data,
        	feed_title,
        	p0, p1, p2, p3,
        	itemNext;

        var i, len = c.length, item;
        var arr = [];

        if (len) {
            for (i=0; i < len; i++) {
                item = c[i];

                itemNext = (i+1 < len) ? c[i+1] : null;

                add_class = '';
                if (item['New'] != 0) {
                   add_class += ' item-one-new';
                } else {
                   add_class += ' topic-one-readed';
                }
                if (item['star'] != 0) {
                   add_class += ' topic-starred';
                }

                is_have_cmt = (typeof item['countComments'] != 'undefined' && item['countComments']);
                comments_link_mini = '<a class="comments-link item-one-link-popup'+(!is_have_cmt ? ' dn' : '')+'" href="'+item['href']+'" target="_blank">('+item['countComments']+')</a>';
                comments_link = '<a class="comments-link item-one-link-popup'+(!is_have_cmt ? ' dn' : '')+'" href="'+item['href']+'" target="_blank">Комментарии ('+item['countComments']+')</a>';
                comment_title = 'E-mail';

                tt = textlinks2ankers(item.textImg);
                //<!--div class="item-one-full-text">'+tt+'<div class="item-one-full-text-button"><i></i><a href="#" title="Весь текст"></a></div></div-->\

                text_in = "";
                text_parent = "";

                var feed_data = that.feed_get(item);
                var feed_host = that.feed_host_get(feed_data);
                var feed_title = feed_data['title'];

                var item_link = (!item.link ? item.guid : item.link);
                if (item_link.indexOf('://') == -1) {
                	item_link = 'http://' + feed_data['domain'] + item_link;

                	item.link = item_link;
                }

                item_host = this.url_domain_get(item_link);

                arr.push('<li data-primaryKey="'+item.primaryKey+'" id="topic-one-'+item.primaryKey+'" class="item-one topic-one'+add_class+'">\
                            <a class="topicAnker" id="topicAnker'+item.primaryKey+'" href="/"></a>\
                              <div class="topic-one-container">\
                              <div class="topic-one-header">\
                               <ul class="topic-one-hcard" title="">\
                                <li class="topic-icon">\
                                 <img title="" src="http://s2.googleusercontent.com/s2/favicons?domain='+item_host+'&alt=feed" />\
                                </li>\
                                <li class="topic-one-title">\
                                 <a href="'+item_link+'" target="_blank">'+that.escape(!item.title ? item_link : item.title)+'</a>\
                                </li>\
                               '+that.item_dates_print(item)+'\
                               '+that.feed_image_print(feed_data)+'\
                               </ul>\
                               '+that.comments_print(item)+'\
                               '+that.geo_print(item)+'\
                               <ul class="topic-from">\
                                <li class="topic-from-forum">\
                                 from \
                                 <a data-id="'+item.feed_id+'" data-type="feed" class="topic-from-anker" href="/view/forum/'+item.feed_id+'/">'+feed_title+'</a>\
                                </li>\
                                <li class="topic-from-author'+(!item.author ? ' dn' : '')+'">\
                                 by '+that.author_print(item, feed_host)+'\
                                </li>\
                               </ul>\
                               '+that.category_print(item, feed_host)+'\
                              </div>\
                              '+that.enclosure_print(item, tt)+'\
                              <article>\
            	');

                arr.push('\
                                <div class="topic-text topic-comment-text">\
                                  '+tt+'\
                                </div>\
                              </article>\
                            <ul class="topic-actions">\
                             <li class="topic-actions-keepread">\
                               <input name="submit" type="submit" value="Keep unread" />\
                             </li>\
                             <!--li class="topic-actions-email">\
                               <input name="submit" type="submit" value="E-mail" />\
                             </li-->\
                             <li class="topic-actions-star">\
                               <input name="submit" type="submit" value="Star" />\
                             </li>\
                            </ul>\
                          </div>\
                          </li>\
            	');

            }
        }

        return arr;
    },

    print_events : function(page, sortType, filters) {
        var that = this;

        if (!that.folders.length) {
	    	that.func_sendMessage("feeds_get", 0, "", function(data) {
       		    that.forum_active_set(data['forum_active_id']);

       		    that.folders = data['list'];

    			that.print_events(page, sortType, filters);
	    	});

        	return;
        }

        var folders_arr = [];

   	    var ret = that.folders_print();
   	    var s = ret['arr'];

   	    if (s.length) {
			folders_arr.push('<div class="folders-list"><div class="subscriptionsList">'+s.join('')+'</div></div>');
		}

    	var activeFolderItem = that.folders_get_activeItem(that.popup_options.reader.filter['activeItem']);
       	var activeMode = activeFolderItem['activeMode'];

       	var countsItems = activeFolderItem["counts"];
       	if (activeMode == 0) {
	    	countsItems = activeFolderItem["countsNew"];
       	}
       	if (activeMode == 2) {
	    	countsItems = activeFolderItem["countsStar"];
       	}

        var c = that.array;
        var lenAll = c.length;
        var item, i, h;

        var g;

        var onPage = 20;

        if ((page-1)*onPage >= lenAll && lenAll > 0) {
            page = Math.ceil(lenAll/onPage);
            if (!page) page = 1;
        }

        var arr = [],
            sort_arr = [],
            pager_arr = [];

        var $itemList = $('.item-list', this.printEl);
        var mCSB_container = $itemList.find('.mCSB_container');
        if (mCSB_container.length) {
        	$itemList = mCSB_container;
        }

        var startPos, max_len;
	    startPos = (!onPage) ? 0 : (page-1)*onPage;
	    max_len = (!onPage) ? lenAll : Math.min(onPage, lenAll-startPos);

        var needToLoadMore = false;
        if (countsItems && !c.length) {
	        needToLoadMore = true;
        }

        var itemsToDraw = [];
        if (c.length) {
            for (i=startPos; i < startPos+max_len; i++) {
            	if (typeof c[i] == 'undefined') {
            		needToLoadMore = true;
            		break;
            	}
                itemsToDraw.push(c[i]);
            }
        } else {
        	startPos = 0;
        }

        if (needToLoadMore) {
	        mprint('needToLoadMore = '+needToLoadMore);

            that.reader_data_get(page, sortType, filters, 0, function(arr, countAll) {

            	if (!arr.length) {
                   	mprint('!!!!! print_events() second cycle call, page='+page);

                    arr = arr.concat(folders_arr);

            	    that.printEl.html(arr.join(''));
            	    that.folders_set_handlers();

                   	return false;
            	}

    			return that.print_events(page, sortType, filters);
            });

            return;
        }

        var filter_arr = [], filter_html = '';

        var add_class,
        	add_class2,
        	aa,
        	full_text_in,
        	text_in,
        	is_have_cmt,
        	comments_link,
        	comments_link_mini,
        	comment_title,
        	is_sub_add_class,
        	title,
        	text_parent,
        	track_comments,
        	track_comments_len,
        	tritem,
        	pic_sm,
        	tt,
        	no_counts_class,
        	item_host,
        	tri;

        var add_html = '',
        	group_title = '',
        	feed_counts,
        	isActive,
        	group_url,
        	feed_data,
        	feed_title,
        	p0, p1, p2, p3,
        	itemNext;

        var len = itemsToDraw.length;

        var headerHtml = [];
        if (activeFolderItem) {
            headerHtml.push('<div id="feed-header">');

            headerHtml.push(that.feed_image_print(activeFolderItem, true));

            headerHtml.push('<div class="counts-button-root">');
            headerHtml.push('<a data-mode="0" class="counts-button counts-button-new'+(activeMode == 0 ? ' selected' : '')+'" href="/list/new/">New <b>'+activeFolderItem.countsNew+'</b></a>');
            headerHtml.push('<a data-mode="1" class="counts-button counts-button-all'+(activeMode == 1 ? ' selected' : '')+'" href="/list/all/">All <b>'+activeFolderItem.counts+'</b></a>');
            headerHtml.push('<a data-mode="2" class="counts-button counts-button-star'+(activeMode == 2 ? ' selected' : '')+'" href="/list/star/">Star <b>'+activeFolderItem.countsStar+'</b></a>');

            headerHtml.push('&nbsp;&nbsp;&nbsp;');
            headerHtml.push('<a class="feed-mark-read-button" href="/mark_read/all/">Mark all read</a>');
            headerHtml.push('</div>');

            if (typeof activeFolderItem.url != 'undefined') {
    	        headerHtml.push('<a class="feed-header-title" href="'+that.escape(activeFolderItem.url)+'" target="_blank">');
            } else {
    	        headerHtml.push('<h2 class="feed-header-title">');
            }

            headerHtml.push(activeFolderItem.title);

            if (typeof activeFolderItem.url != 'undefined') {
    	        headerHtml.push(' »</a>');
            } else {
    	        headerHtml.push('</h2>');
            }

            headerHtml.push('</div>');
        }

        if (!len) {
            arr.push('<div class="item-list topic-list">');
            arr.push(headerHtml.join(''));
            arr.push('<div class="item-list-empty">');
            arr.push('No more new items');
            arr.push('</div></div>');
        } else {

            arr.push('<div class="item-list topic-list">');
            arr.push(headerHtml.join(''));
            arr.push('<ul>');

            arr = arr.concat(that.events_print_array(itemsToDraw));

            arr.push('</ul>');

            if (onPage > 0) {
    	        that.print_pager_ordinal(pager_arr, page, Math.ceil(lenAll/onPage), 3);
                that.page_active = page;
                that.page_update_notify(that.group_id_active, page);
            }

            arr = arr.concat(pager_arr);

            arr.push('</div>');
        }

        arr = arr.concat(folders_arr);
        arr = arr.concat(sort_arr);
        arr = filter_arr.concat(arr);

        if (!$itemList.length) {
	        this.printEl.html(arr.join(''));
	        that.folders_set_handlers();

        } else {
        	$itemList.replaceWith(arr.join(''));
        }

        //!!! one time
        that.window_resize(true);
        that.set_handlers();


        $('.openCloseButton:not(.openCloseButtonOff)', this.printEl)
          .unbind('click').bind('click', function() {
             var el = $(this);

             if (el.hasClass('openCloseButton_isEmpty')) return false;

             var toggleClass = 'openCloseButtonClose';
             var typeButton = el.hasClass(toggleClass)?'close':'open';
             el.toggleClass(toggleClass);

             var toggleClassIcon = 'opened';
             el.find('.icon').toggleClass(toggleClassIcon);

             var elParent = el.parent();
             var closeOpenEl = elParent.find('> .openClose');
             if (!closeOpenEl.length) {
                 elParent = elParent.parent().parent();
                 closeOpenEl = elParent.find('> .openClose');
             }

             closeOpenEl.toggleClass('dn');

             if (typeButton == 'close') {
                if (!closeOpenEl.find('li').length) {
                    //var id = parseInt(elParent[0].className.match(/subscriptions-one-(\d+)/i)[1]);
                }
             }

             return false;
        });


        $('.pager-nav a', this.printEl)
         .unbind('click').bind('click', function() {
            var el = $(this);
            var pageSet = parseInt(this.href.replace(/.*?\/page,(\d+)\/.*$/, '$1'));

            that.print_events(pageSet, that.sortType, that.popup_options.reader.filter);

            var $itemList = $('.item-list > ul', that.printEl);

            if ($itemList.length) {
                $itemList[0].scrollTop = 0;
            }

            return false;
        });



        $('.msgs-filters input, .msgs-filters select', this.printEl)
         .unbind('change').bind('change', function() {
            var el = $(this);

            $('.msgs-filters input[type=checkbox]', that.printEl).each(function(index, item) {
            	that.filters[item.name] = !item.checked ? 0 : 1;
            });
            $('.msgs-filters input[type=text]', that.printEl).each(function(index, item) {
            	that.filters[item.name] = item.value;
            });
            $('.msgs-filters select', that.printEl).each(function(index, item) {
            	that.filters[item.name] = item.value;
            });

            that.filter_update(that.filters, function() {
                that.reader_update();
            });

        });

        /*
        $('.sort-control', this.printEl)
         .bind('click', function() {
            var el = $(this);

            var sortNotDate = (that.under_type == 'new' || that.under_type == 'del' || that.under_type == 'all') ? 'parent_karma' : 'karma';

            var sortType = that.sortType == 'datetime' ? sortNotDate : 'datetime';

            el.removeClass('sort-control-datetime sort-control-'+sortNotDate);
            el.addClass('sort-control-'+sortType);

            var i, c = that.array, len = c.length;
            for (i=0; i < len; i++) {
            	delete c[i];
            }

            that.print_events(that.page_active, sortType, that.filters);

            var $itemList = $('.item-list', that.printEl);
            if ($itemList.length) {
                $itemList[0].scrollTop = 0;
            }

            return false;
        });
        */

        //-------------
        $('.searchInput', this.printEl)
        	.unbind('click').bind('click', function() {
            	return false;
        	})
        	.unbind('keyup').bind('keyup', function(event) {
                var el = $(this);
                var elRoot = el.parent().parent().parent();

                //-------
	            var text = el[0].value;
                that.search_text = text;

                //---
                if (event.keyCode == 13)  {
	               	that.search_text_update_notify(text);

	               	if (that.group_id_active != 100004) {
                    	$('#contact-one-100004 dt').trigger('click');
                    }

                    setTimeout(function() {
                    	$('input[type=submit]', elRoot).trigger('click');
                    }, 100);
                }

            	return false;
        	});

        //fancyInit($('.item-one-text-parent, .item-one-text, .item-one-full-text'), this.printEl);

        //-------------
        $('[name=forum_search]', this.printEl)
        	.unbind('keyup').bind('keyup', function(event) {
                var el = $(this);

	            var text = $.trim(this.value);

                that.popup_options.reader.filter['forum_search'] = text;
                that.filter_update(that.popup_options.reader.filter, function() {
	                that.reader_update();
                });

            	return false;
        });



        //-------------
        /*
        $('.item-one-full-text-button a', this.printEl)
            .unbind('mouseup').bind('mouseup',
        	function() {

                var el = $(this);
                var button = el.parent();
                var root = button.parent();

                el.unbind('mouseup');

                root.addClass('item-one-full-text-visible-all');
                button.remove();

            	return false;
        	}
        );
        */

        $('.topic-from-anker', that.printEl)
            .unbind('click').bind('click', function(event) {
                var el = $(this);
                var feed_id = parseInt(this.getAttribute('data-id'));
		        $('#subscription-one-'+feed_id+' .view-subscriptions-one-title', this.printEl).trigger('click');
                return false;
        	}
       	);

        //--------
        $('.counts-button', this.printEl).off('click').on('click', function() {
            var el = $(this);

            var activeMode = parseInt(this.getAttribute('data-mode'));

            var activeItem = that.popup_options.reader.filter['activeItem'];

        	var c = that.folders, j, ci;
        	if (c.length) {
        		j = get_el_by_field(c, 'primaryKey', activeItem['folder_id']);
        		if (j != -1) {
        			c = c[j];
        			ci = c['innerList'];

        			if (activeItem['type'] == 'feed' && ci && ci.length) {
        				c = ci;
                		j = get_el_by_field(c, 'primaryKey', activeItem['primaryKey']);
                		if (j != -1) {
                			c = c[j];
		        			c['activeMode'] = activeMode;
                		}
        			} else {
	        			c['activeMode'] = activeMode;
        			}
        		}
        	}

            that.func_sendMessage("mode_set", 0, {"item" : activeItem, "activeMode" : activeMode}, function() {
	            that.reader_update();
            });

            return false;
        });
        //--------
        $('.feed-mark-read-button', this.printEl).off('click').on('click', function() {
            var el = $(this);

            var activeItem = that.popup_options.reader.filter['activeItem'];

            that.func_sendMessage("mark_read", 0, {"item" : activeItem}, function() {
            	that.folders_refresh();
			    that.reader_update();
            });

            return false;
        });

        //--------
        $('.item-one.forum-list-one', this.printEl)
         .unbind('click').bind('click', function(event) {
         	if (event.ctrlKey) {
         		return true;
         	}

            var el = $(this);
            var elRoot = el;
            var group_id = parseInt(elRoot[0].getAttribute('data-id'));

            var c = that.array, e;
            var i = get_el_by_field(c, 'primaryKey', group_id);
            if (i != -1) {
            	e = c[i];

            	if (!e.innerList && !e.root_id) return true;

                $('.item-one.forum-list-one .view-folder-one-container').removeClass('active');
                elRoot.find('.view-folder-one-container').addClass('active');

                var reLoad = true;
                that.forums_inner_print(group_id, 0, false, reLoad);
            }
            return false;
        });

        if (that.under_type == 'list') {
        	var forum_id_click = that.forum_active;
        	that.forum_active = 0;
            $('#forum-list-one-'+forum_id_click+'').trigger('click');
            that.forum_list_scroll(that.forum_active);
        }

        //==============
        $itemList = null;
        itemsToDraw = null;
        arr = null;
        pager_arr = null;
    },

    subs_data_load : function(sortType, filters, get_handler) {
        var that = this;

	    that.func_sendMessage("feeds_get", 0, "", function(data) {
       	    that.forum_active_set(data['forum_active_id']);
	    	get_handler(data['list']);
	    });
    },

    subs_update : function() {
        var that = this;

	    this.subs_data_load(this.sortType, that.popup_options.subs.filter, function(c, countAll) {
       	    that.folders = c;
	        that.print_subs(that.sortType, that.popup_options.subs.filter);
	    });
    },

    print_subs : function(sortType, filters) {
        var that = this;

	    if (!window) return false;

        var c = that.folders;
        var lenAll = c.length;
        var item, i, h;

        var g;

        var arr = [],
            sort_arr = [];

        var $itemList = $('.forum-list', this.printEl);
        var mCSB_container = $itemList.find('.mCSB_container');
        if (mCSB_container.length) {
        	$itemList = mCSB_container;
        }

        var is_was_draw_list = $itemList.length;
        var itemsList = (!is_was_draw_list) ? $([]) : $('.item-one', $itemList);

        var startPos = 0, max_len = lenAll;

        var needToLoadMore = false;//!c.length ? true : false;
        var is_rss_list = 1;

        if (!c.length && is_rss_list) {
	        needToLoadMore = true;
        }

        var itemsToDraw = [];
        if (c.length) {
            for (i=startPos; i < startPos+max_len; i++) {
            	if (typeof c[i] == 'undefined') {
            		needToLoadMore = true;
            		break;
            	}
                itemsToDraw.push(c[i]);
            }
        } else {
        	startPos = 0;
        }

        if (!that.folders.length) {
	    	that.func_sendMessage("feeds_get", 0, "", function(data) {
       		    that.forum_active_set(data['forum_active_id']);

       		    that.folders = data['list'];

    			that.print_subs(sortType, filters);
	    	});

        	return;
        }

        if (needToLoadMore) {
	        mprint('needToLoadMore = '+needToLoadMore);
            return;
        }

        var filter_arr = [], folders_arr = [], filter_html = '';

        filter_html += '<input type="text" name="forum_search" value="'+that.escape(!filters['forum_search'] ? '' : filters['forum_search'])+'" placeholder="Быстрый поиск" />';

        filter_html += '<div id="forums-sort">';
        filter_html += '<select name="forum_sort" title="Сортировка">';
        filter_html += '<option value="title"'+(filters.forum_sort == 'title'? ' selected' : '')+'>Название</option>';
        filter_html += '<option value="timeAdd"'+(filters.forum_sort == 'timeAdd'? ' selected' : '')+'>Дата</option>';
        filter_html += '<option value="rait_people"'+(filters.forum_sort == 'rait_people'? ' selected' : '')+'>Посетители</option>';
        filter_html += '<option value="rait_answer"'+(filters.forum_sort == 'rait_answer'? ' selected' : '')+'>Ответы</option>';
        filter_html += '</select>';
        filter_html += '<input type="checkbox" name="forum_sort_desc" title="Обратная сортировка"'+(!filters.forum_sort_desc ? '' : ' checked')+' />';
        filter_html += '</div>';

        filter_html += '<a id="export-opml" href="/export/opml/" title="Export to OPML"></a>';

    	filter_arr.push('<div class="msgs-filters">'+filter_html+'</div>');


        var add_class,
        	add_class2,
        	aa,
        	full_text_in,
        	text_in,
        	is_have_cmt,
        	comments_link,
        	comments_link_mini,
        	comment_title,
        	is_sub_add_class,
        	title,
        	text_parent,
        	track_comments,
        	track_comments_len,
        	tritem,
        	pic_sm,
        	tt,
        	no_counts_class,
        	item_host,
        	tri;

        var add_html = '',
        	group_title = '',
        	feed_counts,
        	isActive,
        	group_url,
        	feed_data,
        	feed_title,
        	p0, p1, p2, p3,
        	itemNext;

        var len = itemsToDraw.length;

        if (!len) {
            arr.push('<div class="item-list forum-list">');
            arr.push('<div class="item-list-empty">');
            arr.push('No more feeds');
            arr.push('</div></div>');
        } else {

            arr.push('<div class="item-list forum-list">');
            arr.push('<ul>');

            for (i=0; i < len; i++) {
                item = itemsToDraw[i];

                itemNext = (i+1 < len) ? itemsToDraw[i+1] : null;

                group_title = item.title;
                group_logo = '';

                group_counts = (!item.innerList) ? 0 : item.innerList.length;

                add_class = ' forum-list-one-root forum-list-one-type-'+(!item.root_id ? 0 : 1);

                if (item.root_id) {
    	            add_class += ' forum-list-one-inner';
                }

                if (item.subscribe) {
        	        add_class += ' '+that.class_forum_subscribe;
        	    }

                if (!itemNext || (itemNext && !itemNext.root_id)) {
    	            add_class += ' forum-list-one-inner-last';
                }

                arr.push('<li data-id="'+item.primaryKey+'" id="forum-list-one-'+item.primaryKey+'" class="item-one forum-list-one '+add_class+'">\
                            <div class="view-folder-one-container'+(that.forum_active == item.primaryKey ? ' active' : '')+'">\
                              <div class="view-folder-one-header">\
                                <a class="view-folder-one-title'+(!group_counts ? ' folder-empty-counts' : '')+'" href="#" title="'+that.escape(item.title)+'">\
                                 <span class="folder-title">\
                                  '+group_title+'\
                                 </span>\
                                 <span class="folder-counts item-counts">\
                                  <b>'+(!group_counts ? '&nbsp;' : group_counts)+'</b>\
                                 </span>\
                                </a>\
                                <!--a href="/forum/'+item.primaryKey+'/delete/" class="forum-delete-action" title="Delete folder"></a-->\
                                <a href="/forum/'+item.primaryKey+'/subscribe/" class="forum-subscribe-action" title="Subscribe/unsibscribe"></a>\
                              </div>\
                            </div>\
                          </li>\
                          ');
            }

            arr.push('</ul>');

            that.print_sort_control(sort_arr, sortType);

            that.sortType = sortType;
            that.sort_update(sortType);

            arr.push('</div>');
        }

        var fEl = this.printEl.find('.msgs-filters');
        if (!fEl.length) {
	        arr = arr.concat(folders_arr);
	        arr = arr.concat(sort_arr);
	        arr = filter_arr.concat(arr);
	        this.printEl.html(arr.join(''));
        } else {
	        this.printEl.find('.item-list').replaceWith(arr.join(''));
        }

        //============================================
        $('#export-opml').unbind('click').bind('click', function() {
            var el = $(this);

            var tt = '    ';

            var s = [];
            s.push('<?xml version="1.0" encoding="UTF-8"?>\n');
            s.push('<opml version="1.0">\n');
            s.push(tt+'<head>\n');
            s.push(tt+tt+'<title>My subscriptions in readRss</title>\n');
            s.push(tt+'</head>\n');
            s.push(tt+'<body>\n');

            var c = that.folders, i, ii, e, ee, cc, l = c.length, ll;

            for (i=0; i < l; i++) {
            	e = c[i];

            	if (e.primaryKey < 0) {
            		continue;
            	}

            	if (e.primaryKey != 1) {
	                s.push(tt+tt+'<outline title="'+e.title+'" text="'+e.title+'">\n');
            	}

            	cc = e.innerList;
            	ll = cc.length;
            	if (ll) {
            		for (ii=0; ii < ll; ii++) {
            			ee = cc[ii];

		                s.push(tt+tt+tt+'<outline title="'+that.urlencode(ee.title)+'"\n');
		                s.push(tt+tt+tt+tt+' text="'+that.urlencode(ee.title_original)+'"\n');
		                s.push(tt+tt+tt+tt+' type="rss"\n');
		                s.push(tt+tt+tt+tt+' xmlUrl="'+that.urlencode(ee.link)+'" htmlUrl="'+that.urlencode(ee.url)+'" />\n');
            		}
            	}

            	if (e.primaryKey != 1) {
	                s.push(tt+tt+'</outline>\n');
            	}
            }

            s.push(tt+'</body>\n');
            s.push('</opml>');

            var opml_content = s.join('');
            s = null;

            var output = $('<output></output>').insertAfter(el);
            output = output[0];

            var cleanUp = function(a) {
                a.dataset.disabled = true;

                // Need a small delay for the revokeObjectURL to work properly.
                setTimeout(function() {
                    window.URL.revokeObjectURL(a.href);
                    $(a).remove();
                }, 1500);
            };

            var downloadFile = function(text, filename) {

				const MIME_TYPE = 'text/x-opml';
                window.URL = window.webkitURL || window.URL;

                var prevLink = output.querySelector('a');
                if (prevLink) {
                  window.URL.revokeObjectURL(prevLink.href);
                  output.innerHTML = '';
                }

                var bb = new Blob([text], {type: MIME_TYPE});

                var a = document.createElement('a');
                a.download = filename;
                a.href = window.URL.createObjectURL(bb);
                a.textContent = 'Download';

                a.dataset.downloadurl = [MIME_TYPE, a.download, a.href].join(':');
                a.draggable = true; // Don't really need, but good practice.
                a.classList.add('dragout');

                output.appendChild(a);

                a.onclick = function(e) {
                  if ('disabled' in this.dataset) {
                    return false;
                  }

                  cleanUp(this);
                };
            };

	        downloadFile(opml_content, "readRss."+(Date.now())+".opml");

            return false;
		});


        $('.msgs-filters input, .msgs-filters select', this.printEl)
         .unbind('change').bind('change', function() {
            var el = $(this);

            $('.msgs-filters input[type=checkbox]', that.printEl).each(function(index, item) {
            	that.filters[item.name] = !item.checked ? 0 : 1;
            });
            $('.msgs-filters input[type=text]', that.printEl).each(function(index, item) {
            	that.filters[item.name] = item.value;
            });
            $('.msgs-filters select', that.printEl).each(function(index, item) {
            	that.filters[item.name] = item.value;
            });

            that.filter_update(that.filters, function() {
                that.reader_update();
            });

        });

        //-------------
        $('[name=forum_search]', this.printEl)
        	.unbind('keyup').bind('keyup', function(event) {
                var el = $(this);

	            var text = $.trim(this.value);

                that.popup_options.subs.filter['forum_search'] = text;
                that.subs_filter_update(that.popup_options.subs.filter, function() {
        	        that.subs_update();
                });

            	return false;
        	});

        $('a.forum-subscribe-action', that.printEl)
            .unbind('click').bind('click', function(event) {
                var el = $(this);
                var elRoot = el.parent().parent().parent();

                var forum_id = parseInt(elRoot[0].getAttribute('data-id'));

                var c = that.array;
                var j = get_el_by_field(c, 'primaryKey', forum_id);
                if (j != -1) {
                	c = c[j];

	                var loadAdded = [];

                	if (!c['innerList']) {
    	                c['subscribe'] = !c['subscribe'] ? that.getCurrentTime() : 0;

    	                if (!c['activePage']) {
    	                	c['activePage'] = 1;
    	                }

			            if (0&&c['subscribe']) {
                        	loadAdded.push({
                        		"eventKey" 		: c['forum_id'],
                        		"msgType" 		: 'forum_filters_save',
                        		"objectType" 	: c['primaryKey'],
                        		"timeNextUpdate": c['subscribe'],
                        		"tryCount" 		: 10,
                            	"priority" 		: 3,
                        		"url" 			: '',
                        		"user_id" 		: 0,
                        		"datetime" 		: 0,
                        		"text"			: ''
                        	});
    		        	}

    			        that.array_update_notify([c]);
				        elRoot.toggleClass(that.class_forum_subscribe);
                	} else {
                		c = c['innerList'];
                		var l = c.length;
                		if (l) {
                			var is_exists_empty = false;
                			for (j=0; j < l; j++) {
                				if (!c[j]['subscribe']) {
                					is_exists_empty = true;
                					break;
                				}
                			}
                			if (!is_exists_empty) {
		    				    elRoot.removeClass(that.class_forum_subscribe);
                			} else {
		    				    elRoot.addClass(that.class_forum_subscribe);
                			}
                			for (j=0; j < l; j++) {
                				c[j]['subscribe'] = is_exists_empty ? that.getCurrentTime() : 0;
                				elRoot = $('#forum-'+c[j]['primaryKey']);
                				if (!is_exists_empty) {
		    				        elRoot.removeClass(that.class_forum_subscribe);
                				} else {
		    				        elRoot.addClass(that.class_forum_subscribe);

                				}
                			}
        			        that.array_update_notify(c);
                		}
                	}

                    that.func_sendMessage("cron_update", 0, loadAdded, function() {});

                	that.subs_update();
                }

                return false;
        	}
       	);

       	//!!!
        $('a.forum-delete-action', that.printEl)
            .unbind('click').bind('click', function(event) {
                var el = $(this);
	            var elRoot = el.parents('.item-one:first');
                var forum_id = parseInt(elRoot[0].getAttribute('data-id'));

                var c = that.array;
                var j = get_el_by_field(c, 'primaryKey', forum_id);
                if (j != -1) {
                	c = c[j];

                	if (!c['innerList']) {
    	                c['deleted'] = that.getCurrentTime();

    	                if (!c['activePage']) {
    	                	c['activePage'] = 1;
    	                }

    			        that.array_update_notify([c]);
                	} else {
                		c = c['innerList'];
                		var l = c.length;
                		if (l) {
                			var is_exists_empty = false;
                			for (j=0; j < l; j++) {
                				if (!c[j]['subscribe']) {
                					is_exists_empty = true;
                					break;
                				}
                			}
                			if (!is_exists_empty) {
		    				    elRoot.removeClass(that.class_forum_subscribe);
                			} else {
		    				    elRoot.addClass(that.class_forum_subscribe);
                			}
                			for (j=0; j < l; j++) {
                				c[j]['subscribe'] = is_exists_empty ? that.getCurrentTime() : 0;
                				elRoot = $('#forum-'+c[j]['primaryKey']);
                				if (!is_exists_empty) {
		    				        elRoot.removeClass(that.class_forum_subscribe);
                				} else {
		    				        elRoot.addClass(that.class_forum_subscribe);
                				}
                			}
        			        that.array_update_notify(c);
                		}
                	}

                	that.subs_update();
                }

                return false;
        	}
       	);


        //--------
        $('.item-one.forum-list-one', this.printEl)
         .unbind('click').bind('click', function(event) {
         	if (event.ctrlKey) {
         		return true;
         	}

            var el = $(this);
            var elRoot = el;
            var group_id = parseInt(elRoot[0].getAttribute('data-id'));

            var c = that.folders, e;
            var i = get_el_by_field(c, 'primaryKey', group_id);
            if (i != -1) {
            	e = c[i];

            	if (!e.innerList && !e.root_id) return true;

                $('.item-one.forum-list-one .view-folder-one-container').removeClass('active');
                elRoot.find('.view-folder-one-container').addClass('active');

                var reLoad = true;
                that.forums_inner_print(group_id, 0, false, reLoad);
            }
            return false;
        });

        //--------
        $('.folder_add', this.printEl).unbind('click').bind('click', function() {

            Boxy.inputValue('Добавить группу:', function(value) {
                if (!value) return false;

                that.folder_add(value, 1);
            });

            return false;
        });

        $('.item-one-folder .menu-actions').unbind('click').bind('click', function() {
            var el = $(this);

            var sub_root = el.parent();
            var root = sub_root.parent().parent();

            var id = parseInt(root.attr("id").replace(/.*?(\d+)$/i, '$1'));

            var pu_menu_el = $('#pop-menu-folder-actions');

            pu_menu_el[0]['readrss_active_menu'] = id;

            pu_menu_el.toggleClass('dn');
            root.toggleClass('hover');

            var sr_ofs = sub_root.offset();

            pu_menu_el.css({"left" : sr_ofs.left+150, "top" : sr_ofs.top-40});

            return false;
        });

        if (that.under_type == 'contacts') {
            $('.pop-menu-folder-edit a').unbind('click').bind('click', function(event) {
                var pu_menu_el = $('#pop-menu-folder-actions');

                var folder_id = pu_menu_el[0]['readrss_active_menu'];

                var j = get_el_by_field(that.array, 'primaryKey', folder_id);
                if (j != -1) {

                	var folder_title = that.array[j]['title'];

                    Boxy.inputValue('Редактировать группу:', function(value) {
                        if (!value) return false;
                        that.folder_edit(folder_id, value);

                    }, {"initialValue" : folder_title});
                }

                return false;
            });

            $('.pop-menu-folder-del a').unbind('click').bind('click', function(event) {
                var pu_menu_el = $('#pop-menu-folder-actions');

                var folder_id = pu_menu_el[0]['readrss_active_menu'];

                var j = get_el_by_field(that.array, 'primaryKey', folder_id);
                if (j != -1) {

                	var folder_title = that.array[j]['title'];

                    Boxy.confirm('Точно удалить группу &quot;'+folder_title+'&quot;?', function() {
                        that.folder_delete([that.array[j]]);

                    });
                }

                return false;
            });
        }

        var forum_id_click = that.popup_options.subs.filter.activeItem.primaryKey;
        $('#forum-list-one-'+forum_id_click+'').trigger('click');
        that.forum_list_scroll(that.popup_options.subs.filter.activeItem.primaryKey);


        that.window_resize(true);


        //==============
        $itemList = null;
        itemsList = null;
        itemsToDraw = null;
        arr = null;
    },


	parse_url : function(str, component) {
        // http://kevin.vanzonneveld.net
        // +      original by: Steven Levithan (http://blog.stevenlevithan.com)
        // + reimplemented by: Brett Zamir (http://brett-zamir.me)
        // + input by: Lorenzo Pisani
        // + input by: Tony
        // + improved by: Brett Zamir (http://brett-zamir.me)
        // %          note: Based on http://stevenlevithan.com/demo/parseuri/js/assets/parseuri.js
        // %          note: blog post at http://blog.stevenlevithan.com/archives/parseuri
        // %          note: demo at http://stevenlevithan.com/demo/parseuri/js/assets/parseuri.js
        // %          note: Does not replace invalid characters with '_' as in PHP, nor does it return false with
        // %          note: a seriously malformed URL.
        // %          note: Besides function name, is essentially the same as parseUri as well as our allowing
        // %          note: an extra slash after the scheme/protocol (to allow file:/// as in PHP)
        // *     example 1: parse_url('http://username:password@hostname/path?arg=value#anchor');
        // *     returns 1: {scheme: 'http', host: 'hostname', user: 'username', pass: 'password', path: '/path', query: 'arg=value', fragment: 'anchor'}
        var query, key = ['source', 'scheme', 'authority', 'userInfo', 'user', 'pass', 'host', 'port',
                  'relative', 'path', 'directory', 'file', 'query', 'fragment'],
          ini = (this.php_js && this.php_js.ini) || {},
          mode = (ini['phpjs.parse_url.mode'] &&
            ini['phpjs.parse_url.mode'].local_value) || 'php',
          parser = {
            php: /^(?:([^:\/?#]+):)?(?:\/\/()(?:(?:()(?:([^:@]*):?([^:@]*))?@)?([^:\/?#]*)(?::(\d*))?))?()(?:(()(?:(?:[^?#\/]*\/)*)()(?:[^?#]*))(?:\?([^#]*))?(?:#(.*))?)/,
            strict: /^(?:([^:\/?#]+):)?(?:\/\/((?:(([^:@]*):?([^:@]*))?@)?([^:\/?#]*)(?::(\d*))?))?((((?:[^?#\/]*\/)*)([^?#]*))(?:\?([^#]*))?(?:#(.*))?)/,
            loose: /^(?:(?![^:@]+:[^:@\/]*@)([^:\/?#.]+):)?(?:\/\/\/?)?((?:(([^:@]*):?([^:@]*))?@)?([^:\/?#]*)(?::(\d*))?)(((\/(?:[^?#](?![^?#\/]*\.[^?#\/.]+(?:[?#]|$)))*\/?)?([^?#\/]*))(?:\?([^#]*))?(?:#(.*))?)/ // Added one optional slash to post-scheme to catch file:/// (should restrict this)
          };

        var m = parser[mode].exec(str),
          uri = {},
          i = 14;
        while (i--) {
          if (m[i]) {
            uri[key[i]] = m[i];
          }
        }

        if (component) {
          return uri[component.replace('PHP_URL_', '').toLowerCase()];
        }
        if (mode !== 'php') {
          var name = (ini['phpjs.parse_url.queryKey'] &&
              ini['phpjs.parse_url.queryKey'].local_value) || 'queryKey';
          parser = /(?:^|&)([^&=]*)=?([^&]*)/g;
          uri[name] = {};
          query = uri[key[12]] || '';
          query.replace(parser, function ($0, $1, $2) {
            if ($1) {uri[name][$1] = $2;}
          });
        }
        delete uri.source;
        return uri;
    },

    url_domain_get : function(url) {
    	var s = this.parse_url(url);
    	return s.host;
    },

    feed_host_get : function(feed) {
        var r = feed['url'] || "";
        if (r.indexOf('://') == -1) {
        	r = 'http://' + feed['domain'] + r;
        }
		return this.url_domain_get(r);
    },

    urlencode : function(s) {
    	return s.replace(/&/ig, '&amp;').replace(/"/ig, '&#34;');
    },

    escape : function(s) {
        s = s.replace(/"/ig, '&#34;');
        s = s.replace(/</ig, '&lt;');
        s = s.replace(/</ig, '&gt;');
    	return s;
    },

    br2nl : function(s) {
    	return s.replace(/<br\s*\/*>/ig, '\r\n');
    },

    getCurrentTime : function() {
    	return Math.round((new Date).getTime()/1000);
    },

    nl2br  : function(s) {
        s = (''+s).replace(/\r\n/igm, '\r');
        s = s.replace(/\n/igm, '\r');
        return s.replace(/\r/igm, '<br />');
    },

    date_format : function(format, timestamp) {
      // http://kevin.vanzonneveld.net
      // +   original by: Carlos R. L. Rodrigues (http://www.jsfromhell.com)
      // +      parts by: Peter-Paul Koch (http://www.quirksmode.org/js/beat.html)
      // +   improved by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
      // +   improved by: MeEtc (http://yass.meetcweb.com)
      // +   improved by: Brad Touesnard
      // +   improved by: Tim Wiel
      // +   improved by: Bryan Elliott
      //
      // +   improved by: Brett Zamir (http://brett-zamir.me)
      // +   improved by: David Randall
      // +      input by: Brett Zamir (http://brett-zamir.me)
      // +   bugfixed by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
      // +   improved by: Brett Zamir (http://brett-zamir.me)
      // +   improved by: Brett Zamir (http://brett-zamir.me)
      // +   improved by: Theriault
      // +  derived from: gettimeofday
      // +      input by: majak
      // +   bugfixed by: majak
      // +   bugfixed by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
      // +      input by: Alex
      // +   bugfixed by: Brett Zamir (http://brett-zamir.me)
      // +   improved by: Theriault
      // +   improved by: Brett Zamir (http://brett-zamir.me)
      // +   improved by: Theriault
      // +   improved by: Thomas Beaucourt (http://www.webapp.fr)
      // +   improved by: JT
      // +   improved by: Theriault
      // +   improved by: Rafał Kukawski (http://blog.kukawski.pl)
      // +   bugfixed by: omid (http://phpjs.org/functions/380:380#comment_137122)
      // +      input by: Martin
      // +      input by: Alex Wilson
      // +   bugfixed by: Chris (http://www.devotis.nl/)
      // %        note 1: Uses global: php_js to store the default timezone
      // %        note 2: Although the function potentially allows timezone info (see notes), it currently does not set
      // %        note 2: per a timezone specified by date_default_timezone_set(). Implementers might use
      // %        note 2: this.php_js.currentTimezoneOffset and this.php_js.currentTimezoneDST set by that function
      // %        note 2: in order to adjust the dates in this function (or our other date functions!) accordingly
      // *     example 1: date('H:m:s \\m \\i\\s \\m\\o\\n\\t\\h', 1062402400);
      // *     returns 1: '09:09:40 m is month'
      // *     example 2: date('F j, Y, g:i a', 1062462400);
      // *     returns 2: 'September 2, 2003, 2:26 am'
      // *     example 3: date('Y W o', 1062462400);
      // *     returns 3: '2003 36 2003'
      // *     example 4: x = date('Y m d', (new Date()).getTime()/1000);
      // *     example 4: (x+'').length == 10 // 2009 01 09
      // *     returns 4: true
      // *     example 5: date('W', 1104534000);
      // *     returns 5: '53'
      // *     example 6: date('B t', 1104534000);
      // *     returns 6: '999 31'
      // *     example 7: date('W U', 1293750000.82); // 2010-12-31
      // *     returns 7: '52 1293750000'
      // *     example 8: date('W', 1293836400); // 2011-01-01
      // *     returns 8: '52'
      // *     example 9: date('W Y-m-d', 1293974054); // 2011-01-02
      // *     returns 9: '52 2011-01-02'
        var that = this,
          jsdate,
          f,
          formatChr = /\\?([a-z])/gi,
          formatChrCb,
          // Keep this here (works, but for code commented-out
          // below for file size reasons)
          //, tal= [],
          _pad = function (n, c) {
            n = n.toString();
            return n.length < c ? _pad('0' + n, c, '0') : n;
          },
          txt_words = ["Sun", "Mon", "Tues", "Wednes", "Thurs", "Fri", "Satur", "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
      formatChrCb = function (t, s) {
        return f[t] ? f[t]() : s;
      };
      f = {
        // Day
        d: function () { // Day of month w/leading 0; 01..31
          return _pad(f.j(), 2);
        },
        D: function () { // Shorthand day name; Mon...Sun
          return f.l().slice(0, 3);
        },
        j: function () { // Day of month; 1..31
          return jsdate.getDate();
        },
        l: function () { // Full day name; Monday...Sunday
          return txt_words[f.w()] + 'day';
        },
        N: function () { // ISO-8601 day of week; 1[Mon]..7[Sun]
          return f.w() || 7;
        },
        S: function(){ // Ordinal suffix for day of month; st, nd, rd, th
          var j = f.j()
          i = j%10;
          if (i <= 3 && parseInt((j%100)/10) == 1) i = 0;
          return ['st', 'nd', 'rd'][i - 1] || 'th';
        },
        w: function () { // Day of week; 0[Sun]..6[Sat]
          return jsdate.getDay();
        },
        z: function () { // Day of year; 0..365
          var a = new Date(f.Y(), f.n() - 1, f.j()),
            b = new Date(f.Y(), 0, 1);
          return Math.round((a - b) / 864e5);
        },

        // Week
        W: function () { // ISO-8601 week number
          var a = new Date(f.Y(), f.n() - 1, f.j() - f.N() + 3),
            b = new Date(a.getFullYear(), 0, 4);
          return _pad(1 + Math.round((a - b) / 864e5 / 7), 2);
        },

        // Month
        F: function () { // Full month name; January...December
          return txt_words[6 + f.n()];
        },
        m: function () { // Month w/leading 0; 01...12
          return _pad(f.n(), 2);
        },
        M: function () { // Shorthand month name; Jan...Dec
          return f.F().slice(0, 3);
        },
        n: function () { // Month; 1...12
          return jsdate.getMonth() + 1;
        },
        t: function () { // Days in month; 28...31
          return (new Date(f.Y(), f.n(), 0)).getDate();
        },

        // Year
        L: function () { // Is leap year?; 0 or 1
          var j = f.Y();
          return j % 4 === 0 & j % 100 !== 0 | j % 400 === 0;
        },
        o: function () { // ISO-8601 year
          var n = f.n(),
            W = f.W(),
            Y = f.Y();
          return Y + (n === 12 && W < 9 ? 1 : n === 1 && W > 9 ? -1 : 0);
        },
        Y: function () { // Full year; e.g. 1980...2010
          return jsdate.getFullYear();
        },
        y: function () { // Last two digits of year; 00...99
          return f.Y().toString().slice(-2);
        },

        // Time
        a: function () { // am or pm
          return jsdate.getHours() > 11 ? "pm" : "am";
        },
        A: function () { // AM or PM
          return f.a().toUpperCase();
        },
        B: function () { // Swatch Internet time; 000..999
          var H = jsdate.getUTCHours() * 36e2,
            // Hours
            i = jsdate.getUTCMinutes() * 60,
            // Minutes
            s = jsdate.getUTCSeconds(); // Seconds
          return _pad(Math.floor((H + i + s + 36e2) / 86.4) % 1e3, 3);
        },
        g: function () { // 12-Hours; 1..12
          return f.G() % 12 || 12;
        },
        G: function () { // 24-Hours; 0..23
          return jsdate.getHours();
        },
        h: function () { // 12-Hours w/leading 0; 01..12
          return _pad(f.g(), 2);
        },
        H: function () { // 24-Hours w/leading 0; 00..23
          return _pad(f.G(), 2);
        },
        i: function () { // Minutes w/leading 0; 00..59
          return _pad(jsdate.getMinutes(), 2);
        },
        s: function () { // Seconds w/leading 0; 00..59
          return _pad(jsdate.getSeconds(), 2);
        },
        u: function () { // Microseconds; 000000-999000
          return _pad(jsdate.getMilliseconds() * 1000, 6);
        },

        // Timezone
        e: function () { // Timezone identifier; e.g. Atlantic/Azores, ...
          // The following works, but requires inclusion of the very large
          // timezone_abbreviations_list() function.
    /*              return that.date_default_timezone_get();
    */
          throw 'Not supported (see source code of date() for timezone on how to add support)';
        },
        I: function () { // DST observed?; 0 or 1
          // Compares Jan 1 minus Jan 1 UTC to Jul 1 minus Jul 1 UTC.
          // If they are not equal, then DST is observed.
          var a = new Date(f.Y(), 0),
            // Jan 1
            c = Date.UTC(f.Y(), 0),
            // Jan 1 UTC
            b = new Date(f.Y(), 6),
            // Jul 1
            d = Date.UTC(f.Y(), 6); // Jul 1 UTC
          return ((a - c) !== (b - d)) ? 1 : 0;
        },
        O: function () { // Difference to GMT in hour format; e.g. +0200
          var tzo = jsdate.getTimezoneOffset(),
            a = Math.abs(tzo);
          return (tzo > 0 ? "-" : "+") + _pad(Math.floor(a / 60) * 100 + a % 60, 4);
        },
        P: function () { // Difference to GMT w/colon; e.g. +02:00
          var O = f.O();
          return (O.substr(0, 3) + ":" + O.substr(3, 2));
        },
        T: function () { // Timezone abbreviation; e.g. EST, MDT, ...
          // The following works, but requires inclusion of the very
          // large timezone_abbreviations_list() function.
    /*              var abbr = '', i = 0, os = 0, default = 0;
          if (!tal.length) {
            tal = that.timezone_abbreviations_list();
          }
          if (that.php_js && that.php_js.default_timezone) {
            default = that.php_js.default_timezone;
            for (abbr in tal) {
              for (i=0; i < tal[abbr].length; i++) {
                if (tal[abbr][i].timezone_id === default) {
                  return abbr.toUpperCase();
                }
              }
            }
          }
          for (abbr in tal) {
            for (i = 0; i < tal[abbr].length; i++) {
              os = -jsdate.getTimezoneOffset() * 60;
              if (tal[abbr][i].offset === os) {
                return abbr.toUpperCase();
              }
            }
          }
    */
          return 'UTC';
        },
        Z: function () { // Timezone offset in seconds (-43200...50400)
          return -jsdate.getTimezoneOffset() * 60;
        },

        // Full Date/Time
        c: function () { // ISO-8601 date.
          return 'Y-m-d\\TH:i:sP'.replace(formatChr, formatChrCb);
        },
        r: function () { // RFC 2822
          return 'D, d M Y H:i:s O'.replace(formatChr, formatChrCb);
        },
        U: function () { // Seconds since UNIX epoch
          return jsdate / 1000 | 0;
        }
      };
      this.date = function (format, timestamp) {
        that = this;
        jsdate = (timestamp === undefined ? new Date() : // Not provided
          (timestamp instanceof Date) ? new Date(timestamp) : // JS Date()
          new Date(timestamp * 1000) // UNIX timestamp (auto-convert to int)
        );
        return format.replace(formatChr, formatChrCb);
      };
      return this.date(format, timestamp);
    },

    date_format_simply : function(time, print_seconds) {
        var d = new Date(time*1000);

        var day = d.getDate();
        if (day < 10) day = '0'+day;

        var month = d.getMonth()+1;
        if (month < 10) month = '0'+month;

        var hours = d.getHours();
        if (hours < 10) hours = '0'+hours;

        var minutes = d.getMinutes();
        if (minutes < 10) minutes = '0'+minutes;

        var seconds = d.getSeconds();
        if (seconds < 10) seconds = '0'+seconds;

        var df = day+'.'+month+'.'+d.getFullYear()+' '+hours+':'+minutes+(!print_seconds ? '' : ':'+seconds);

        d = null;

        return df;
    }

};
