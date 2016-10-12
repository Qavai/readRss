var ReadRss = {
    name:                          'Read Rss',
    version:                        1.102,
    copyright:                     '(c) Eugene Ivanov, 2013...now e-ivanov.ru/projects/read-rss/ eugene.ivanov@gmail.com',
    project_name :                 'read_rss',

	escapeRegExp : function (str) {
  		return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
	},

	img_tag_split : /<img/img,

    init: function(core) {
        this.core = core;
    },


    array_unique : function(a) {
        return a.reduce(function(p, c) {
            if (p.indexOf(c) < 0) {
            	p.push(c);
            }
            return p;
        }, []);
    },

    rss_load_iframe : function(url, callback) {
        var that = this;

        (function(){
            var body = document.getElementsByTagName('body')[0];

            var iframe = document.createElement('iframe');
            iframe.sandbox = "";
            var win = (iframe.frameElement || iframe);
            win.name = 'EI_READ_RSS_1298373iuyYUGJUGjgdfiu;'+url;
            win.style.cssText = "width: 0; height: 0; border: 0";

            var timer = null;
            var timeOut = null;

            var clear = function() {
            	if (timeOut) {
		            that.core.timer.clearTimeout(timeOut);
		            timeOut = null;
		        }
            	if (timer) {
		            that.core.timer.clearTimeout(timer);
		            timer = null;
		        }

    	        body.removeChild(iframe);
            	delete iframe;
            	delete body;
            }

            timeOut = that.core.timer.setTimeout(function() {
			    clear();
	            //callback({"url" : url, "original_url" : url});
            }, 25000);

            that.core.func_sendMessage("rss_load_iframe", "url", url, function(data) {
            	if (!timer) {
					return false;
		        }

		        clear();
            	callback(data);
            });

            body.appendChild(iframe);

            iframe.onload = function() {
             	if (!timeOut) return false;

	            timer = that.core.timer.setTimeout(function() {
			        clear();
	            	//callback({"url" : url, "original_url" : url});
	            	that.core.funcs.mprint('IFRAME ERROR LOAD');
	            }, 1000);
            };

            iframe.src = url;
        })();
    },

    rss_load_xml : function(url, LastModified, Etag, callback) {
        var that = this;

        var is_load_as_text = false;

        var domain = that.core.rss.url_domain_get(url)+'';

        if (0&&domain.indexOf('.livejournal.com') != -1) { //!!!
        	is_load_as_text = true;
        }

        if (is_load_as_text) {
            that.core.httpLoad(
            	url,
            	"text",
            	"text",
            	LastModified,
            	Etag,
            	function(text, LastModified, Etag, status, headers) {
					callback(that.core.rss.parseXml(text), text, LastModified, Etag, status, headers);
					text = null;
            	},

            	function(status) {
            		callback(null, "", "", "", status, {});
            	}
            );
        } else {
            that.core.httpLoad(
            	url,
            	"xml",
            	"text",
            	LastModified,
            	Etag,
            	function(xml, LastModifiedOut, EtagOut, status, headers) {

            	    that.core.funcs.mprint('load OK');

            		if (!xml) {
                        that.core.httpLoad(
                        	url,
                        	"text",
			            	"text",
                        	LastModified,
                        	Etag,
                        	function(text, LastModified, Etag, status, headers) {
    			        		callback(that.core.rss.parseXml(text), text, LastModified, Etag, status, headers);
								text = null;
                        	},

                        	function(status) {
                        		callback(null, "", "", "", status, {});
                        	}
                        );
            			return;
            		}
            		callback(xml, "", LastModifiedOut, EtagOut, status, headers);
            	},

            	function(status) {
            		that.core.funcs.mprint('status_err = ');
            		that.core.funcs.mprint(status);
            		callback(null, "", "", "", status, {});
            	}
            );
        }
    },



    calc_next_load_time : function(feedInfo, LastModified, Etag, http_status) {
    	var that = this;

		var currTime = that.core.getCurrentTime();
        var timeNext = currTime + that.core.timeToLoad_rss, t = 3600;

        var isExists_ifheaders = LastModified || Etag;

		var lid = !feedInfo['lastItemDate'] ? 0 : feedInfo['lastItemDate'];

        if (lid + (3600*24) < currTime || lid > currTime) {
        	t = !isExists_ifheaders ? 3600 : that.core.timeToLoad_rss;
        	timeNext = currTime + t + Math.floor(Math.random() * (3600/10)) + 1;
        }

        if (lid + (3600*24*2) < currTime) {
        	t = !isExists_ifheaders ? 3600*2 : 3600;
        	timeNext = currTime + t + Math.floor(Math.random() * (3600*0.5)) + 1;
        }

        if (lid + (3600*24*5) < currTime) {
        	t = !isExists_ifheaders ? 3600*6 : 3600;
        	timeNext = currTime + t + Math.floor(Math.random() * (3600*0.5)) + 1;
        }

        /*
        if (lid + (3600*24*7) < currTime) {
        	t = !isExists_ifheaders ? 3600*12 : 3600*3;
        	timeNext = currTime + t + Math.floor(Math.random() * (3600*2)) + 1;
        }

        if (lid + (3600*24*14) < currTime) {
        	t = !isExists_ifheaders ? 3600*24 : 3600*12;
        	timeNext = currTime + t + Math.floor(Math.random() * (3600*5)) + 1;
        }

        if (lid + (3600*24*30) < currTime) {
        	t = !isExists_ifheaders ? 3600*24*3 : 3600*24*2;
        	timeNext = currTime + t + Math.floor(Math.random() * (3600*6)) + 1;
        }

        if (lid + (3600*24*90) < currTime) {
        	t = !isExists_ifheaders ? 3600*24*4 : 3600*24*3;
        	timeNext = currTime + t + Math.floor(Math.random() * (3600*12)) + 1;
        }

        if (lid + (3600*24*365) < currTime) {
        	t = !isExists_ifheaders ? 3600*24*7 : 3600*24*4;
        	timeNext = currTime + t + Math.floor(Math.random() * (3600*24)) + 1;
        }

        if (lid + (3600*24*365*2) < currTime) {
        	t = !isExists_ifheaders ? 3600*24*14 : 3600*24*7;
        	timeNext = currTime + t + Math.floor(Math.random() * (3600*24*2)) + 1;
        }

        if (http_status && http_status != 200 && http_status != 304 && !lid) {
        	t = 3600*3;
        	timeNext = currTime + t + Math.floor(Math.random() * (360)) + 1;
        }
        */

        return timeNext;
    },


    html_load : function(feed_url, xml, text, handler_ok, handler_error) {
        var that = this;

        var url_parsed = that.core.rss.parse_url(feed_url);
        var base_domain = url_parsed.scheme+'://'+url_parsed.host;

        var feed_list = [];

    	if (xml &&
    		typeof xml['parsererror'] != 'undefined' &&
    		typeof xml['head'] != 'undefined' &&
    		typeof xml['head'] == 'object' &&
    		xml['head'] &&
    		typeof xml['head']['link'] != 'undefined' &&
    		typeof xml['head']['link'] == 'object'
    		) {

    			if (!xml['head']['link'].length) {
    				xml['head']['link'] = [xml['head']['link']];
    			}

    			var href_parsed, href_index;
    			var c = xml['head']['link'];
    			var i, j, e, l = c.length;
    			for (i=0; i < l; i++) {
    				e = c[i];

    				if (typeof e['@type'] != 'undefined' &&
    					typeof e['@rel'] != 'undefined' &&
    					typeof e['@href'] != 'undefined' &&

    					e['@rel'] == 'alternate' &&
    					that.core.rss.xml_http_types.indexOf(e['@type']) != -1 &&
    					e['@href']
    				) {

					    e['@href'] = that.core.rss.url_base_set(e['@href'], base_domain);

                        href_parsed = that.core.rss.parse_url(e['@href']);
                        if (href_parsed.host.substr(0, 4) != 'www.') {
                        	href_parsed.host = 'www.'+href_parsed.host;
                        }
                        href_parsed.path = href_parsed.path || "";
                        if (href_parsed.path.substr(-1, 1) != '/') {
                        	href_parsed.path = href_parsed.path+'/';
                        }
                        href_index = href_parsed.host + href_parsed.path + (href_parsed.query || "");

    					j = that.core.get_el_by_field(feed_list, 'href_index', href_index);
    					if (j == -1) {
                			feed_list.push({
                				"type" :	e['@type'],
                				"title" :	e['@title'] || e['@href'],
                				"href" :	e['@href'],
                				"href_index" :	href_index
                			});
                	    }
            		}
    			}

    			if (feed_list.length) {
    				return handler_ok(feed_list, 200);
    			}
    	}

   		if (!text || text instanceof XMLHttpRequest) { //perhaps this feature of quo
    		that.core.httpLoad(
    			feed_url,
    			'html',
            	"text",
    			"",
    			"",
    			function(html, LM, ET, status) {
    				var feed_list = that.core.rss.html_search_feeds(html, feed_url, base_domain);
    				handler_ok(feed_list, status);
    			},

    			function(status) {
    				handler_error(status);
    			}
    		);

    	} else {
    		feed_list = that.core.rss.html_search_feeds(text, feed_url, base_domain);
			handler_ok(feed_list, 200);
    	}
    },

    rss_import : function(folder_title, feed_url, feed_title, time_store_limit, callback) {
    	var that = this;

		var currTime = that.core.getCurrentTime();
        var folder_id = -1;

        that.core.Storage.folders_get(
        	" ",
        	function(folders_list) {

        		if (folder_title != '`~`') {
        			var j = that.core.get_el_by_field(folders_list, 'title', folder_title);
        			if (j != -1) {
        				folder_id = folders_list[j]['primaryKey'];
        			}
        		} else {
        			folder_id = 1;
        		}

        		if (folder_id == -1) {
                    that.core.Storage.table_max_get('folders', function(folder_id) {
                    	folder_id++;

                    	var folderInfo = {};
                    	folderInfo['primaryKey'] = folder_id;
                   		folderInfo['title'] = folder_title;
                    	folderInfo['orderBy'] = folder_id;
                    	folderInfo['root_id'] = 1;
                    	folderInfo['timeAdd'] = currTime;
                    	folderInfo['timeUpdate'] = 0;
                    	folderInfo['activePage'] = 1;
                    	folderInfo['subscribe'] = 1;
                    	folderInfo['is_close'] = 0;
                    	folderInfo['type'] = 0;
                    	folderInfo['counts'] = 0;
                    	folderInfo['countsNew'] = 0;
                       	folderInfo['countsStar'] = 0;

                        that.core.Storage.insert_msgs('folders', [folderInfo], function(results) {
							that.rss_import_do(folder_id, feed_url, feed_title, time_store_limit, callback);
            			});
           		    });
        		} else {
					that.rss_import_do(folder_id, feed_url, feed_title, time_store_limit, callback);
        		}
            }
        );
    },

    rss_import_do : function(folder_id, feed_url, feed_title, time_store_limit, callback) {
    	var that = this;

        //!!! normalize feed url

		var currTime = that.core.getCurrentTime();

        var url_parsed = that.core.rss.parse_url(feed_url);
        var base_domain = url_parsed.scheme+'://'+url_parsed.host;

        that.core.Storage.feeds_get(
        	" AND link = '"+that.core.Storage.escape(feed_url)+"'",
        	function(feeds_list) {

        	    //========================================================================================================
                var feed_process = function(item, feedInfo, guid_index, items, events, LastModified, Etag, http_status, headers) {
	                if (LastModified) {
	                	that.core.funcs.mprint('LastModified = '+LastModified);
	                }

	                if (Etag) {
	                	that.core.funcs.mprint('Etag = '+Etag);
					}

                	//that.core.funcs.mprint('http_status = '+http_status);
                	//that.core.funcs.mprint(headers);

                    var timeNextUpdate_set = that.calc_next_load_time(feedInfo, LastModified, Etag, http_status);

                	var cronList = [];
                    cronList.push({
                    	"eventKey"	 	: item['eventKey'],
                    	"msgType" 		: "rss_load",
                    	"objectType" 	: 0,
                    	"timeNextUpdate": timeNextUpdate_set,
                    	"tryCount" 		: (http_status && http_status != 200 ? 8 : 10),
                    	"priority" 		: 10,
                    	"url" 			: item['url'],
                    	"url_301" 		: "",
                    	"LastModified"	: LastModified,
                    	"Etag"			: Etag,
                    	"http_status"	: http_status,
                    	"datetime" 		: item.datetime
                    });

        		    that.core.Storage.cron_update(cronList, function(results) {

        		    	//!!!
        		    	if ( 0&&http_status == 200 &&
        		    		(	typeof headers['x-frame-options'] == 'undefined' ||
        		    		 	(typeof headers['x-frame-options'] != 'undefined' && headers['x-frame-options'] != 'SAMEORIGIN')
        		    		 )
        		    		) {
                            that.rss_load_iframe(
                            	feed_url,
                            	function(data) {
                            	    var feed_url_301 = "";

                            		if (data['url'] && data['original_url'] && feed_url == data['original_url'] && data['url'] != data['original_url']) {
                            			feed_url_301 = data['url'];

                            			that.core.funcs.mprint('feed_url_301 = ');
                            			that.core.funcs.mprint(feed_url_301);

                            			if (feed_url_301) {
                                        	var cronList = [];
                                            cronList.push({
                                            	"eventKey"	 	: feedInfo['primaryKey'],
                                            	"msgType" 		: "rss_load",
                                            	"objectType" 	: 0,
                                            	"url" 			: feed_url,
                                            	"url_301" 		: feed_url_301
                                            });

    						            	feedInfo['link_301'] = feed_url_301;
    							           	that.core.Storage.update_msgs('feeds', [feedInfo], true);
    					        		    that.core.Storage.cron_update(cronList, function() {});
                            			}
                            		}
                            	}
                            );
                        }
        		    });
        			callback({"status" : "ok", "http_status" : http_status, "feedInfo" : feedInfo, "guid_index" : guid_index, "items" : items, "events" : events});
                }

                if (!feeds_list.length) {

                	var html_load_process = function(feed_list, http_status, status, callback) {
                	    if (!feed_list.length || status == "err") {

                	    	if (url_parsed['path'] != '' && url_parsed['path'] != '/') {
                	            that.html_load(
                	            	base_domain,
                	            	{},
                	            	"",

                	            	function(feed_list, http_status) {
										callback({"status" : "import", "http_status" : http_status, "feedInfo" : {}, "guid_index" : [], "items" : [], "events" : [], "html_feed_list" : feed_list});
                	            	},

                	            	function(http_status) {
										callback({"status" : "err", "http_status" : http_status, "feedInfo" : {}, "guid_index" : [], "items" : [], "events" : []});
                	            	}
                	            );
                	            return;
                	        }
                	    }
						callback({"status" : status, "http_status" : http_status, "feedInfo" : {}, "guid_index" : [], "items" : [], "events" : [], "html_feed_list" : feed_list});
                	}

                    that.rss_load_xml(
                    	feed_url,
                    	"",
                    	"",
                    	function(xml, text, LastModified, Etag, http_status, headers) {

                    		if (0) {
                        		console.log(xml);
                        		console.log(text);
                        		console.log(http_status);
                        		console.log(headers);
                        	}

                    	    if (!http_status) {
        						return callback({"status" : "err", "http_status" : http_status, "feedInfo" : {}, "guid_index" : [], "items" : [], "events" : []});
                    	    }

                    	    //that.core.funcs.mprint(http_status);
                    	    //that.core.funcs.mprint(3);

                    		if (!xml && [200, 406].indexOf(http_status) != -1) {
	                    	    //that.core.funcs.mprint(4);

                	            that.html_load(
                	            	feed_url,
                	            	{},
                	            	text,

                	            	function(feed_list, status) {
                	            		html_load_process(feed_list, status, "import", callback);
                	            	},

                	            	function(status) {
                	            		html_load_process([], status, "err", callback);
                	            	}
                	            );

                    			return;

                    		} else {
                    			var feedInfoIn = {"format" : "error"};
                    			var guid_index = [];
                    			var items = [];

                    			if (xml) {
                    			    var ret = that.core.rss.rss_parse(feed_url, xml);

                    			    //that.core.funcs.mprint(ret);

                    			    feedInfoIn = ret['feedInfo'];
                    			    guid_index = ret['guid_index'];
                    			    items = ret['items'];
                    			}

                                if (typeof feedInfoIn['format'] == 'undefined') {
                	            	that.html_load(
                	            		feed_url,
                	            		ret['xml'],
                	            		text,

                	            		function(feed_list, status) {
	                	            		html_load_process(feed_list, status, "import", callback);
                	            		},

                	            		function(status) {
	                	            		html_load_process([], status, "err", callback);
                	            		}
                	            	);
                                } else {

                                    that.core.Storage.table_max_get('feeds', function(feed_id) {
                                    	feed_id++;

                                    	var feedInfo = {};
                                    	feedInfo['primaryKey'] = feed_id;
                                    	feedInfo['folder_id'] = folder_id;
                                    	feedInfo['event_id'] = 0;
                                    	feedInfo['link'] = feed_url;
                                    	feedInfo['link_301'] = "";

                                    	if (feed_title !== false) {
                                    		feedInfo['title'] = feed_title;
                                    	}

                                    	feedInfo['orderBy'] = feed_id;
                                    	feedInfo['timeAdd'] = currTime;
                                    	feedInfo['timeUpdate'] = 0;
                                    	feedInfo['activePage'] = 1;
                                    	feedInfo['subscribe'] = 1;
                                    	feedInfo['deleted'] = 0;
                                    	feedInfo['counts'] = 0;
                                    	feedInfo['countsNew'] = 0;
                                    	feedInfo['countsStar'] = 0;
                                    	feedInfo['last_guid_list'] = '[]';

                                    	feedInfo = that.core.extend(feedInfo, feedInfoIn);

                                    	if (!feedInfo['url']) {
                                    		feedInfo['url'] = feedInfo['link'];
                                    	}

                                        that.core.Storage.insert_msgs('feeds', [feedInfo], function(results) {
                	                        that.rss_insert_to_db(feed_id, time_store_limit, feedInfo, guid_index, items, LastModified, Etag, http_status, headers,
                	                        	function(feedInfo, guid_index, items, events) {
                	                        		feed_process({"url" : feed_url, "eventKey" : feed_id, "datetime" : time_store_limit}, feedInfo, guid_index, items, events, LastModified, Etag, http_status, headers);
                	                        	}
                	                        );
                            			});
                            	    });
                                }
                    		}
                    	},

                    	function(status) {
        		    		callback({"status" : "err", "http_status" : status, "feedInfo" : {}, "guid_index" : [], "items" : [], "events" : []});
                    	}
                    );

                } else {
                	var feedInfo = feeds_list[0];
                	var feed_id = feedInfo["primaryKey"];

                	folder_id = 1;//feedInfo["folder_id"]; //!!! заносить поток в другую папку

                	feedInfo['deleted'] = 0;
                	feedInfo['folder_id'] = folder_id;
                	feedInfo['link_301'] = "";

                	var fields = that.core.Storage.fields2indexArray(that.core.Storage.tblFields['feeds']);
                    that.core.Storage.table_update([feedInfo], 'feeds', true, fields, "primaryKey", function(){});

        	        that.rss_load({"url" : feed_url, "eventKey" : feed_id, "datetime" : time_store_limit}, function(feedInfo, guid_index, items, events, LastModified, Etag, http_status, headers) {
        	           	feed_process({"url" : feed_url, "eventKey" : feed_id, "datetime" : time_store_limit}, feedInfo, guid_index, items, events, LastModified, Etag, http_status, headers);
        	        });
                }
            }
        );
    },

    rss_load : function(item, callback) {
    	var that = this;

        that.rss_load_parse(item.url_301 || item.url, item.eventKey, item.LastModified, item.Etag,
        	function(feedInfo, guid_index, items, LastModified, Etag, http_status, headers) {
            	var i, l, c, e, g;

                if (!guid_index.length) {
    	            callback(feedInfo, guid_index, items, [], LastModified, Etag, http_status, headers);
                } else {
                    that.rss_insert_to_db(item.eventKey, item.datetime, feedInfo, guid_index, items, LastModified, Etag, http_status, headers, callback);
                }
        	}
       	);
    },

    img_load : function(item, callback) {
    	var that = this;

		var currTime = that.core.getCurrentTime();

        var imgInfo = {};

        var url = item.url_301 || item.url;

        that.image_load_binary(url, item.LastModified, item.Etag, function(imgInfo, LastModified, Etag, status, headers) {

        	if (!imgInfo) {
        		callback(imgInfo, LastModified, Etag, status, headers);
        	} else {

        		var imgPrimaryKey = item.eventKey;

                that.core.Storage.get_list(
                	'imgs',
                	" AND primaryKey = "+imgPrimaryKey,
                	false,
                	function(imgs_db) {
                		if (imgs_db.length == 1) {

                			var img = imgs_db[0];

	            			var doc_ids = JSON.parse(img['doc_ids']);

	            			img['width'] = imgInfo['width'];
	            			img['height'] = imgInfo['height'];
	            			img['contentType'] = imgInfo['contentType'];
	            			img['contentLength'] = imgInfo['contentLength'];
	            			img['LastModified'] = imgInfo['LastModified'];
	            			img['Etag'] = imgInfo['Etag'];
	            			img['http_status'] = imgInfo['http_status'];
	            			img['content'] = imgInfo['content'];
	            			img['timeload'] = currTime;

	            			//!!! удалять 1*1 картинки - это счётчики

	            			imgInfo = null;

                            that.core.Storage.update_msgs('imgs', [img], false, false, function(result) {

                                that.core.Storage.get_list(
                                	'events',
						        	" AND primaryKey "+that.core.Storage.print_in(doc_ids, "'"),
                                	true,
                                	function(docs_db) {

                                		var i, l = docs_db.length, e, t, img_ids;

                                		var re = new RegExp('\\s+src="'+that.escapeRegExp(url)+'"', 'igm');

                                		for (i=0; i < l; i++) {
                                			e = docs_db[i];

                                			t = e['textImg'];
                                			t = t.replace(re, ' width="'+img['width']+'" height="'+img['height']+'" data-src="'+url+'" data-image-id="'+imgPrimaryKey+'" src="../images/file.png"');
                                			e['textImg'] = t;

					            			img_ids = !e['img_ids'] ? [] : JSON.parse(e['img_ids']);

					            			if (img_ids.indexOf(imgPrimaryKey) == -1) {
						            			img_ids.push(imgPrimaryKey);
						            		}
					            			e['img_ids'] = JSON.stringify(img_ids);
                                		}

			                            that.core.Storage.update_msgs('events', docs_db, true, false, function(result) {
							        		callback(imgInfo, LastModified, Etag, status, headers);
			                            });
                                	}
                                );

                            });

                		} else {
			        		callback(imgInfo, LastModified, Etag, status, headers);
                		}
                	}
                );

        	}
        });
    },

    rss_load_parse : function(url, feed_id, LastModified, Etag, callback) {
        var that = this;

        var feedInfo = {}, guid_index = [], items = [];

        that.core.Storage.feeds_get(
        	' AND primaryKey = '+feed_id,
        	function(feeds_list) {
        		if (feeds_list.length) {
	           		feedInfo = feeds_list[0];
	           	}

                that.rss_load_xml(
                	url,
                	LastModified,
                	Etag,
                	function(xml, text, LastModified, Etag, status, headers) {

                		if (!xml || xml instanceof XMLHttpRequest) { //perhaps this feature of quo
        	            	callback(feedInfo, guid_index, items, LastModified, Etag, status, headers);
                			return;
                		}

        			    var ret = that.core.rss.rss_parse(url, xml);
        			    feedInfo = ret['feedInfo'];
        			    guid_index = ret['guid_index'];
        			    items = ret['items'];

                    	callback(feedInfo, guid_index, items, LastModified, Etag, status, headers);
                    },

                    function() {
                    	callback(feedInfo, guid_index, items, "", "", 0, {});
                    }
                );
            }
        );
    },

    rss_insert_to_db : function(feed_id, time_for_insert_item, feedInfoIn, guid_index, items, LastModified, Etag, http_status, headers, callback) {
    	var that = this;

        var currTime = that.core.getCurrentTime();

        var events = [], i, l, e, g, isNew, e_url_parsed, is_date_non_exists;

        that.core.Storage.feeds_get(
        	' AND primaryKey = '+feed_id,
        	function(feeds_list) {
            	var feedInfo = feeds_list[0];

            	feedInfo = that.core.extend(feedInfo, feedInfoIn);

		        var lastItemDate = !feedInfo["lastItemDate"] ? 0 : feedInfo["lastItemDate"];
		        var last_guid_list = JSON.parse(feedInfo["last_guid_list"]);

            	var is_loaded_first_time = !feedInfo['timeUpdate'];

            	feedInfo['http_status'] = http_status;

            	if (http_status && http_status != 200 && feedInfo['format'] == "error") {
            		lastItemDate = 0;
            	}

                if (!feedInfo['title']) {
                	feedInfo['title'] = feedInfo['title_original'];
                }
                if (!feedInfo['url']) {
                	feedInfo['url'] = feedInfo['link'];
                }

				var feed_url_parsed = that.core.rss.parse_url(feedInfo['url']);
                feedInfo['domain'] = feed_url_parsed.host;
                if (feed_url_parsed.scheme == 'http') {
	            	feedInfo['url'] = (feed_url_parsed.path || "/") + (!feed_url_parsed.query ? '' : '?'+feed_url_parsed.query);
	            }

	            if (feedInfo['image_url']) {
    				var image_url_parsed = that.core.rss.parse_url(feedInfo['image_url']);
                    if (image_url_parsed.host == feed_url_parsed.host) {
	                    if (image_url_parsed.scheme == 'http') {
    		            	feedInfo['image_url'] = (image_url_parsed.path || "/") + (!image_url_parsed.query ? '' : '?'+image_url_parsed.query);
    		            }
    		        }
    	        }

            	var folder_id = feedInfo['folder_id'];

                that.core.Storage.folders_get(
                	' AND primaryKey IN(1, '+folder_id+')',
                	function(folders_list) {
        	        	var folderRoot, folderInfo;

                		var j = that.core.get_el_by_field(folders_list, 'primaryKey', 1);
                		if (j != -1) {
                			folderRoot = folders_list[j];
                		}
                		j = that.core.get_el_by_field(folders_list, 'primaryKey', folder_id);
                		if (j != -1) {
                			folderInfo = folders_list[j];
                		}

                		//that.core.funcs.mprint(items);
                		//that.core.funcs.mprint(" AND feed_id = "+feed_id+" AND guid "+that.core.Storage.print_in(guid_index, "'"));

                        l = items.length;

                        for (i=0; i < l; i++) {
                        	e = items[i];
                        	g = e.guid;

                        	is_date_non_exists = false;

                        	if (is_loaded_first_time && e['datetime']) {
	                    	    e['time_load'] = e['datetime'];
                        	}
                        	if (!e['datetime']) {
                        		e['datetime'] = feedInfo['pubDate'] || e['time_load'];
                        		//!!del is_date_non_exists = true;
                        	}

                        	if (e['datetime'] > lastItemDate) {
                        		lastItemDate = e['datetime'];
                        	}

                        	if (last_guid_list.indexOf(g) == -1 && (!time_for_insert_item || (time_for_insert_item && e['datetime']+time_for_insert_item > currTime)) ) {
                        		isNew = ((!(e['datetime']+time_for_insert_item > currTime) && is_loaded_first_time) || is_date_non_exists) ? 0 : 1;

                        	    e['primaryKey'] = null;
                        	    e['feed_id'] = feed_id;
                        	    e['folder_id'] = folder_id;
                        	    e['New'] = isNew;
                        	    e['star'] = 0;
                        	    e['deleted'] = 0;
                        	    e['deletedReal'] = 0;
                        	    e['notifyWasViewed'] = that.core.isNotifyMute() ? 1 : 0;

                        	    if (e['guid'] == e['link']) {
                        	    	e['link'] = "";
                        	    } else {
    								e_url_parsed = that.core.rss.parse_url(e['link']);
    								//that.core.funcs.mprint(e_url_parsed);
                               		if (e_url_parsed &&
                               			typeof e_url_parsed.scheme != 'undefined' &&
                               			e_url_parsed.scheme == 'http' &&
                               			typeof e_url_parsed.host != 'undefined' &&
                               			e_url_parsed.host == feedInfo['domain']) {
    	                           			e['link'] = (e_url_parsed.path || "/") + (!e_url_parsed.query ? '' : '?'+e_url_parsed.query);
    	                           	}
                        	    }

                            	events.push(e);

                	            feedInfo['counts']++;
                	            feedInfo['countsNew'] += isNew;

                	            folderInfo['counts']++;
                	            folderInfo['countsNew'] += isNew;

                	            if (folder_id != folderRoot['primaryKey']) {
        	    	                folderRoot['counts']++;
            		                folderRoot['countsNew'] += isNew;
            		            }
                        	}
                        }

					    feedInfo['timeUpdate'] = currTime;
					    feedInfo['lastItemDate'] = lastItemDate;


					    var last_guid_list_start = last_guid_list.slice();


					    var was_change = false;

					    for (var ti = 0, tl = guid_index.length, te; ti < tl; ti++) {
					    	te = guid_index[ti];
					    	if (last_guid_list.indexOf(te) == -1) {
					    		last_guid_list.push(te);
					    		was_change = true;
					    	}
					    }
					    if (!was_change) {
					    	last_guid_list_start = ['same'];
					    }

					    var last_guid_list_ = last_guid_list.slice();

					    if (last_guid_list.length > guid_index.length*100) {
					    	last_guid_list = last_guid_list.slice(guid_index.length*100);
					    } else {
					    	last_guid_list_ = ['same'];
					    }
					    feedInfo['last_guid_list'] = JSON.stringify(last_guid_list);



                	    var fields = that.core.Storage.fields2indexArray(that.core.Storage.tblFields['feeds']);
                        that.core.Storage.table_update([feedInfo], 'feeds', true, fields, "primaryKey", function(){});

                	    var fields = that.core.Storage.fields2indexArray(that.core.Storage.tblFields['folders']);
                        that.core.Storage.table_update([folderInfo, folderRoot], 'folders', true, fields, "primaryKey", function(){});

                        //that.core.funcs.mprint(events); 	return;//

                        if (events.length > 0) {

                           	that.ads_images_find_and_delete(events);

                            that.core.Storage.insert_msgs_getPrimaryKey('events', events, function(events_with_primaryKey) {

                            	var images = that.images_find(events_with_primaryKey);
                            	that.images_insert_to_db(images, function() {});


                	            that.core.playSound('type.wav');
                    	       	that.core.calc_cache_icon_counts(function() {
                					that.core.connect = that.core.port_sendMessage({"doing": "popUp_Refresh_counts", "type" : "rss"}, that.core.connect); //!!! сразу передавать папки отсюда
        	                        callback(feedInfo, guid_index, items, events, LastModified, Etag, http_status, headers);
                    	       	});
                            });
                        } else {
        	                callback(feedInfo, guid_index, items, events, LastModified, Etag, http_status, headers);
                        }


        	        }
        	    );
	        }
	    );
    },


    event_del : function(item, callback) {
        var that = this;

        var eventKey = item.eventKey;

        var useOwn = true;

        that.core.Storage.get_list(
        	'events',
			" AND primaryKey = "+eventKey,
        	useOwn,
        	function(docs_db) {

        		var i, l = docs_db.length, e, t, img_ids;

        		var docs_ids = [];

        		if (l) {
        			e = docs_db[0];

        			docs_ids.push(e.primaryKey);

					img_ids = !e['img_ids'] ? [] : JSON.parse(e['img_ids']);

					if (img_ids.length) {

                        var cronList = [];

                        l = img_ids.length;

                        for (i=0; i < l; i++) {
                            cronList.push({
                            	"eventKey"	 	: img_ids[i],
                            	"msgType" 		: "img_del",
                            	"objectType" 	: 0,
                            	"timeNextUpdate": that.core.getCurrentTime()+7*24*3600,
                            	"tryCount" 		: 2,
                            	"priority" 		: 7,
                            	"url" 			: '',
                            	"datetime" 		: 0
                            });
                        }

                        that.core.Storage.cron_update(cronList, function() {
                        });
					}

	                that.core.Storage.delete_msgs_by_primaryKey('events', docs_ids, useOwn, "primaryKey", function(result) {
                        that.core.calc_cache_icon_counts(function() {
                        	callback();
                        });
	                });

        		} else {
                   	callback();
        		}
        	}
        );
    },

    img_del : function(item, callback) {
        var that = this;

        var eventKey = item.eventKey;

        var useOwn = false;

        that.core.Storage.get_list(
        	'imgs',
			" AND primaryKey = "+eventKey,
        	useOwn,
        	function(docs_db) {

        		var i, l = docs_db.length, e, t;

        		var docs_ids = [];

        		if (l) {
        			e = docs_db[0];

        			docs_ids.push(e.primaryKey);

	                that.core.Storage.delete_msgs_by_primaryKey('imgs', docs_ids, useOwn, "primaryKey", function(result) {
                       	callback();
	                });

        		} else {
                   	callback();
        		}
        	}
        );
    },


    image_load_binary : function(url, LastModified, Etag, callback) {
        var that = this;

        var func_error = function() {
        	var LastModified = null, Etag = null, status = 0, headers = {};
            callback(null, LastModified, Etag, status, headers);
        };

        that.core.http_loadBlob(
        	url,
        	LastModified,
        	Etag,
        	function(blob, LastModified, Etag, status, headers) {

        		var contentType = headers['content-type'] || '';
        		var contentLength = headers['content-length']|0;

        		if (!contentType) {
                    return callback({}, LastModified, Etag, status, headers);
        		}

        		//-------------
                var img = document.createElement("img");
                img.src = url;

                img.onload = function() {

                    var reader = new FileReader();
                    reader.addEventListener("loadend", function() {

                        callback({
                        	"width" : img.width,
                        	"height" : img.height,
                        	"contentType" : contentType,
                        	"contentLength" : contentLength,
                        	"LastModified" : LastModified,
                        	"Etag" : Etag,
                        	"http_status" : status,
                        	"content" : reader.result
                        	},

                        	LastModified, Etag, status, headers
                        );

                    });
                    reader.readAsDataURL(blob);
                };

                img.onerror = function() {
                	func_error();
                };
        	},

        	function(status) {
               	func_error();
        	}
        );

    },

    images_find : function(c) {
    	var that = this;

		var i, j, e, ll = c.length, t, k, tt;

		var ta, len, r = [], img_index = [];

		if (ll) {
			for (j=0; j < ll; j++) {
				e = c[j];

				t = e['textImg'];

            	//-------------------
        		ta = t.split(this.img_tag_split);

            	if (ta && ta.length > 1) {

            		img_index = [];

            		len = ta.length;
            		for (i=1; i < len; i++) {

            			l = ta[i].indexOf('>');
            			if (l != -1) {
                			tt = ta[i].substr(0, l);

                			l = tt.indexOf('src="');
                			if (l != -1) {
                    			tt = tt.substr(l+5);


                    			l = tt.indexOf('"');
                    			if (l != -1) {

                        			l = tt.substr(0, l);

                        			if (l.substr(0, 4) == 'http') {

                        				if (img_index.indexOf(l) == -1) {
                        					img_index.push(l);

        					           		k = that.core.get_el_by_field(r, "url", l);
        					           		if (k == -1) {
                	           	    			r.push({
                	           	    			    "url" : l,
                	           	    			    "doc_ids" : [e.primaryKey]
                	           	    			});
        					           		} else {
        					           			r[k]['doc_ids'].push(e.primaryKey);
        					           		}
            	           	    		}
                        			}
                        		}


                    		}
            			}
            		}
            	}
			}
		}

		return r;
    },

    // сразу удалять картинки с разных хостов
    // http://feeds.feedburner.com/~r/zhilinsky/~4/DjhxkS2PN7Y
    // http://pixel.wp.com/b.gif?host=hackaday.com&amp;blog=4779443&amp;post=198470&amp;subd=hackadaycom&amp;ref=&amp;feed=1
    // http://feeds.wordpress.com/1.0/comments/hackadaycom.wordpress.com/200901/

    ads_images_find_and_delete : function(c) {
    	var that = this;

		var i, j, e, ll = c.length, t, k, tt;

		var ta, len, r = [], img_index = [];

		if (ll) {
			for (j=0; j < ll; j++) {
				e = c[j];

				t = e['textImg'];

            	//-------------------
        		ta = t.split(this.img_tag_split);

            	if (ta && ta.length > 1) {

            		img_index = [];

            		len = ta.length;
            		for (i=1; i < len; i++) {

            			l = ta[i].indexOf('>');
            			if (l != -1) {
                			tt = ta[i].substr(0, l);

                			l = tt.indexOf('src="');
                			if (l != -1) {
                    			tt = tt.substr(l+5);


                    			l = tt.indexOf('"');
                    			if (l != -1) {

                        			l = tt.substr(0, l);

                        			if (l.substr(0, 4) == 'http') {

                        				if (img_index.indexOf(l) == -1) {
                        					img_index.push(l);

        					           		k = that.core.get_el_by_field(r, "url", l);
        					           		if (k == -1) {
                	           	    			r.push({
                	           	    			    "url" : l,
                	           	    			    "doc_ids" : [e.primaryKey]
                	           	    			});
        					           		} else {
        					           			r[k]['doc_ids'].push(e.primaryKey);
        					           		}
            	           	    		}
                        			}
                        		}


                    		}
            			}
            		}
            	}
			}
		}
    },

    images_insert_to_db : function(c, callback) {
    	var that = this;

    	var i, l = c.length, e, url_index = [], url;

    	for (i=0; i < l; i++) {
    		e = c[i];

    		url = e.url;

    		if (url_index.indexOf(url) == -1) {
    			url_index.push(url);
    		}
    	}

        that.core.Storage.get_list(
        	'imgs',
        	" AND url "+that.core.Storage.print_in(url_index, "'"),
        	false,
        	function(imgs_db) {

        		var imgs_insert = [];

        		var k, o;

            	for (i=0; i < l; i++) {
            		e = c[i];

            		url = e.url;

            		k = that.core.get_el_by_field(imgs_db, "url", url);

            		if (k == -1) {
            			e['doc_ids'] = JSON.stringify(e['doc_ids']);

            			imgs_insert.push(e);
            		} else {
            			o = imgs_db[k];

            			o['doc_ids'] = JSON.parse(o['doc_ids']);

            			o['doc_ids'] = o['doc_ids'].concat(e['doc_ids']);

            			o['doc_ids'] = that.array_unique(o['doc_ids']);

            			o['doc_ids'] = JSON.stringify(o['doc_ids']);

            			imgs_db[k] = o;
            		}
            	}


                that.core.Storage.insert_msgs_getPrimaryKey('imgs', imgs_insert, function(imgs_insert_with_primaryKey) {
                	var c = imgs_insert_with_primaryKey;

                	var l = c.length;

                	var cronList = [];

                	for (i=0; i < l; i++) {
                		e = c[i];

                        cronList.push({
                        	"eventKey"	 	: e.primaryKey,
                        	"msgType" 		: "img_load",
                        	"objectType" 	: 0,
                        	"timeNextUpdate": that.core.getCurrentTime()+3,
                        	"tryCount" 		: 10,
                        	"priority" 		: 5,
                        	"url" 			: e.url,
                        	"datetime" 		: 0
                        });
                	}

                	//-------------
                	c = imgs_db;
                	l = c.length;

                	for (i=0; i < l; i++) {
                		e = c[i];

                        cronList.push({
                        	"eventKey"	 	: e.primaryKey,
                        	"msgType" 		: "img_load",
                        	"objectType" 	: 0,
                        	"timeNextUpdate": that.core.getCurrentTime()+3,
                        	"tryCount" 		: 10,
                        	"priority" 		: 5,
                        	"url" 			: e.url,
                        	"datetime" 		: 0
                        });
                	}

                    that.core.Storage.cron_update(cronList, function() {

                        that.core.Storage.update_msgs('imgs', imgs_db, false, false, function(result) {
                        	callback({
                        		"imgs_db" : imgs_db,
                        		"imgs_inserted" : imgs_insert_with_primaryKey
                        	});
                        });
                    });
                });

        	}
        );
    }






};
