var Storage = function() {

    this.connect = function() {
    	var that = this;

        if (!this.db) {
        	if (0&&typeof openDatabase == 'undefined') {
    			var sqlite = require("sqlite");
	            this.funcs = require("funcs");

    			this.isFF = true;
    			this.db = {};

    			this.db.connection = sqlite.connect('ei_read_rss.sqlite');

			    this.db.transaction = function(callback, error, success) {
			    	var tx = {};

			    	tx.executeSql = function(statement, data, callbackResult) {
			    	    var re = /(^|[^\s]+)[\r\n\t\s][\r\n\t\s]+([^\s]+|$)/ig;
			    		statement = statement.replace(re, '$1 $2');
			    		statement = statement.replace(re, '$1 $2');
			    		statement = statement.replace(re, '$1 $2');

			    		if (typeof data == 'undefined') {
				            that.db.connection.executeSimpleSQL(statement);
			    		} else {
			    			var re_index = 0;
			    			statement = statement.replace(/\?/ig, function(a) {
			    				re_index++;
			    				return '?'+re_index;
			    			});

                            var stmt = that.db.connection.createStatement(statement);
                            var l = data.length;
                            for (var i=0; i < l; i++) {
						        stmt.bindUTF8StringParameter(i, data[i]);
                            }

                            var iType, colName;
                            var iCols = stmt.columnCount;
                            var aColumns = [];
                            var aTemp;
                            for (var i = 0; i < iCols; i++) {
                              colName = stmt.getColumnName(i);
                              aTemp = [colName, iType];
                              aColumns.push(aTemp);
                            }

                            var ret_data = [];

                            var cell;
                            var bFirstRow = true;

                            try {
                                while (stmt.executeStep()) {
                                  aTemp = [];
                                  for (i = 0; i < iCols; i++) {
                                    iType = stmt.getTypeOfIndex(i);
                                    if (bFirstRow) {
                                      aColumns[i][1] = iType;
                                    }
                                    switch (iType) {
                                      case stmt.VALUE_TYPE_NULL:
                                        cell = null;
                                        break;
                                      case stmt.VALUE_TYPE_INTEGER:
                                        cell = stmt.getInt64(i);
                                        break;
                                      case stmt.VALUE_TYPE_FLOAT:
                                        cell = stmt.getDouble(i);
                                        break;
                                      case stmt.VALUE_TYPE_TEXT:
                                        cell = stmt.getString(i);
                                        break;
                                    }
                                    colName = aColumns[i][0];

                                    aTemp[colName] = cell;
                                  }
                                  ret_data.push(aTemp);
                                  bFirstRow = false;
                                }

	                            callbackResult(tx, ret_data);
	                            success();

                            } catch(e) {
	                            callbackResult(tx, []);
                            } finally {
							    stmt.reset();
                            }
			    		}
			    	}
			    	callback(tx);
			    };

    			this.localStorage = require("simple-storage").storage;
        	} else {
	            this.funcs = window;
    			this.db = openDatabase('sqlite_ei_read_rss', '1.0', 'sqlite db for readRss', 1000 * 1024 * 1024);

    			this.db.connection = {
    				"commitTransaction" : function() {},
    				"beginTransaction" : function() {}
    			};

    			this.localStorage = window.localStorage;//{};
    			/*
    			var c = window.localStorage, i;
    			for (i in c) {
    				this.localStorage[i] = c[i];
    			}
    			*/
        	}

        	/*
        	// сброс кеша на диск
        	setInterval(function() {
    			var c = that.localStorage, i;
    			for (i in c) {
    				window.localStorage[i] = c[i];
    			}
        	}, 1000*15);
        	*/
    	}
    };

    //this.localStorage = {};
    this.user_id = 0;
    this.db = null;

    this.getCurrentTime = function() {
       	return Math.round((new Date).getTime()/1000);
    }

    this.get_object_keys = function(o) {
    	var k = [], i;
    	for (i in o) {
    		k.push(i);
    	}

    	return k;
    }

    this.fields2indexArray = function(arr) {
        var ret = [];
        var i, len, field;

        len = arr.length;
        for (i=0; i < len; i++) {
        	field = arr[i]['name'];
        	if (field != 'OwnUserId') {
    	   		ret.push(field);
    	   	}
        }

     	return ret;
    }

    this.getVersion = function() {
        var key = 'version';
        if (typeof this.localStorage[key] == 'undefined') {
            return 0;
        }
        return JSON.parse(this.localStorage[key]);
    };

    this.setVersion = function(version) {
        this.localStorage["version"] = JSON.stringify(version);
    };

    this.get_element_time = function(element) {
    	var key = 'element_time'+"_"+this.user_id;
   	    var sm = this.localStorage[key];
        if (typeof sm == 'undefined') {
            sm = "{}";
        }
   	    sm = JSON.parse(sm);

        if (typeof sm[element] == 'undefined') {
            sm[element] = '';
            this.localStorage[key] = JSON.stringify(sm);
        }

        return sm[element];
    };

    this.set_element_time = function(element, value) {
    	var key = 'element_time'+"_"+this.user_id;
   	    var sm = this.localStorage[key];
        if (typeof sm == 'undefined') {
            sm = "{}";
        }
   	    sm = JSON.parse(sm);

        sm[element] = value;

        this.localStorage[key] = JSON.stringify(sm);
    };

    this.get_element_value = function(element, def) {
    	if (typeof def == 'undefined') def = '';

    	var key = 'element_value'+"_"+this.user_id;
   	    var sm = this.localStorage[key];
        if (typeof sm == 'undefined') {
            sm = "{}";
        }
   	    sm = JSON.parse(sm);

        if (typeof sm[element] == 'undefined') {
            sm[element] = def;
            this.localStorage[key] = JSON.stringify(sm);
        }

        return sm[element];
    };

    this.set_element_value = function(element, value) {
    	var key = 'element_value'+"_"+this.user_id;
   	    var sm = this.localStorage[key];
        if (typeof sm == 'undefined') {
            sm = "{}";
        }
   	    sm = JSON.parse(sm);
        sm[element] = value;
        this.localStorage[key] = JSON.stringify(sm);
    };

    this.type2number = {
        "rss" 	: 1
    };
    this.number2type = {
        1 : "rss"
    };

    this.type_sql = {};
    this.type_sql["reader"] = " ";

    this.subType_sql = {
    	'reader' : ' ',
    	'subs' : ''
    };

    this.tblFields = {
        // таблица очереди выполнения задач
    	"cron" : [
                  		{"name" : "OwnUserId", 		"type" : "INTEGER", "index" : 1},
    					{"name" : "eventKey", 		"type" : "INTEGER", "index" : 1}, // связь на events.primaryKey
                   		{"name" : "msgType", 		"type" : "TEXT", "index" : 1}, 	 // что подгружать

                   		{"name" : "url", 			"type" : "TEXT", "index" : 1},
                   		{"name" : "url_301",		"type" : "TEXT", "index" : 1},

                   		{"name" : "LastModified", 	"type" : "TEXT"}, //header
                   		{"name" : "Etag", 			"type" : "TEXT"}, //header
                   		{"name" : "http_status",	"type" : "INTEGER"}, // 200, 404 и др. последний статус при загрузке

                   		{"name" : "key",			"type" : "INTEGER"},
    					{"name" : "datetime",		"type" : "INTEGER"},
                   		{"name" : "timeNextUpdate", "type" : "INTEGER", "index" : 1},
                   		{"name" : "priority", 		"type" : "INTEGER", "index" : 1}, // приоритет, от 1 до 10. чем меньше, тем раньше
                   		{"name" : "tryCount", 		"type" : "INTEGER"}
               		],
        // события - основное ядро
    	"events" : 		[{"name" : "primaryKey", 	"type" : "INTEGER PRIMARY KEY ASC"},

    					 {"name" : "OwnUserId", 	"type" : "INTEGER", "index" : 1},

                   		 {"name" : "feed_id",		"type" : "INTEGER", "index" : 1},
                   		 {"name" : "folder_id",		"type" : "INTEGER", "index" : 1},

                   		 {"name" : "time_load",		"type" : "INTEGER", "index" : 1},

                   		 //RSS feed items
                   		 {"name" : "datetime",		"type" : "INTEGER", "index" : 1}, //pubDate

                   		 {"name" : "guid", 			"type" : "TEXT", "index" : 1},
                   		 {"name" : "link", 			"type" : "TEXT", "index" : 1}, // если пусто, то guid. если нет http://, то нет и домена
                   		 {"name" : "title",			"type" : "TEXT"}, // и это относит путь к домену потока (если https, то полный url)
                   		 {"name" : "description", 	"type" : "TEXT"},
                   		 {"name" : "textFull",		"type" : "TEXT"},

                   		 {"name" : "textImg",		"type" : "TEXT"}, // text for store base64 imgs
                   		 {"name" : "img_ids", 		"type" : "TEXT"}, // JSON array of images ids [\d,...]

                   		 {"name" : "author",		"type" : "TEXT", "index" : 1},
                   		 {"name" : "author_url",	"type" : "TEXT"},
                   		 {"name" : "author_email",	"type" : "TEXT"},

                   		 {"name" : "comments_link",	"type" : "TEXT"},
                   		 {"name" : "comments_rss",	"type" : "TEXT"},
                   		 {"name" : "comments_count","type" : "INTEGER"},

                   		 {"name" : "category",		"type" : "TEXT"}, //JSON string array
                   		 {"name" : "enclosure",		"type" : "TEXT"}, //JSON string array
                   		 {"name" : "media",			"type" : "TEXT"}, //JSON string array
                   		 {"name" : "geo",			"type" : "TEXT"}, //JSON string объект

                   		 //{"name" : "woeid", 		"type" : "INTEGER"}, woe:woeid

                   		 {"name" : "New", 			"type" : "INTEGER", "index" : 1},
                   		 {"name" : "star", 			"type" : "INTEGER", "index" : 1},
                   		 {"name" : "deleted", 		"type" : "INTEGER", "index" : 1},
                   		 {"name" : "deletedReal",	"type" : "INTEGER", "index" : 1}, // время удаления
                   		 {"name" :"notifyWasViewed","type" : "INTEGER", "index" : 1}
               		],
    	"feeds" : [
                  		{"name" : "OwnUserId", 		"type" : "INTEGER", "index" : 1},

    					{"name" : "primaryKey", 	"type" : "INTEGER PRIMARY KEY ASC"},

                   		{"name" : "folder_id", 		"type" : "INTEGER", "index" : 1}, // в какой папке содержится
                   		{"name" : "event_id", 		"type" : "INTEGER", "index" : 1}, // если не 0, то этот поток - комментарии к данной записи

                   		{"name" : "link", 			"type" : "TEXT", "index" : 1}, // xml
                   		{"name" : "link_301",		"type" : "TEXT", "index" : 1},
                   		{"name" : "title",			"type" : "TEXT"}, // написанный юзером
                  		{"name" : "title_original",	"type" : "TEXT"}, // оригинальный из xml

                   		{"name" : "format",			"type" : "TEXT"}, // rss | atom
                   		{"name" : "version",		"type" : "TEXT"}, // 2.0 ..
                   		{"name" : "language",		"type" : "TEXT"},

                   		{"name" : "url", 			"type" : "TEXT"}, // html url, без http и домена (если не http, то полный url)
                   		{"name" : "domain", 		"type" : "TEXT", "index" : 1}, // domain from html_url, for search
                   		{"name" : "description",	"type" : "TEXT"},
                   		{"name" : "pubDate",		"type" : "INTEGER"},
                   		{"name" : "lastItemDate",	"type" : "INTEGER"}, // время публикации самой последней записи
                   		{"name" : "http_status",	"type" : "INTEGER"}, // 200, 404 и др. последний статус при загрузке
                   		{"name" : "last_guid_list",	"type" : "TEXT"}, // last guids, index, JSON string array

                   		{"name" : "image_url",		"type" : "TEXT"},
                  		{"name" : "category",		"type" : "TEXT"}, //JSON string массив
                  		{"name" : "geo",			"type" : "TEXT"}, //JSON string объект

                   		{"name" : "ttl", 			"type" : "INTEGER"},
                  		{"name" : "skipDays",		"type" : "TEXT"}, //JSON string array, 1,2,3,4,5,6,7
                  		{"name" : "skipHours",		"type" : "TEXT"}, //JSON string array 0...24
                  		{"name" : "updatePeriod",	"type" : "INTEGER"}, // seconds
                  		{"name" : "updateFrequency","type" : "INTEGER"},

                   		{"name" : "counts", 		"type" : "INTEGER"}, //счётчик элементов (кешируется)
                   		{"name" : "countsNew", 		"type" : "INTEGER"}, //счётчик элементов новых (кешируется)
                   		{"name" : "countsStar", 	"type" : "INTEGER"}, //счётчик элементов star (кешируется)

                   		{"name" : "orderBy", 		"type" : "INTEGER", "index" : 1}, // порядок вывода, выбранный юзером
                   		{"name" : "timeAdd", 		"type" : "INTEGER", "index" : 1}, // время добавления
                   		{"name" : "timeUpdate", 	"type" : "INTEGER"},

                   		{"name" : "activePage", 	"type" : "INTEGER"}, // активная страница
                   		{"name" : "activeMode", 	"type" : "INTEGER"}, // режим просмотра; 0 - new, 1 - all, 2 - star
                   		{"name" : "subscribe",		"type" : "INTEGER"}, // подписан

                 		{"name" : "deleted", 		"type" : "INTEGER", "index" : 1}
               		],
        // папки для feeds
    	"folders" : [
                  		{"name" : "OwnUserId", 		"type" : "INTEGER", "index" : 1},

    					{"name" : "primaryKey", 	"type" : "INTEGER PRIMARY KEY ASC"},
    					{"name" : "root_id", 		"type" : "INTEGER", "index" : 1}, // корень, 0 - главная папка

                   		{"name" : "title",			"type" : "TEXT"},

                   		{"name" : "counts", 		"type" : "INTEGER"}, //счётчик элементов (кешируется)
                   		{"name" : "countsNew", 		"type" : "INTEGER"}, //счётчик элементов новых (кешируется)
                   		{"name" : "countsStar", 	"type" : "INTEGER"}, //счётчик элементов star (кешируется)

                   		{"name" : "type", 			"type" : "INTEGER", "index" : 1}, // тип 0 - 'folder'

                   		{"name" : "activePage", 	"type" : "INTEGER"}, // активная страница
                   		{"name" : "activeMode", 	"type" : "INTEGER"}, // режим просмотра; 0 - new, 1 - all, 2 - star
                   		{"name" : "subscribe",		"type" : "INTEGER"}, // подписан
                   		{"name" : "is_close",		"type" : "INTEGER"}, // закрыта ли группа
                   		{"name" : "orderBy", 		"type" : "INTEGER", "index" : 1}, // порядок вывода

                   		{"name" : "timeAdd", 		"type" : "INTEGER", "index" : 1}, //время добавления
                   		{"name" : "timeUpdate", 	"type" : "INTEGER"}
               		],
        // таблица картинок
    	"imgs" : [
    					{"name" : "primaryKey", 	"type" : "INTEGER PRIMARY KEY ASC"},

                   		{"name" : "url", 			"type" : "TEXT", "index" : 1},
                   		{"name" : "url_301",		"type" : "TEXT", "index" : 1},

                   		{"name" : "LastModified", 	"type" : "TEXT"}, //header
                   		{"name" : "Etag", 			"type" : "TEXT"}, //header
                   		{"name" : "http_status",	"type" : "INTEGER"}, // 200, 404 и др. последний статус при загрузке

                   		{"name" : "contentType", 	"type" : "TEXT"}, //header
                   		{"name" : "contentLength", 	"type" : "INTEGER"}, //header

                   		{"name" : "width", 			"type" : "INTEGER"},
                   		{"name" : "height", 		"type" : "INTEGER"},

    					{"name" : "timeload",		"type" : "INTEGER"},
                   		{"name" : "content", 		"type" : "BLOB"},

                   		{"name" : "doc_ids", 		"type" : "TEXT"} // JSON array of events ids [\d,...]
               		]
    };

    this.resultCopy = function(tblFields, results, is_users_letter, www) {
        var that = this;

    	is_users_letter = is_users_letter || false;
        var array = [];

        var len, i, j, o, n, item;

        if (!this.isFF) {
	        len = results.rows.length;

            for (i = 0; i < len; i++) {
       	    	item = results.rows.item(i);
            	o = {};
            	for (j=0; j < tblFields.length; j++) {
            		n = tblFields[j]['name'];
            		o[n] = item[n];
            		if (tblFields[j]['type'] == 'INTEGER' || tblFields[j]['type'] == 'INTEGER PRIMARY KEY' || tblFields[j]['type'] == 'INTEGER PRIMARY KEY ASC') {
                		if (!o[n] || o[n] == 'NULL') o[n] = 0;
            			o[n] = parseInt(o[n]);
            		} else if (tblFields[j]['type'] == 'NUMBER') {
                		if (!o[n] || o[n] == 'NULL') o[n] = 0;
            			o[n] = (o[n] == parseInt(o[n])) ? parseInt(o[n]) : parseFloat(o[n]);
            		} else {
                		if (!o[n]) {
                			o[n] = '';
            	    	}
            		}
            	}
            	if (is_users_letter) {
            		o['msgs'] = [];
            	}
            	array.push(o);
            }

	    } else {
	        len = results.length;
            for (i = 0; i < len; i++) {
                o = {};
                for (j=0; j < tblFields.length; j++) {
                	n = tblFields[j]['name'];

                	o[n] = results[i][n];

                	if (tblFields[j]['type'] == 'INTEGER' || tblFields[j]['type'] == 'INTEGER PRIMARY KEY' || tblFields[j]['type'] == 'INTEGER PRIMARY KEY ASC') {
                		if (!o[n] || o[n] == 'NULL') o[n] = 0;
                		o[n] = parseInt(o[n]);
                	} else if (tblFields[j]['type'] == 'NUMBER') {
                		if (!o[n] || o[n] == 'NULL') o[n] = 0;
                		o[n] = (o[n] == parseInt(o[n])) ? parseInt(o[n]) : parseFloat(o[n]);
                	} else {
                		if (!o[n]) {
                			o[n] = '';
                    	}
                	}
                }
                if (is_users_letter) {
                	o['msgs'] = [];
                }
                array.push(o);
            }
	    }

    	return array;
    };

    this.resultCopy_oneField = function(field, results) {
        var array = [];
        var len, i, item;

        if (!this.isFF) {
	        len = results.rows.length;
            for (i = 0; i < len; i++) {
            	array.push(results.rows.item(i)[field]);
            }
        } else {
	        len = results.length;
            for (i = 0; i < len; i++) {
            	array.push(results[i][field]);
            }
        }

    	return array;
    };

    this.results_len = function(results) {
        var len = 0, item;

        if (!this.isFF) {
	        len = results.rows.length;
        } else {
	        len = results.length;
        }

    	return len;
    };

    this.is_results_not_zero = function(results) {
        var len = 0;

        if (!this.isFF) {
	        len = results.rows.length;
        } else {
	        len = results.length;
        }

    	return len;
    };

    this.resultPrepare = function(tbl, msgType, array) {
        var len = array.length, i, j, o, n, item, t;

        for (i = 0; i < len; i++) {
        	item = array[i];

        }
    };

    this.get_msgs_count_new = function(callback) {
        var that = this;

        var tbl = 'events';
        var executeData = [that.user_id];

        var tblFields = [
        	{"name" : "rssCount", 		"type" : "INTEGER"}
        ];

        this.db.transaction(
        	function (tx) {
                tx.executeSql("\
                	SELECT \
                		COUNT(DISTINCT p.primaryKey) AS rssCount \
                	FROM "+tbl+" AS p \
                	WHERE 		p.OwnUserId = ? \
                			AND p.New != 0 \
                			AND p.deleted = 0 \
                			AND p.deletedReal = 0 \
                	",
                	executeData,
            		function (tx, results) {
               			var array = that.resultCopy(tblFields, results);
            			callback(array[0]);
                	}
                );
        	},
            function(sqlError) {
            	that.funcs.mprint('this.get_msgs_count_new');
            	that.funcs.mprint(sqlError);
            },
            function() {
            }
        );
    };

    this.get_all_counts = function(callback) {
        var that = this;

        var tbl = 'events';
        var executeData = [that.user_id];

        var tblFields = [
        	{"name" : "rss_new", 	"type" : "INTEGER"},
        	{"name" : "rss_all", 	"type" : "INTEGER"},
        	{"name" : "rss_star", 	"type" : "INTEGER"},
        	{"name" : "rss_list", 	"type" : "INTEGER"}
        ];

        var ret_counts = {};

        this.db.transaction(
        	function (tx) {
                tx.executeSql("\
                	SELECT \
                		COUNT(DISTINCT p.primaryKey) AS rss_all, \
                		COUNT(DISTINCT p_new.primaryKey) AS rss_new, \
                		COUNT(DISTINCT p_star.primaryKey) AS rss_star \
                	FROM "+tbl+" AS p \
                	LEFT JOIN "+tbl+" AS p_new \
                		ON ( \
                		     		p_new.rowid = p.rowid \
                		     	AND	p_new.New != 0 \
                		     	AND	p_new.deleted = 0 \
                		) \
                	LEFT JOIN "+tbl+" AS p_star \
                		ON ( \
                		     		p_star.rowid = p.rowid \
                		     	AND	p_star.star != 0 \
                		     	AND	p_star.deleted = 0 \
                		) \
                	WHERE 		p.OwnUserId = ? \
                			AND p.deletedReal = 0 \
                	",
                	executeData,
                	function (tx, results) {
                		var array = that.resultCopy(tblFields, results);
                		var c = array[0];

                		ret_counts['rss_all'] = c['rss_all'];
                		ret_counts['rss_new'] = c['rss_new'];
                		ret_counts['rss_star'] = c['rss_star'];

                        tx.executeSql("\
                        	SELECT \
                        		COUNT(primaryKey) AS rss_list \
                        	FROM feeds \
                        	WHERE deleted = 0 \
                        	",
                        	[],
                        	function (tx, results) {
                        		var array = that.resultCopy(tblFields, results);
                        		var c = array[0];

                        		ret_counts['rss_list'] = c['rss_list'];

                           		callback(ret_counts);
                        	}
                        );
                	}
                );
        	},
            function(sqlError) {
            	that.funcs.mprint('this.get_all_counts');
            	that.funcs.mprint(sqlError);
            },
            function() {
            }
        );
    };

    this.set_msgs = function(tbl, useOwn, fields_data, filter, callback) {
        var that = this;
        this.db.transaction(
        	function (tx) {
        		filter = filter.replace(/p\./ig, '');

        		var executeData = [];

       		    var fieldsSql = [], field;
       		    for (field in fields_data) {
       		    	fieldsSql.push(field+"=?");
       		    	executeData.push(fields_data[field]);
       		    }

       		    if (fieldsSql.length) {
           		    var ownSql = '1';
           		    if (useOwn) {
           		    	ownSql = "OwnUserId = ?";
           		    	executeData.push(that.user_id);
           		    }

                    tx.executeSql(
                    	"UPDATE "+tbl+" SET "+fieldsSql.join(',')+" WHERE "+ownSql+filter,
                    	executeData,
                    	function (tx, results) {
                    		if (typeof callback != 'undefined') {
                    			callback();
                    		}
                    	}
                    );
       		    } else {
           			callback();
       		    }

        	},
            function(sqlError) {
            	that.funcs.mprint('this.set_msgs() tbl='+tbl+" filter="+filter);
            	that.funcs.mprint(fields_data);
            	that.funcs.mprint(sqlError);
            },
            function() {
            }
        );
    };

    this.search_msgs = function(tbl, msgType, filter, orderBy, useOwn, page, onPage, is_ordinal_pager, offset, callback) {
        var that = this;
    	var tblFields = this.tblFields[tbl];
    	var i, j;

    	that.funcs.mprint('search_msgs tbl='+tbl+' msgType='+msgType+' filter='+filter+' page='+page);

        this.db.transaction(
        	function (tx) {

        		var executeData = [];
        		var executeData_count = [];

        		var getSql = [];

        		for (i=0; i < tblFields.length; i++) {
        			j = tblFields[i]['name'];
       				getSql.push('p.'+j);
        		}

        		useOwn = false;//!!!

       		    var ownSql = '1';
       		    if (useOwn && tbl != 'groups') {
       		    	ownSql = "p.OwnUserId = ?";
       		    	executeData.unshift(that.user_id);
       		    	executeData_count.unshift(that.user_id);
       		    }

       		    var group_sql = '';
       		    var order_sql = '';

       		    orderBy = orderBy || "ORDER BY p.primaryKey DESC";

       		    order_sql = orderBy;

       		    //that.funcs.mprint(order_sql);

       		    if (!page && !onPage) {

                    tx.executeSql(
                    	"SELECT \
                    	 "+getSql.join(',')+" \
                    	 FROM "+tbl+" as p \
                    	 WHERE "+ownSql+" "+filter+" \
                    	 "+group_sql+order_sql
                    	 ,
                    	executeData,
                    	function (tx, results) {
                    		var array = that.resultCopy(tblFields, results);
                    		that.resultPrepare(tbl, msgType, array);
                    		callback(array, array.length);
                    	}
                    );
       		    } else {
       		        var distinctKey = (tbl == 'cron') ? 'p.rowid' : 'p.primaryKey';

       		        //that.funcs.mprint(Date.now());

                    tx.executeSql(
                    	"SELECT COUNT(DISTINCT "+distinctKey+") AS count \
                    	 FROM "+tbl+" as p \
                    	 WHERE "+ownSql+" "+filter
                    	 ,
                    	executeData_count,
                		function (tx, results) {
                			var array = that.resultCopy_oneField('count', results);
                    		var countAll = parseInt(array[0]);

               		    	var startPos;
                    		if (is_ordinal_pager) {
	               		    	startPos = (page-1)*onPage;

	               		    	startPos += offset;
	               		    	if (startPos < 0) {
	               		    		startPos = 0;
	               		    	}

                    		} else {
	               		    	startPos = countAll-(page*onPage);

	               		    	//!!! offset использовать?

	               		    	if (startPos < 0) {
	               		    		startPos = 0;
	               		    	}
                    		}

               		    	var limitCount = onPage;
               		    	var pagerSql = " LIMIT "+startPos+","+limitCount;

                            tx.executeSql(
                            	"SELECT \
                            	 "+getSql.join(',')+" \
                            	 FROM "+tbl+" as p \
                            	 WHERE "+ownSql+" "+filter+" \
                            	 "+group_sql+order_sql+pagerSql
                            	,
                            	executeData,
                        		function (tx, results) {
				       		        //that.funcs.mprint(Date.now());

                           			var array = that.resultCopy(tblFields, results);
                           			that.resultPrepare(tbl, msgType, array);

                        			callback(array, countAll);
                            	}
                            );
                    	}
                    );
       		    }

        	},
            function(sqlError) {
            	that.funcs.mprint('ERROR this.search_msgs tbl='+tbl+' filter='+filter);
            	that.funcs.mprint(sqlError);
            },
            function() {
            }
        );
    };

    this.get_list = function(tbl, filter, useOwn, callback) {
        var that = this;
    	var tblFields = this.tblFields[tbl];

        this.db.transaction(
        	function (tx) {

        		var executeData = [];

       		    var ownSql = '1';
       		    if (useOwn) {
       		    	ownSql = "OwnUserId = ?";
       		    	executeData.push(that.user_id);
       		    }

                tx.executeSql(
                	"SELECT * FROM "+tbl+" WHERE "+ownSql+" "+filter,
                    executeData,
            		function (tx, results) {
            			var array = that.resultCopy(tblFields, results);
            			callback(array);
                	}
                );
        	},
            function(sqlError) {
            	that.funcs.mprint('this.get_list '+tbl+' / '+filter+' / ');
            	that.funcs.mprint(sqlError);
            },
            function() {
            }
        );
    };

    this.get_list_primaryKey = function(tbl, filter, useOwn, keyField, callback) {
        var that = this;
    	keyField = keyField || 'primaryKey';

        this.db.transaction(
        	function (tx) {

        		var executeData = [];

       		    var ownSql = '1';
       		    if (useOwn) {
       		    	ownSql = "OwnUserId = ?";
       		    	executeData.push(that.user_id);
       		    }

                tx.executeSql(
                	"SELECT "+keyField+" FROM "+tbl+" WHERE "+ownSql+" "+filter,
                    executeData,
            		function (tx, results) {
            			callback(that.resultCopy_oneField(keyField, results));
                	}
                );
        	},
            function(sqlError) {
            	that.funcs.mprint('this.get_list_primaryKey '+tbl+' / '+filter+' / '+keyField);
            	that.funcs.mprint(sqlError);
            },
            function() {
            }
        );
    };

    this.insert_msgs = function(tbl, c, callback) {
        var that = this;

        if (!c.length) {
    	    if (typeof callback != 'undefined') {
            	return callback();
            }
        }

    	var tblFields = this.tblFields[tbl];
        this.db.transaction(
        	function (tx) {
		    	that.db.connection.beginTransaction();

                var len = c.length, i;

                var sql;
                for (i=0; i < len; i++) {

                    if (typeof c[i]['OwnUserId'] == 'undefined') {
                    	c[i]['OwnUserId'] = that.user_id; //!!! убрать отсюда и проставить в нужном массиве извне
                    }

                    sql = 'REPLACE INTO '+tbl+'('+that.sql_fields_for_insert_get(tblFields, c[i], true)+') VALUES('+that.sql_fields_for_insert_quest_get(tblFields, c[i], true)+')';

                    tx.executeSql(
                    	sql,
                    	that.sql_data_fill(tblFields, c[i]),
                    	function (tx, results) {}
                    );
                }
		    	that.db.connection.commitTransaction();

    	        if (typeof callback != 'undefined') {
                	callback();
                }

        	},
            function(sqlError) {
            	that.funcs.mprint('this.insert_msgs tbl='+tbl);
            	that.funcs.mprint(sqlError);
            	that.funcs.mprint(c);
            },
            function() {
            }
        );
    };

    this.insert_msgs_getPrimaryKey = function(tbl, c, callback) {
        var that = this;

        if (!c.length) {
           	return callback(c);
        }

    	var tblFields = this.tblFields[tbl];

        that.db.transaction(
        	function (tx) {

                var len = c.length, i;

        	    var query = [];

                var sql, e, f;
                for (i=0; i < len; i++) {

                	e = c[i];

                    if (typeof e['OwnUserId'] == 'undefined') {
                    	e['OwnUserId'] = that.user_id; //!!! убрать отсюда и проставить в нужном массиве извне
                    }

                    query.push(
                    	Q.Promise(function(resolve, reject, notify) {

                            sql = 'INSERT INTO '+tbl+'('+that.sql_fields_for_insert_get(tblFields, e, true)+') VALUES('+that.sql_fields_for_insert_quest_get(tblFields, e, true)+')';

                            tx.executeSql(
                            	sql,
                            	that.sql_data_fill(tblFields, e),
                            	function (tx, results) {

                                	var lastInsertId = results.insertId;

                                    resolve(lastInsertId);
                            	},

                            	function() {
                                    reject(0);
                            	}
                            );
                    	})
                    );
                }

            	Q.allSettled(query).then(function(values) {
            		var result;

        	        for (i=0; i < len; i++) {
        	        	result = values[i];

          				if (result.state === "fulfilled") {
        	                c[i]['primaryKey'] = result.value;
                		} else {
                			//result.reason

        	                c[i]['primaryKey'] = 0;
                		}
                	}

                    callback(c);
                });


        	},

            function(sqlError) {
            	that.funcs.mprint('this.insert_msgs_getPrimaryKey tbl='+tbl);
            	that.funcs.mprint(sqlError);
            	that.funcs.mprint(e);
            },

            function() {
            }
        );


    };

    this.update_msgs = function(tbl, c, useOwn, fieldsWhere, callback) {
        var that = this;

        if (!c.length) {
    	    if (typeof callback != 'undefined') {
            	return callback();
            }
        }

    	var tblFields = this.tblFields[tbl];
        this.db.transaction(
        	function (tx) {
		    	that.db.connection.beginTransaction();

                var lenf,
                	j;

        		var tblNotOwn = [
        			"forums",
        			"topics",
        			"topic_comments",
        			"ffeed",
        			"ffeed_comments",
        			"gallery_items",
        			"gallery_comments",
        			"gallery"
        		];

        		if (tblNotOwn.indexOf(tbl) != -1) {
        			useOwn = false;
        		}

                if (!fieldsWhere) {
                	fieldsWhere = ["primaryKey"];
                }

        		var executeData = [], executeDataF;

        		var fieldsWhere_sql = '';
        		lenf = fieldsWhere.length;
                for (i=0; i < lenf; i++) {
       		    	fieldsWhere_sql += " AND "+fieldsWhere[i]+" = ?";
                }

       		    if (useOwn) {
       		    	fieldsWhere_sql += " AND OwnUserId = ?";
       		    	executeData.push(that.user_id);
       		    }

                var len = c.length, i, update_sql;
                for (i=0; i < len; i++) {

                	executeDataF = [];
                    for (j=0; j < lenf; j++) {
           		    	executeDataF.push(c[i][fieldsWhere[j]]);
                    }

                    if (typeof c[i]['OwnUserId'] == 'undefined') {
    	                c[i]['OwnUserId'] = that.user_id; //!!!! убрать
    	            }

         		    update_sql = that.sql_fields_for_update_get(tblFields, c[i]);

         		    if (update_sql) {
                        tx.executeSql(
                        	'UPDATE '+tbl+' SET '+ update_sql + fieldsWhere_sql,
                        	that.sql_data_fill_update(tblFields, c[i]).concat(executeDataF).concat(executeData),
                        	function (tx, results) {
                                if (0&&results.rowsAffected > 0) {
                                	//...
                                }
                        	}
                        );
                    }
                }
		    	that.db.connection.commitTransaction();

                if (typeof callback != 'undefined') {
                	callback();
                }

        	},
            function(sqlError) {
            	that.funcs.mprint('this.update_msgs tbl='+tbl);
            	that.funcs.mprint(c);
            	that.funcs.mprint(sqlError);
            },
            function() {
            }
        );
    };

    this.delete_msgs = function(tbl, c, useOwn, fieldsWhere, callback) {
        var that = this;

        if (!c.length) {
    	    if (typeof callback != 'undefined') {
            	return callback();
            }
        }

    	var tblFields = this.tblFields[tbl];
        this.db.transaction(
        	function (tx) {
		    	that.db.connection.beginTransaction();

                var len,
                	i,
                	lenf,
                	j;

        		var executeData = [],
        			executeDataF;

         		if (tbl == 'events') {
         			//fieldsWhere.push('msgType');
         		}

        		var fieldsWhere_sql = '';
        		lenf = fieldsWhere.length;
                for (i=0; i < lenf; i++) {
       		    	fieldsWhere_sql += " AND "+fieldsWhere[i]+" = ?";
                }

       		    if (useOwn) {
       		    	fieldsWhere_sql += " AND OwnUserId = ?";
       		    	executeData.push(that.user_id);
       		    }

                len = c.length;
                for (i=0; i < len; i++) {

                	executeDataF = [];
                    for (j=0; j < lenf; j++) {
           		    	executeDataF.push(c[i][fieldsWhere[j]]);
                    }

                    tx.executeSql(
                    			'DELETE FROM '+tbl+' WHERE 1'+fieldsWhere_sql,
                    			executeDataF.concat(executeData),
                    			function (tx, results) {

                    			}
                    );
                }
		    	that.db.connection.commitTransaction();

                if (typeof callback != 'undefined') {
                	callback();
                }

        	},
            function(sqlError) {
            	that.funcs.mprint('this.delete_msgs');
            	that.funcs.mprint(sqlError);
            },
            function() {
            }
        );
    };

    //!!! переделать в IN()
    this.delete_msgs_by_primaryKey = function(tbl, c, useOwn, field, callback) {
        var that = this;

        if (!c.length) {
    	    if (typeof callback != 'undefined') {
            	return callback();
            }
        }

    	var tblFields = this.tblFields[tbl];
        this.db.transaction(
        	function (tx) {
		    	that.db.connection.beginTransaction();

                var len,
                	i;

        		var executeData = [],
        			executeDataF;

        		var fieldsWhere_sql = '';
   		    	fieldsWhere_sql += " AND `"+field+"` = ?";

       		    if (useOwn) {
       		    	fieldsWhere_sql += " AND OwnUserId = ?";
       		    	executeData.push(that.user_id);
       		    }

                len = c.length;
                for (i=0; i < len; i++) {

                	executeDataF = [];
       		    	executeDataF.push(c[i]);

                    tx.executeSql(
                    			'DELETE FROM '+tbl+' WHERE 1'+fieldsWhere_sql,
                    			executeDataF.concat(executeData),
                    			function (tx, results) {

                    			}
                    );
                }
		    	that.db.connection.commitTransaction();

                if (typeof callback != 'undefined') {
                	callback();
                }

        	},
            function(sqlError) {
            	that.funcs.mprint('this.delete_msgs_by_primaryKey');
            	that.funcs.mprint(sqlError);
            },
            function() {
            }
        );
    };

    this.empty_table = function(tbl, useOwn, callback) {
        var that = this;
    	var tblFields = this.tblFields[tbl];
        this.db.transaction(
        	function (tx) {

        		var executeData = [];
        		var fieldsWhere_sql = '';

       		    if (useOwn) {
       		    	fieldsWhere_sql += " AND OwnUserId = ?";
       		    	executeData.push(that.user_id);
       		    }

                tx.executeSql(
                	'DELETE FROM '+tbl+' WHERE 1'+fieldsWhere_sql,
                	executeData,
                	function (tx, results) {
                        if (0&&results.rowsAffected > 0) {
                        	//...
                        }
                	}
                );

        	},
            function(sqlError) {
            	that.funcs.mprint('this.empty_table');
            	that.funcs.mprint(sqlError);
            },
            function() {
                if (typeof callback != 'undefined') {
                	callback();
                }
            }
        );
    };

    this.table_delete = function(tbl, filter, useOwn, callback) {
        var that = this;

    	var tblFields = this.tblFields[tbl];
        this.db.transaction(
        	function (tx) {

        		var executeData = [];
        		var fieldsWhere_sql = '';

       		    if (useOwn) {
       		    	fieldsWhere_sql += " AND OwnUserId = ?";
       		    	executeData.push(that.user_id);
       		    }

                tx.executeSql(
                	'DELETE FROM '+tbl+' WHERE 1'+fieldsWhere_sql+filter,
                	executeData,
                	function (tx, results) {
                	}
                );

        	},
            function(sqlError) {
            	that.funcs.mprint('this.table_delete');
            	that.funcs.mprint(sqlError);
            },
            function() {
                if (typeof callback != 'undefined') {
                	callback();
                }
            }
        );
    };

    this.counts_change = function(tbl, countsAll, countsNew, countsStar, filter, useOwn, callback) {
        var that = this;
    	var tblFields = this.tblFields[tbl];
        this.db.transaction(
        	function (tx) {

        		var executeData = [countsAll, countsNew, countsStar];
        		var fieldsWhere_sql = '';

       		    if (useOwn) {
       		    	fieldsWhere_sql += " AND OwnUserId = ?";
       		    	executeData.push(that.user_id);
       		    }

                tx.executeSql(
                	'UPDATE '+tbl+' SET counts=counts+?, countsNew=countsNew+?, countsStar=countsStar+? WHERE 1'+fieldsWhere_sql+filter,
                	executeData,
                	function (tx, results) {
		               	callback();
                	}
                );

        	},
            function(sqlError) {
            	that.funcs.mprint('this.counts_change');
            	that.funcs.mprint(sqlError);
            },
            function() {
            }
        );
    };

    this.events_new_zero = function(filter, useOwn, callback) {
        var that = this;
        var tbl = "events";
        this.db.transaction(
        	function (tx) {

        		var executeData = [];
        		var fieldsWhere_sql = '';

       		    if (useOwn) {
       		    	fieldsWhere_sql += " AND OwnUserId = ?";
       		    	executeData.push(that.user_id);
       		    }

                tx.executeSql(
                	'UPDATE '+tbl+' SET New=0 WHERE 1'+fieldsWhere_sql+filter,
                	executeData,
                	function (tx, results) {
		               	callback();
                	}
                );

        	},
            function(sqlError) {
            	that.funcs.mprint('this.events_new_zero');
            	that.funcs.mprint(sqlError);
            },
            function() {
            }
        );
    };

    this.feeds_new_zero = function(filter, useOwn, callback) {
        var that = this;
        var tbl = "feeds";
        this.db.transaction(
        	function (tx) {

        		var executeData = [];
        		var fieldsWhere_sql = '';

       		    if (useOwn) {
       		    	fieldsWhere_sql += " AND OwnUserId = ?";
       		    	executeData.push(that.user_id);
       		    }

                tx.executeSql(
                	'UPDATE '+tbl+' SET countsNew=0 WHERE 1'+fieldsWhere_sql+filter,
                	executeData,
                	function (tx, results) {
		               	callback();
                	}
                );

        	},
            function(sqlError) {
            	that.funcs.mprint('this.feeds_new_zero');
            	that.funcs.mprint(sqlError);
            },
            function() {
            }
        );
    };

    this.events_count_get = function(filter, useOwn, callback) {
        var that = this;
        var tbl = "events";
        this.db.transaction(
        	function (tx) {

                var tblFields = [
                	{"name" : "countsNew", 	"type" : "INTEGER"}
                ];

        		var executeData = [];
        		var fieldsWhere_sql = '';

       		    if (useOwn) {
       		    	fieldsWhere_sql += " AND OwnUserId = ?";
       		    	executeData.push(that.user_id);
       		    }

                tx.executeSql(
                	'SELECT SUM(New) AS countsNew FROM '+tbl+' WHERE 1'+filter,
                	[],
            		function (tx, results) {
               			var array = that.resultCopy(tblFields, results);
            			callback(array);
                	}
                );

        	},

            function(sqlError) {
            	that.funcs.mprint('this.events_count_get');
            	that.funcs.mprint(sqlError);
            },

            function() {
            }
        );
    };

    this.table_update = function(msgs, tbl, useOwn, fieldsToUpdate, fieldToCheckUnique, callback) {
        var that = this;
    	var tblFields = this.tblFields[tbl];
        this.db.transaction(
        	function (tx) {

        		var executeData = [];
       		    var ownSql = ' AND 1';
       		    if (useOwn) {
       		    	ownSql = " AND OwnUserId = ?";
       		    	executeData.push(that.user_id);
       		    }

                tx.executeSql(
                	'SELECT * FROM '+tbl+' WHERE 1'+ownSql,
                	executeData,
            		function (tx, results) {
				    	that.db.connection.beginTransaction();

               			var array = that.resultCopy(tblFields, results);

               			var array_added = [];

            		    var urlIndex = [];
                        var len = array.length, i, j, k, f = fieldsToUpdate, flen = fieldsToUpdate.length;
                        for (i = 0; i < len; i++) {
                        	urlIndex.push(array[i][fieldToCheckUnique]);
                        }

                        len = msgs.length;
                        for (i = 0; i < len; i++) {

    			   		    if (useOwn) {
        			            msgs[i]['OwnUserId'] = that.user_id; //!!!!
        			        }

                        	j = urlIndex.indexOf(msgs[i][fieldToCheckUnique]);

                        	if (j == -1) {

                        		array_added.push(msgs[i]);

                                tx.executeSql(
                                	'INSERT INTO '+tbl+' ('+that.sql_fields_for_insert_get(tblFields, msgs[i], true)+') VALUES ('+that.sql_fields_for_insert_quest_get(tblFields, msgs[i], true)+')',
                                	that.sql_data_fill(tblFields, msgs[i]),
                                	function (tx, results) {
                                        if (0&&results.rowsAffected > 0) {
                                        	//...
                                        }
                                	}
                                );

                        	} else {

                        		for (k=0; k < flen; k++) {
                            		if (typeof msgs[i][f[k]] != 'undefined') {
        	                    		array[j][f[k]] = msgs[i][f[k]];
        	                    	}
                        		}

                        		if (array[j][fieldToCheckUnique]) {
                        			var datas = that.sql_data_fill_update(tblFields, array[j], false);

                        			if (useOwn) {
                        				datas = datas.concat(that.user_id);
                        			}

                                    tx.executeSql(
                                    	'UPDATE '+tbl+' SET '+that.sql_fields_for_update_get(tblFields, array[j], false)+" AND "+fieldToCheckUnique+"='"+array[j][fieldToCheckUnique]+"'"+ownSql,
                                    	datas,
                                    	function (tx, results) {
                                            if (0&&results.rowsAffected > 0) {
                                            	//...
                                            }
                                    	}
                                    );
                                }
                        	}
                        }
				    	that.db.connection.commitTransaction();

                        if (typeof callback != 'undefined') {
    	                    callback(array_added);
    	                }
                	}
                );
        	},
            function(sqlError) {
            	that.funcs.mprint('this.table_update() tbl='+tbl+' fieldsToUpdate='+fieldsToUpdate+' fieldToCheckUnique='+fieldToCheckUnique);
            	that.funcs.mprint('msgs.length = '+msgs.length);
            	that.funcs.mprint(sqlError);
            },
            function() {
            }
        );
    };

    this.table_get = function(tbl, filter, callback) {
        var that = this;
    	var tblFields = this.tblFields[tbl];
        this.db.transaction(
        	function (tx) {
                tx.executeSql(
                	'SELECT * FROM '+tbl+' WHERE 1'+filter,
                	[],
            		function (tx, results) {
               			var array = that.resultCopy(tblFields, results);
            			callback(array);
                	}
                );
        	},
            function(sqlError) {
            	that.funcs.mprint('this.table_get() tbl='+tbl);
            	that.funcs.mprint(sqlError);
            },
            function() {
            }
        );
    };

    this.folders_get = function(filter, callback) {
        var that = this;
        var tbl = 'folders';
    	var tblFields = this.tblFields[tbl];

        this.db.transaction(
        	function (tx) {

        		var executeData = [];
       		    var ownSql = " AND p.OwnUserId = ?";
    	    	executeData.push(that.user_id);

                tx.executeSql(
                	"SELECT \
                			p.* \
                	 FROM "+tbl+" AS p \
                	 WHERE 1 "+filter+ownSql+" \
                	 ORDER BY root_id ASC, orderBy DESC",
                	executeData,
            		function (tx, results) {
               			var array = that.resultCopy(tblFields, results);
            			callback(array);
                	}
                );
        	},
            function(sqlError) {
            	that.funcs.mprint('this.folders_get');
            	that.funcs.mprint(sqlError);
            },
            function() {
            }
        );
    };

    this.feeds_get = function(filter, callback) {
        var that = this;
        var tbl = 'feeds';
    	var tblFields = this.tblFields[tbl];

        this.db.transaction(
        	function (tx) {

        		var executeData = [];
       		    var ownSql = " AND p.OwnUserId = ?";
    	    	executeData.push(that.user_id);

                tx.executeSql(
                	"SELECT \
                			p.* \
                	 FROM "+tbl+" AS p \
                	 WHERE 1 "+filter+ownSql+" \
                	 ORDER BY timeAdd DESC",
                	executeData,
            		function (tx, results) {
               			var array = that.resultCopy(tblFields, results);
            			callback(array);
                	}
                );
        	},
            function(sqlError) {
            	that.funcs.mprint('this.feeds_get');
            	that.funcs.mprint(sqlError);
            },
            function() {
            }
        );
    };

    this.truncate_table = function(tbl, filter, callback) {
        var that = this;

    	var tblFields = this.tblFields[tbl];

        this.db.transaction(
        	function (tx) {

        		var executeData = [];

                tx.executeSql(
                	"\
                	DELETE FROM \
                	 "+tbl+" \
                	 WHERE 1"+filter,
                	executeData,
                	function (tx, results) {
                		callback();
                	}
                );

        	},
            function(sqlError) {
            	that.funcs.mprint('this.truncate_table() tbl='+tbl);
            	that.funcs.mprint(sqlError);
            },
            function() {
            }
        );
    };

    this.child_move = function(c, group_key, dontmove, sortFunc) {
    	var i, j, len = c.length, e, r = [], childs = [];

    	var index = [];
    	var inner_index = [];

    	for (i=len-1; i >= 0; i--) {
    		e = c[i];
    		if (e[group_key]) {
    			childs.push(e);
    		} else {
    			r.push(e);
    			index[e.primaryKey] = r.length-1;
    		}
    	}

    	len = childs.length;
    	if (len) {
    		for (i=0; i < len; i++) {
    			e = childs[i];
    			j = index[e[group_key]];
    			if (typeof j != 'undefined') {
    				if (typeof r[j]['innerList'] == 'undefined') {
    					r[j]['innerList'] = [];
    					inner_index[e[group_key]] = j;
    				}
    				r[j]['innerList'].push(e);
    			}
    		}

    		for (i in inner_index) {
    			j = index[i];
    			e = r[j];
    			if (sortFunc) {
    				e['innerList'].sort(sortFunc);
    			}
    		}

    		len = r.length;

    		if (!dontmove) {
        		c = [];

        		for (i=0; i < len; i++) {
        			e = r[i];
        			if (typeof e['innerList'] != 'undefined') {
        				childs = e['innerList'];

        				delete e['innerList'];

        				for (j=0; j < childs.length; j++) {
        					c.push(childs[j]);
        				}
        				c.push(e);

        			} else {
        				c.push(e);
        			}
        		}
        		r = c;
        	}
    	}

    	r.reverse();

    	return r;
    };

    this.sql_fields_for_create_get = function(arr) {
        var ret = [];
        var i, len;

        len = arr.length;
        for (i=0; i < len; i++) {
        	ret.push(arr[i]['name']+' '+arr[i]['type']+(typeof arr[i]['default'] == 'undefined' ? '' : " DEFAULT '"+arr[i]['default']+"'"));
        }

     	return ret.join(', ');
    };

    this.sql_fields_for_insert_get = function(arr, el, is_check_el) {
    	is_check_el = is_check_el || false;
        var ret = [];
        var i, len, field;

        len = arr.length;
        for (i=0; i < len; i++) {
       		field = arr[i]['name'];
        	if (!is_check_el || (is_check_el && (typeof el == 'undefined' || (typeof el != 'undefined' && typeof el[field] != 'undefined')))) {
    	   		ret.push(field);
    	    }
        }

     	return ret.join(',');
    };

    this.sql_fields_for_insert_quest_get = function(arr, el, is_check_el) {
    	is_check_el = is_check_el || false;
        var ret = [];
        var i, len, field;

        len = arr.length;
        for (i=0; i < len; i++) {
       		field = arr[i]['name'];
        	if (!is_check_el || (is_check_el && (typeof el == 'undefined' || (typeof el != 'undefined' && typeof el[field] != 'undefined')))) {
    	    	ret.push('?');
    	    }
        }

     	return ret.join(',');
    };

    this.sql_fields_for_update_get = function(arr, el, usePrimary_override) {
        if (typeof usePrimary_override == 'undefined') usePrimary_override = true;

    	var usePrimary = false;

        var ret = [];
        var i, len, field;

        len = arr.length;
        for (i=0; i < len; i++) {
        	if ((arr[i]['name'] != 'primaryKey' && usePrimary_override) || !usePrimary_override) {
        		field = arr[i]['name'];
        		if (typeof el[field] != 'undefined') {
    	    		ret.push(arr[i]['name']+'=?');
    	    	}
        	} else {
        		usePrimary = true;
        	}
        }

        if (!ret.length) return false;

        var ret_ = ret.join(', ')+' WHERE 1';

        if (usePrimary && usePrimary_override) {
        	ret_ += ' AND primaryKey = ?';
        }

     	return ret_;
    };

    this.sql_data_fill = function(arr, el) {
        var ret = [];
        var i, len, field, type;

        len = arr.length;
        for (i=0; i < len; i++) {
        	field = arr[i]['name'];
        	type = arr[i]['type'];

        	if (typeof el[field] != 'undefined') {
    	   		ret.push(el[field]);
    	   	} else {
    	   		if (type.indexOf('PRIMARY KEY') != -1) {
    		   		//!!! del ret.push('NULL');
    		   	}
    	   	}
        }

     	return ret;
    };

    this.escape = function(s) {
        s = (''+s).replace(/'/ig, "''");
    	return s;
    };

    this.print_in = function(arr, s) {
        var ret = [];
        var i, len;

        len = arr.length;
        for (i=0; i < len; i++) {
   	   		ret.push(s + this.escape(arr[i]) + s);
        }

     	return 'IN('+ret.join(',')+')';
    };

    this.sql_data_fill_update = function(arr, el, usePrimary_override) {
        if (typeof usePrimary_override == 'undefined') usePrimary_override = true;

        var ret = [];
        var i, len, field;

        var usePrimary = false;

        len = arr.length;
        for (i=0; i < len; i++) {
        	if ((arr[i]['name'] != 'primaryKey' && usePrimary_override) || !usePrimary_override) {
        		field = arr[i]['name'];
        		if (typeof el[field] != 'undefined') {
    	   			ret.push(el[field]);
    	   		}
        	} else {
        		usePrimary = true;
        	}
        }

        if (usePrimary && usePrimary_override) {
    		ret.push(el['primaryKey']);
    	}

     	return ret;
    };

    this.table_max_get = function(tbl, callback) {
        var that = this;
        this.db.transaction(
        	function (tx) {
                tx.executeSql(
                	"SELECT max(primaryKey) AS primaryKey FROM "+tbl+" WHERE 1 LIMIT 1",
                	[],
            		function (tx, results) {
                		var array = that.resultCopy_oneField('primaryKey', results);
                    	var primaryKey = parseInt(array[0]);
                		if (!primaryKey) primaryKey = 0;
                		callback(primaryKey);
                	}
                );
        	},
            function(sqlError) {
            	that.funcs.mprint('this.table_max_get tbl='+tbl);
            	that.funcs.mprint(sqlError);
            },
            function() {
            }
        );
    };


    this.cron_update = function(arr, callback) {
        var that = this;

        if (!arr.length) return callback();

        this.search_msgs(
        	"cron",
        	"",
        	" ",
        	" ",
        	true,
        	0, 0,
        	true,
        	0,
        	function(c) {
                var cAdded = [], cUpdate = [], isAdd, i, e, clen = c.length, len = arr.length;

                if (clen) {
                    for (i=0; i < len; i++) {
                    	e = arr[i];

                    	if (e['eventKey'] == 0) {
    	        			isAdd = that.funcs.get_el_by_fields(c, {"msgType" : e['msgType'], "url" : e['url']});
                    	} else {
    	        			isAdd = that.funcs.get_el_by_fields(c, {"msgType" : e['msgType'], "eventKey" : e['eventKey']});
                    	}
    	    			if (isAdd == -1) {
    	               		cAdded.push(e);
    	    			} else {
    	               		cUpdate.push(e);
    	    			}
                    }

                } else {
                	cAdded = arr;
                }

                len = cAdded.length;
                if (len) {
    	            that.insert_msgs('cron', cAdded, function() {
    	            	if (!cUpdate.length) {
			                callback();
			            }
    	            });
                }

                len = cUpdate.length;
                if (len) {
    	            that.update_msgs('cron', cUpdate, true, ["msgType", "eventKey", "url"], function() { //, "timeNextUpdate"
    	            	if (!cAdded.length) {
			                callback();
			            }
    	            });
                }

            	if (!cAdded.length && !cUpdate.length) {
	                callback();
	            }
        	}
        );
    };
};

if (typeof exports != 'undefined') {
    exports.init = function() {
    	return Storage;
    };
}
