var Rss = {
    name:                          'Rss parser',
    version:                        1.102,
    copyright:                     '(c) Eugene Ivanov, 2013...now e-ivanov.ru/projects/read-rss/ eugene.ivanov@gmail.com',


    xml_http_types : [
    	'text/xml',
		'application/rss+xml',
		'application/atom+xml',
		'application/rdf+xml'
    ],

    init: function(core) {
        this.core = core;
    },

    //!!! продумать насчёт, вероятно, добавить дату или автора
    xml_get_guid : function(e, title, descr, base_domain) {
    	var s = "";

    	if (typeof e.guid != 'undefined') {
    		s = this.xml_get_text(e.guid);

    		// fix bug http://e-ivanov.ru/blog/2015/10/20/prividenija-v-kode/
    		var j = s.indexOf('://');
            if (j != -1 && base_domain != "") {
            	var base_domain_parsed = this.parse_url(base_domain);
                base_domain_parsed = base_domain_parsed.scheme+'://';
            	s = s.replace(/^https*:\/\/(.*?)$/i, base_domain_parsed+'$1');
            }

    	} else if (typeof e.id != 'undefined') {
	    	s = this.xml_get_text(e.id);
    	} else {
    		if (!title && !descr) {
				s = this.xml_get_link(e, "");
    		} else {
		    	s = this.core.hex_md5(title + (descr+'').substr(0, 512));
    		}
    	}

    	return s;
    },

    xml_text_cdata_decode : function(r) {
    	var that = this;

        var e = r.split(/<!\[CDATA\[/mig);

        var s = [];

        var i, l = e.length, t;
        for (i=0; i < l; i++) {
        	t = e[i];

        	if (!i%2) {
        		t = this.xml_text_nocdata_decode(t);
        	} else {
				t = t.replace(/\]\]>/igm, '');
        	}

            s.push(t);
        }

        r = s.join('');

        delete s;
        delete t;
        delete e;

		return r;
    },

    xml_text_nopre_decode : function(r) {
    	r = r.replace(/&lt;/gm, '<');
    	r = r.replace(/&gt;/gm, '>');
		r = r.replace(/&amp;/gm, '&');

		return r;
    },

    xml_text_nocdata_decode : function(r) {
        var e = r.split(/<pre/mig);

        if (e.length > 1) {

            var s = [];

            var i, l = e.length, t, j;
            for (i=0; i < l; i++) {
            	t = e[i];

            	if (!i%2) {
		        	t = this.xml_text_nopre_decode(t);
            	} else {
            		j = t.indexOf('</pre>');
            		if (j != -1) {
            		    //!!!?? <pre &amp; ??
			        	t = t.substr(0, j)+'</pre>'+this.xml_text_nopre_decode(t.substr(j+6));
            		}
            	}

                s.push(t);
            }

            r = s.join('<pre');

            delete s;
            delete t;
            delete e;

        } else {
        	r = this.xml_text_nopre_decode(r);
        }

		return r;
    },

    xml_get_text : function(s) {
        var r;

    	if (!s) {
    		return "";
    	}

    	var is_cdata = false;

	    if (typeof s == 'object' && s) {
	    	if (typeof s['#text'] != 'undefined') {
		    	r = s['#text'];
		    }
	    	if (typeof s['#cdata'] != 'undefined') {
		    	r = s['#cdata'];

		    	is_cdata = true;
		    }
	    	if (typeof s['@term'] != 'undefined') {
		    	r = s['@term'];
		    }
	    	if (typeof s['@text'] != 'undefined') {
		    	r = s['@text'];
		    }
	    } else {
			r = s;
	    }
	    r = r || "";
	    r = (r+'').trim();

	    r = r.replace(/\\"/igm, '"');
	    r = r.replace(/\\r/igm, '\r');
	    r = r.replace(/\\n/igm, '\n');


	    //http://feeds.feedburner.com/css-live
	    if (r.indexOf('<![CDATA[') != -1 || is_cdata) {

	    	if (!is_cdata) {
		    	r = this.xml_text_cdata_decode(r);
		    }

	    } else {
	    	r = this.xml_text_nocdata_decode(r);
	    }

	    r = (r+'').trim();

	    return r || "";
    },

    xml_cut_nl_tab : function(s) {
	    s = (s+'').trim();
	    s = s.replace(/\\r/igm, '\r');
	    s = s.replace(/\\n/igm, '\n');
	    s = s.replace(/\r/igm, '\n');
	    s = s.replace(/\n{2,}/igm, '\n');
	    s = s.replace(/\t{2,}/igm, '\t');
	    s = s.replace(/[\n\t]+/igm, ' ');
	    s = s.trim();
		return s;
	},

    xml_get_author : function(s, field) {
    	if (!s) return "";

	    if (typeof s == 'object' && s && typeof s[field] != 'undefined') {
	    	s = this.xml_get_text(s[field]);
	    } else {
	    	s = this.xml_get_text(s);
		    if (field != 'name') {
		    	s = "";
		    }
	    }

	    return s;
    },

    xml_get_array : function(s) {
	    if (typeof s == 'object' && s && s.length) {
        	var l = s.length;
            for (var i=0; i < l; i++) {
        		s[i] = this.xml_get_text(s[i]);
            }
        } else {
        	s = this.xml_get_text(s);
        	if (!s) {
				s = [];
        	} else {
				s = [s];
        	}
        }

	    return s;
    },

    xml_get_category : function(s) {
        var e = s['category'] || s['dc:subject'] || s['atom:category'] || s['itunes:category'] || null;
        if (!e) return "";
        var index = [];

	    if (typeof e == 'object' && e && e.length) {
	        s = [];

        	var l = e.length, tag;
            for (var i=0; i < l; i++) {
            	if (!e[i]) {
            		continue;
            	}

        		tag = this.xml_get_text(e[i]);

        		if (index.indexOf(tag) != -1) {
        			continue;
        		}
        		index.push(tag);

		    	if (typeof e[i]['@label'] != 'undefined') {
	        		e[i] = [tag, e[i]['@label']];
	            } else {
	            	e[i] = tag;
	            }
	            s.push(e[i]);
            }

            e = s;

        } else {
        	e = this.xml_get_text(e);
        	if (!e) {
				return "";
        	} else {
        		if (e.indexOf('/') != -1) {
        			e = e.split(/\//ig);

        			s = [];

                	var l = e.length, tag;
                    for (var i=0; i < l; i++) {
                    	if (!e[i]) {
                    		continue;
                    	}

                		tag = e[i];

                		if (index.indexOf(tag) != -1) {
                			continue;
                		}
                		index.push(tag);

        	            s.push(tag);
                    }

                    e = s;

        		} else {
					e = [e];
        		}
        	}
        }

	    return e;
    },

    url_base_set : function(url, base_domain) {
        if (url && url.indexOf('://') == -1 && url.indexOf('mailto:') == -1 && base_domain != "") {
            if (url.substr(0, 1) != '/') {
            	url = '/'+url;
            }

    		if (url.substr(0, 2) == '//') {
	            url = 'http:' + url;
	    	} else {
	            url = base_domain + url;
	    	}
        }
        return url;
    },

    xml_get_enclosure : function(s, base_domain) {
        var that = this;

        var e = s['enclosure'] || null;

	    if (typeof e == 'object' && e) {
	    	if (!e.length) {
	    		e = [e];
	    	}
	    } else {
	    	e = [];
	    }

    	var lnk = s.link, i;
	    if (typeof lnk == 'object' && lnk) {
	    	if (!lnk.length) {
	    		lnk = [lnk];
	    	}

        	var l = lnk.length;
            for (i=0; i < l; i++) {
        		if (	typeof lnk[i]['@rel'] != 'undefined' &&
        				lnk[i]['@rel'] == 'enclosure' &&
        				typeof lnk[i]['@href'] != 'undefined'
        			) {
        			e.push(lnk[i]);
        		}
            }
        }

        var ret = [];

        var l = e.length, url, type, len, title, ee;
        for (i=0; i < l; i++) {
        	url = "";
        	type = "image/jpeg";
        	len = 0;
        	title = "";

			if (typeof e[i]['@url'] != 'undefined') {
	    		url = (e[i]['@url']+'').trim();
	        }
			if (typeof e[i]['@type'] != 'undefined') {
	    		type = (e[i]['@type']+'').trim();
	        }
			if (typeof e[i]['@length'] != 'undefined') {
	    		len = e[i]['@length']|0;
	        }
			if (typeof e[i]['@title'] != 'undefined') {
	    		title = (e[i]['@title']+'').trim();
	        }
	        if (url && type) {

	        	url = that.url_base_set(url, base_domain);

	        	ee = [url, type, len];
	        	if (title) {
	        		ee.push(title);
	        	}
	        	ret.push(ee);
	        }
        }

        if (!ret.length) {
        	ret = "";
        }

	    return ret;
    },

    geo_tags : [
    	"geo:Point",

    	"geo:lat",
    	"geo:long",

    	"icbm:lat",
    	"icbm:lon",

    	"icbm:latitude",
    	"icbm:longitude",

    	"geourl:latitude",
    	"geourl:longitude",

    	"georss:where",

    	"georss:circle",
    	"georss:point",
    	"georss:line",
    	"georss:polygon",
    	"georss:box",

    	"georss:featuretypetag",
    	"georss:relationshiptag",
    	"georss:featurename",

    	"geo:alt",
    	"georss:elev",
    	"georss:floor",
    	"georss:radius"
    ],

    xml_get_geo : function(s) {
        var that = this;

        var e = {};

        var re = /^(tt|geo|georss|geourl|icbm):(\w+)$/i, mm, i, j, ns, tag;
        var exists = false;

        for (i in s) {
        	if (re.test(i)) {
        		j = i.toLowerCase();

        		mm = j.match(re);
        		if (mm) {
        			exists = true;

        			ns = mm[1];
        			tag = mm[2];
        			val = s[i];

        			if (tag == 'point') {
        				if (ns == 'geo' && typeof val == 'object') {
        					val = this.xml_get_geo(val);
        					if (typeof val[tag] != 'undefined') {
	    	        			e[tag] = val[tag];
        					}
        					if (typeof val['alt'] != 'undefined') {
	    	        			e['alt'] = val['alt'];
        					}
        				} else {
    	        			e[tag] = that.xml_cut_nl_tab(this.xml_get_text(val));

        					if (typeof val['@relationshiptag'] != 'undefined') {
	    	        			e[tag+':relationshiptag'] = val['@relationshiptag'];
        					}

        					if (typeof val['@featuretypetag'] != 'undefined') {
	    	        			e[tag+':featuretypetag'] = val['@featuretypetag'];
        					}
        				}
        				val = (e[tag]+'').split(/\s/i);
        				if (val && val.length == 2) {
        					e[tag] = {"lat" : val[0], "lng" : val[1]};
        				}

        			} else if (tag == 'where') {
        				e = this.xml_get_gml(val);
        			} else {
            			if (["lat", "long", "lon", "latitude", "longitude"].indexOf(tag) != -1) {
            				if (typeof e['point'] == 'undefined') {
            					e['point'] = {};
            				}
            				if (tag.indexOf('lat') == -1) {
    		        			e['point']['lng'] = val;
            				} else {
    		        			e['point']['lat'] = val;
            				}
            			} else {
            				if (typeof val != 'object') {
	    	        			e[tag] = that.xml_cut_nl_tab(this.xml_get_text(val));
	    	        		} else {
	    	        			if (val) {
		    	        			e[tag] = val;
		    	        		}
	    	        		}
            			}
        			}
        		}
        	}
        }

        if (typeof e['point'] != 'undefined') {
        	e['point'] = e['point']['lat'] + ' ' + e['point']['lng'];
        }

        var ret = !exists ? '' : JSON.stringify(e);

	    return ret;
    },

    xml_get_gml : function(s) {
        var that = this;

        var e = {};

        var re = /^(gml):(\w+)$/i, mm, i, j, ns, tag, t;
        var exists = false;

        for (i in s) {
        	if (re.test(i)) {
        		j = i.toLowerCase();

        		mm = j.match(re);
        		if (mm) {
        			exists = true;

        			ns = mm[1];
        			tag = mm[2];
        			val = s[i];

        			if (tag == 'point') {
        				if (typeof val == 'object') {
        					if (typeof val['gml:pos'] != 'undefined') {
	    	        			e[tag] = that.xml_cut_nl_tab(val['gml:pos']);

                				t = (e[tag]+'').split(/\s/i);
                				if (t && t.length == 2) {
                					e[tag] = {"lat" : t[0], "lng" : t[1]};
                				}
        					}

        					if (typeof val['@srsName'] != 'undefined') {
	    	        			e[tag+':srsName'] = val['@srsName'];
        					}
        					if (typeof val['@srsDimension'] != 'undefined') {
	    	        			e[tag+':srsDimension'] = val['@srsDimension'];
        					}
        				}
        			} else if (tag == 'envelope') {
        				if (typeof val == 'object') {
            				if (typeof e['box'] == 'undefined') {
            					e['box'] = '';
            				}
        					if (typeof val['gml:lowerCorner'] != 'undefined') {
    		        			e['box'] = val['gml:lowerCorner'] + ' ' + e['box'];
        					}
        					if (typeof val['gml:upperCorner'] != 'undefined') {
    		        			e['box'] += ' '+val['gml:upperCorner'];
        					}
            				e['box'] = e['box'].trim();

        					if (typeof val['@srsName'] != 'undefined') {
	    	        			e[tag+':srsName'] = val['@srsName'];
        					}
        					if (typeof val['@srsDimension'] != 'undefined') {
	    	        			e[tag+':srsDimension'] = val['@srsDimension'];
        					}
        				}
        			} else if (tag == 'linestring') {
        				if (typeof val == 'object') {
        					if (typeof val['gml:posList'] != 'undefined') {
	    	        			e['line'] = that.xml_cut_nl_tab(val['gml:posList']);
        					}

        					if (typeof val['@srsName'] != 'undefined') {
	    	        			e[tag+':srsName'] = val['@srsName'];
        					}
        					if (typeof val['@srsDimension'] != 'undefined') {
	    	        			e[tag+':srsDimension'] = val['@srsDimension'];
        					}
        				}
        			} else if (tag == 'polygon') {
        				if (typeof val == 'object') {
        					if (typeof val['gml:exterior'] != 'undefined') {
	                            val = val['gml:exterior'];
	        					if (typeof val['gml:LinearRing'] != 'undefined') {
		                            val = val['gml:LinearRing'];
                					if (typeof val['gml:posList'] != 'undefined') {
        	    	        			e[tag] = that.xml_cut_nl_tab(val['gml:posList']);
                					}
		    	        		}
        					}

        					if (typeof val['@srsName'] != 'undefined') {
	    	        			e[tag+':srsName'] = val['@srsName'];
        					}
        					if (typeof val['@srsDimension'] != 'undefined') {
	    	        			e[tag+':srsDimension'] = val['@srsDimension'];
        					}
        				}
        			}
        		}
        	}
        }

	    return e;
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


    get_rel_link : function(l, base) {
    	var that = this;

		var lp = this.parse_url(l);
		var bp = this.parse_url(base);

		var ret = "";
		if (
			typeof lp.host != 'undefined' &&
			typeof bp.host != 'undefined' &&
			lp.host != bp.host) {

			ret = lp.scheme + '://' + lp.host;
		}

		if (
      			(	typeof lp.path != 'undefined' &&
      				typeof bp.path != 'undefined' &&
      				lp.path != bp.path
      			)
      			||
      			(
      				typeof lp.path != 'undefined' &&
      				typeof bp.path == 'undefined'
      			)
			) {

			ret += lp.path;
		}
		if (
      			(	typeof lp.query != 'undefined' &&
      				typeof bp.query != 'undefined' &&
      				lp.query != bp.query
      			)
      			||
      			(
      				typeof lp.query != 'undefined' &&
      				typeof bp.query == 'undefined'
      			)
			) {

			ret += '?' + lp.query;
		}
		if (
      			(	typeof lp.fragment != 'undefined' &&
      				typeof bp.fragment != 'undefined' &&
      				lp.fragment != bp.fragment
      			)
      			||
      			(
      				typeof lp.fragment != 'undefined' &&
      				typeof bp.fragment == 'undefined'
      			)
			) {

			ret += '#' + lp.fragment;
		}

	    return ret;
    },

    xml_get_comments_link : function(s) {
        var e = s['comments'] || "";

        if (e) {
        	e = this.xml_get_text(e);
        }

        if (!e) {
        	var lnk = s.link, i;
    	    if (typeof lnk == 'object' && lnk) {
    	    	if (!lnk.length) {
    	    		lnk = [lnk];
    	    	}

            	var l = lnk.length;
                for (i=0; i < l; i++) {
            		if (	typeof lnk[i]['@rel'] != 'undefined' &&
            				(lnk[i]['@rel'] == 'related' || lnk[i]['@rel'] == 'replies') &&
		            		typeof lnk[i]['@type'] != 'undefined' &&
            				lnk[i]['@type'] == 'text/html' &&
            				typeof lnk[i]['@href'] != 'undefined'
            			) {
            			e = (lnk[i]['@href']+'').trim();
            			break;
            		}
                }
            }
        }

	    return e;
    },

    xml_get_comments_rss : function(s) {
    	var that = this;

        var e = s['wfw:commentRss'] || "";

        if (e) {
        	e = this.xml_get_text(e);
        }

        if (!e) {
        	var lnk = s.link, i;
    	    if (typeof lnk == 'object' && lnk) {
    	    	if (!lnk.length) {
    	    		lnk = [lnk];
    	    	}

            	var l = lnk.length;
                for (i=0; i < l; i++) {
            		if (	typeof lnk[i]['@rel'] != 'undefined' &&
            				(lnk[i]['@rel'] == 'related' || lnk[i]['@rel'] == 'replies') &&
		            		typeof lnk[i]['@type'] != 'undefined' &&
	    					that.xml_http_types.indexOf(lnk[i]['@type']) != -1 &&
            				typeof lnk[i]['@href'] != 'undefined'
            			) {
            			e = (lnk[i]['@href']+'').trim();
            			break;
            		}
                }
            }
        }

	    return e;
    },

    xml_get_link : function(e, base_domain) {
        var that = this;

    	var s = e.link || e['rss:link'] || "", i;

	    for (i in e) {
    		if ((i+'').indexOf(':origLink') != -1) {
    			s = (e[i]+'').trim();
    			break;
    		}
        }

	    if (typeof s == 'object' && s) {
	    	if (!s.length) {
	    		s = [s];
	    	}

	    	var find = "";
        	var l = s.length;
            for (i=0; i < l; i++) {
        		if (	((s[i]['@type'] == 'text/html' && s[i]['@rel'] == 'alternate') || l == 1) &&
        				typeof s[i]['@href'] != 'undefined'
        			) {
        			find = (s[i]['@href']+'').trim();
        			break;
        		}
            }

            if (find) {
	            s = find;
	        } else {
				s = this.xml_get_text(s[0]);
	        }

        } else {
			s = this.xml_get_text(s);
        }

	    s = that.url_base_set(s, base_domain);

	    return s;
    },

	timezoneSym2Number : {
        "A" : "+0100",
        "ACDT" : "+1030",
        "ACST" : "+0930",
        "ADT" : "-0300",
        "ADT" : "-0300",
        "AEDT" : "+1100",
        "AEST" : "+1000",
        "AFT" : "+0430",
        "AKDT" : "-0800",
        "AKST" : "-0900",
        "ALMT" : "+0600",
        "AMST" : "+0500",
        "AMST" : "-0300",
        "AMT" : "+0400",
        "AMT" : "-0400",
        "ANAST" : "+1200",
        "ANAT" : "+1200",
        "AQTT" : "+0500",
        "ART" : "-0300",
        "AST" : "+0300",
        "AST" : "-0400",
        "AST" : "-0400",
        "AST" : "-0400",
        "AWDT" : "+0900",
        "AWST" : "+0800",
        "AZOST" : "+0000",
        "AZOT" : "-0100",
        "AZST" : "+0500",
        "AZT" : "+0400",
        "B" : "+0200",
        "BNT" : "+0800",
        "BOT" : "-0400",
        "BRST" : "-0200",
        "BRT" : "-0300",
        "BST" : "+0600",
        "BST" : "+0100",
        "BTT" : "+0600",
        "C" : "+0300",
        "CAST" : "+0800",
        "CAT" : "+0200",
        "CCT" : "+0630",
        "CDT" : "-0400",
        "CDT" : "-0500",
        "CEST" : "+0200",
        "CET" : "+0100",
        "CET" : "+0100",
        "CHADT" : "+1345",
        "CHAST" : "+1245",
        "CKT" : "-1000",
        "CLST" : "-0300",
        "CLT" : "-0400",
        "COT" : "-0500",
        "CST" : "+0800",
        "CST" : "-0600",
        "CST" : "-0500",
        "CST" : "-0600",
        "CVT" : "-0100",
        "CXT" : "+0700",
        "ChST" : "+1000",
        "D" : "+0400",
        "DAVT" : "+0700",
        "E" : "+0500",
        "EASST" : "-0500",
        "EAST" : "-0600",
        "EAT" : "+0300",
        "EAT" : "+0300",
        "ECT" : "-0500",
        "EDT" : "-0400",
        "EDT" : "-0400",
        "EDT" : "+1100",
        "EEST" : "+0300",
        "EEST" : "+0300",
        "EEST" : "+0300",
        "EET" : "+0200",
        "EET" : "+0200",
        "EET" : "+0200",
        "EGST" : "+0000",
        "EGT" : "-0100",
        "EST" : "-0500",
        "EST" : "-0500",
        "EST" : "-0500",
        "ET" : "-0500",
        "ET" : "-0500",
        "ET" : "-0500",
        "F" : "+0600",
        "FJST" : "+1300",
        "FJT" : "+1200",
        "FKST" : "-0300",
        "FKT" : "-0400",
        "FNT" : "-0200",
        "G" : "+0700",
        "GALT" : "-0600",
        "GAMT" : "-0900",
        "GET" : "+0400",
        "GFT" : "-0300",
        "GILT" : "+1200",
        "GMT" : "+0000",
        "GMT" : "+0000",
        "GST" : "+0400",
        "GYT" : "-0400",
        "H" : "+0800",
        "HAA" : "-0300",
        "HAA" : "-0300",
        "HAC" : "-0500",
        "HADT" : "-0900",
        "HAE" : "-0400",
        "HAE" : "-0400",
        "HAP" : "-0700",
        "HAR" : "-0600",
        "HAST" : "-1000",
        "HAT" : "-0230",
        "HAY" : "-0800",
        "HKT" : "+0800",
        "HLV" : "-0430",
        "HNA" : "-0400",
        "HNA" : "-0400",
        "HNA" : "-0400",
        "HNC" : "-0600",
        "HNC" : "-0600",
        "HNE" : "-0500",
        "HNE" : "-0500",
        "HNE" : "-0500",
        "HNP" : "-0800",
        "HNR" : "-0700",
        "HNT" : "-0330",
        "HNY" : "-0900",
        "HOVT" : "+0700",
        "I" : "+0900",
        "ICT" : "+0700",
        "IDT" : "+0300",
        "IOT" : "+0600",
        "IRDT" : "+0430",
        "IRKST" : "+0900",
        "IRKT" : "+0900",
        "IRST" : "+0330",
        "IST" : "+0200",
        "IST" : "+0530",
        "IST" : "+0100",
        "JST" : "+0900",
        "K" : "+1000",
        "KGT" : "+0600",
        "KRAST" : "+0800",
        "KRAT" : "+0800",
        "KST" : "+0900",
        "KUYT" : "+0400",
        "L" : "+1100",
        "LHDT" : "+1100",
        "LHST" : "+1030",
        "LINT" : "+1400",
        "M" : "+1200",
        "MAGST" : "+1200",
        "MAGT" : "+1200",
        "MART" : "-0930",
        "MAWT" : "+0500",
        "MDT" : "-0600",
        "MESZ" : "+0200",
        "MEZ" : "+0100",
        "MHT" : "+1200",
        "MMT" : "+0630",
        "MSD" : "+0400",
        "MSK" : "+0400",
        "MST" : "-0700",
        "MUT" : "+0400",
        "MVT" : "+0500",
        "MYT" : "+0800",
        "N" : "-0100",
        "NCT" : "+1100",
        "NDT" : "-0230",
        "NFT" : "+1130",
        "NOVST" : "+0700",
        "NOVT" : "+0600",
        "NPT" : "+0545",
        "NST" : "-0330",
        "NUT" : "-1100",
        "NZDT" : "+1300",
        "NZDT" : "+1300",
        "NZST" : "+1200",
        "NZST" : "+1200",
        "O" : "-0200",
        "OMSST" : "+0700",
        "OMST" : "+0700",
        "P" : "-0300",
        "PDT" : "-0700",
        "PET" : "-0500",
        "PETST" : "+1200",
        "PETT" : "+1200",
        "PGT" : "+1000",
        "PHOT" : "+1300",
        "PHT" : "+0800",
        "PKT" : "+0500",
        "PMDT" : "-0200",
        "PMST" : "-0300",
        "PONT" : "+1100",
        "PST" : "-0800",
        "PST" : "-0800",
        "PT" : "-0800",
        "PWT" : "+0900",
        "PYST" : "-0300",
        "PYT" : "-0400",
        "Q" : "-0400",
        "R" : "-0500",
        "RET" : "+0400",
        "S" : "-0600",
        "SAMT" : "+0400",
        "SAST" : "+0200",
        "SBT" : "+1100",
        "SCT" : "+0400",
        "SGT" : "+0800",
        "SRT" : "-0300",
        "SST" : "-1100",
        "T" : "-0700",
        "TAHT" : "-1000",
        "TFT" : "+0500",
        "TJT" : "+0500",
        "TKT" : "+1300",
        "TLT" : "+0900",
        "TMT" : "+0500",
        "TVT" : "+1200",
        "U" : "-0800",
        "ULAT" : "+0800",
        "UTC" : "+0000",
        "UYST" : "-0200",
        "UYT" : "-0300",
        "UZT" : "+0500",
        "V" : "-0900",
        "VET" : "-0430",
        "VLAST" : "+1100",
        "VLAT" : "+1100",
        "VUT" : "+1100",
        "W" : "-1000",
        "WAST" : "+0200",
        "WAT" : "+0100",
        "WEST" : "+0100",
        "WEST" : "+0100",
        "WESZ" : "+0100",
        "WET" : "+0000",
        "WET" : "+0000",
        "WEZ" : "+0000",
        "WFT" : "+1200",
        "WGST" : "-0200",
        "WGT" : "-0300",
        "WIB" : "+0700",
        "WIT" : "+0900",
        "WITA" : "+0800",
        "WST" : "+0100",
        "WST" : "+1300",
        "WT" : "+0000",
        "X" : "-1100",
        "Y" : "-1200",
        "YAKST" : "+1000",
        "YAKT" : "+1000",
        "YAPT" : "+1000",
        "YEKST" : "+0600",
        "YEKT" : "+0600",
        "Z" : "+0000"
	},


	//Fri, 14 Jun 2013 14:49:57 GMT
	//Fri, 14 Jun 2013 12:32:00 +0400
	//2013-06-19T09:01:00-07:00
	//2013-02-05T08:59:00.000-08:00

	//!!! Jun 19 2013 12:00:00:000AM
	//Пн, 13 Май
	//Пн, 12 Мар 2012 19:02:31 +0400
	//Пн, 27 Авг
	//Ср, 03 Апр

    xml_get_date : function(s) {
    	var that = this;

		s = this.xml_get_text(s);
	    s = s.replace(/<[^>]*>/igm, '');

		if (/[а-яА-Я]+/im.test(s)) {
			s = s.replace("Пн,", "Mon,");
			s = s.replace("Вт,", "Tue,");
			s = s.replace("Ср,", "Wed,");
			s = s.replace("Чт,", "Thu,");
			s = s.replace("Пт,", "Fri,");
			s = s.replace("Сб,", "Sat,");
			s = s.replace("Вс,", "Sun,");

			s = s.replace("Янв", "Jan");
			s = s.replace("Фев", "Feb");
			s = s.replace("Мар", "Mar");
			s = s.replace("Апр", "Apr");
			s = s.replace("Май", "May");
			s = s.replace("Июн", "Jun");
			s = s.replace("Июл", "Jul");
			s = s.replace("Авг", "Aug");
			s = s.replace("Сен", "Sep");
			s = s.replace("Окт", "Oct");
			s = s.replace("Ноя", "Nov");
			s = s.replace("Дек", "Dec");
		}

		var was_replace_timezone = false;

		// преобразовываем аббревиатуры в числовые зоны
		// http://www.timeanddate.com/library/abbreviations/timezones/
		if (/^.*?\d+\s+\w+\s+\d+\s+\d+:\d+:\d+\s+\w+\s*$/im.test(s)) {
			was_replace_timezone = true;

            s = s.replace(/^(.*?\d+\s+\w+\s+\d+\s+\d+:\d+:\d+\s+)(\w+)\s*$/im, function(match, s, z) {
            	r = that.timezoneSym2Number[z] || "+0000";
            	return s+r;
            });
		}

    	s = new Date(s);
    	s = Math.round(s.getTime()/1000);

    	if (!s) {
    		s = 0;
    	}
    	return s;
    },


	parseXml : function(xmlStr) {
        if (window.DOMParser) {
            return ( new window.DOMParser() ).parseFromString(xmlStr, "text/xml");
        } else if (typeof window.ActiveXObject != "undefined" && new window.ActiveXObject("Microsoft.XMLDOM")) {
            var xmlDoc = new window.ActiveXObject("Microsoft.XMLDOM");
            xmlDoc.async = "false";
            xmlDoc.loadXML(xmlStr);
            return xmlDoc;
        } else {
            return null;
        }
	},


	a_href_split : /href="/img,
	img_src_split : /src="/img,

    replace_rel_links : function(s, base_link) {
        var that = this;

		var ta = s.split(this.a_href_split);

    	var i, r, len, l;
    	if (ta && ta.length > 1) {

    		len = ta.length;
    		r = [];
    		r.push(ta[0]);
    		for (i=1; i < len; i++) {
    			r.push('href="');
    			l = ta[i].match(/^(\w+:\/\/)/im);
    			if (!l) {
    				if (ta[i].substr(0, 2) != '//') {
	    				r.push(base_link);
	    			} else {
	    				r.push('http:');
	    			}
    			}
    			r.push(ta[i]);
    		}
    		s = r.join('');
    	}

    	//-------------------
		ta = s.split(this.img_src_split);
    	if (ta && ta.length > 1) {

    		len = ta.length;
    		r = [];
    		r.push(ta[0]);
    		for (i=1; i < len; i++) {
    			r.push('src="');
    			l = ta[i].match(/^(\w+:\/\/)/im);
    			if (!l) {
    				if (ta[i].substr(0, 2) != '//') {
	    				r.push(base_link);
	    			} else {
	    				r.push('http:');
	    			}
    			}
    			r.push(ta[i]);
    		}
    		s = r.join('');
    	}

    	return s;
    },


    days2numbers : {"monday" : 1, "tuesday" : 2, "wednesday" : 3, "thursday" : 4, "friday" : 5, "saturday" : 6, "sunday" : 7},

    convert_days_to_numbers : function(c) {
    	var ret = [], i, e, l = c.length;
    	for (i=0; i < l; i++) {
    		e = c[i];
    		ret.push(this.days2numbers[e]);
    	}

    	return ret;
    },

    updatePeriod2seconds : {"hourly" : 3600, "daily" : 3600*24, "weekly" : 3600*24*7, "monthly" : 3600*24*30, "yearly" : 3600*24*365},

    convert_updatePeriod_to_sec : function(e) {
    	var ret = 0;

    	if (typeof this.updatePeriod2seconds[e] != 'undefined') {
    		ret = this.updatePeriod2seconds[e];
    	}

    	return ret;
    },

    choose_link : function(s, guid) {
    	s = s+'';
    	guid = guid+'';
    	if (s.indexOf('feedsportal.com') != -1 && guid.indexOf('http://') != -1) {
    		s = guid;
    	}

    	return s;
    },


	url_escape : function(u) {
	    u = u.replace(/@/ig, '%40');
		return u;
	},

    rss_parse : function(url, xml) {
        var that = this;

        var feedInfo = {}, guid_index = [], items = [];

    	var url_parsed = this.parse_url(url);
        var rss_base_domain = url_parsed.scheme+'://'+url_parsed.host;
        var xml_base = "";

        var i, l, c, e, g, item_link, item_url_parsed, item_base_domain,
        	category, enclosure, geo,
        	item_title, item_description, item_textFull, item_textImg,
        	comments_link, comments_rss, comments_count, comments_link_parsed;

        var currTime = that.core.getCurrentTime();

        var o = that.core.xml2json(xml, '');
        xml = null;

        //that.core.mprint(o);

        if (o && Object.keys(o).length) {
            var rss_format = "rss";

            var channel = o['channel'];
            if (typeof channel == 'undefined') {
            	channel = o;
    	        rss_format = "atom";
            }

            if (channel &&
            	(typeof channel['parsererror'] == 'undefined' && !(typeof channel['head'] != 'undefined' || typeof channel['body'] != 'undefined')) &&
            	typeof channel['title'] != 'undefined'
            	) {
                feedInfo['format'] = rss_format;

                if (typeof channel['@xml:base'] != 'undefined') {
    		        rss_base_domain = xml_base = channel['@xml:base'];
                }

                category = that.xml_get_category(channel);
                category = !category ? '' : JSON.stringify(category);
                feedInfo['category'] = category;

                feedInfo['title_original'] = that.core.sanitize(that.core.funcs.html_clear(that.xml_get_text(channel['title'])));
                feedInfo['description'] = that.core.sanitize(that.core.funcs.html_clear(that.xml_get_text(channel['description'] || channel['subtitle'])));

                feedInfo['version'] = o['@version'] || 0;
                feedInfo['language'] = channel['language'] || channel['@xml:lang'] || "";

                feedInfo['skipDays'] = typeof channel['skipDays'] != 'undefined' && typeof channel['skipDays']['day'] != 'undefined' ? JSON.stringify(that.convert_days_to_numbers(that.xml_get_array(channel['skipDays']['day']))) : "";
                feedInfo['skipHours'] = typeof channel['skipHours'] != 'undefined' && typeof channel['skipHours']['hour'] != 'undefined' ? JSON.stringify(that.xml_get_array(channel['skipHours']['hour'])) : "";

                feedInfo['updatePeriod'] = typeof channel['sy:updatePeriod'] != 'undefined' ? that.convert_updatePeriod_to_sec(that.xml_get_text(channel['sy:updatePeriod'])) : 0;
                feedInfo['updateFrequency'] = typeof channel['sy:updateFrequency'] != 'undefined' ? that.xml_get_text(channel['sy:updateFrequency']) : 0;

                feedInfo['url'] = that.xml_get_link(channel, rss_base_domain);
                feedInfo['ttl'] = channel['ttl'] || 0;
                feedInfo['pubDate'] = that.xml_get_date(channel['pubDate'] || channel['lastBuildDate'] || channel['prism:publicationName'] || channel['updated'] || "");
                feedInfo['image_url'] = !channel['image'] ? "" : channel['image']["url"] || channel['image']["@rdf:resource"] || channel['icon'] || channel['itunes:image'] || "";

                geo = that.xml_get_geo(channel);
                feedInfo['geo'] = geo;

                var item = null;
                if (typeof channel['entry'] != 'undefined') {
                	item = channel['entry'];
                } else if (typeof channel['item'] != 'undefined') {
                	item = channel['item'];
                } else if (typeof o['item'] != 'undefined') {
                	item = o['item'];
                } else if (typeof o['rss:item'] != 'undefined') {
                	item = o['rss:item'];
                }

                if (item) {
                	if (typeof item == 'object' && !item.length) {
                		item = [item];
                	}

                	l = item.length;
                	if (l) {
                		for (i=0; i < l; i++) {
                			e = item[i];

                			item_title = that.core.sanitize(that.core.funcs.html_clear(that.xml_get_text(e.title || e['rss:title'] || "")));
                			item_description = that.core.sanitize(that.core.funcs.ads_clear(that.core.funcs.html_clear(that.xml_get_text(e.description || e['rss:description'] || e.summary || ""))));

                			g = that.xml_get_guid(e, item_title, item_description, rss_base_domain);

                			if (guid_index.indexOf(g) == -1) {
                    			guid_index.push(g);

    					       	//atom => logo

    					       	item_link = that.choose_link(that.xml_get_link(e, rss_base_domain), g);
    					       	item_link = that.url_escape(item_link);
                            	item_url_parsed = this.parse_url(item_link);
                                item_base_domain = !xml_base ? item_url_parsed.scheme+'://'+item_url_parsed.host : xml_base;

                                if (typeof e['content'] == 'object' && typeof e['content']['@xml:base'] != 'undefined') {
    	                            item_base_domain = e['content']['@xml:base'];
                                }

                                if (!item_link && (g+'').indexOf('://') != -1) {
                                	item_link = g;
                                }

    	            			item_description = that.replace_rel_links(item_description, item_base_domain);

                                category = that.xml_get_category(e);
                                category = !category ? '' : JSON.stringify(category);

                                comments_count = that.xml_get_text(e['slash:comments'] || e['lj:reply-count'] || e['thr:total'] || "");
                                if (!comments_count) {
                                	comments_count = 0;
                                }
                                comments_link = that.xml_get_comments_link(e);
                                if (comments_link) {
                                	comments_link = this.get_rel_link(comments_link, item_link);
    	                        }
                                comments_rss = that.xml_get_comments_rss(e);
                                if (comments_rss) {
                                	comments_rss = this.get_rel_link(comments_rss, item_link);
    	                        }

                                enclosure = that.xml_get_enclosure(e, rss_base_domain);
                                enclosure = !enclosure ? '' : JSON.stringify(enclosure);

                                geo = that.xml_get_geo(e);

                                item_textFull = that.replace_rel_links(
                           			that.core.sanitize(
	                            		that.core.funcs.ads_clear(
                            				that.core.funcs.html_clear(
                            					that.xml_get_text(e['content:encoded'] ||
                            										e['content'] ||
                            										e['full-text'] ||
                            										e['yandex:full-text'] ||
                            										e['fulltext'] || ""
                            					)
                            				)
                            			)
                            		),

                            		item_base_domain
                            	);

                            	item_textImg = !item_textFull ? item_description : item_textFull;

                            	items.push({
                            		"guid"			: g,
                            		"link"			: item_link,

                            		"datetime"		: that.xml_get_date(e['pubDate'] || e['published'] || e['updated'] || e['created'] || e['modified'] || e['dc:date'] || ""),

                            		"title"			: item_title,
                            		"description"	: item_description,
                            		"textFull"		: item_textFull,
                            		"textImg"		: item_textImg,

                            		"author"		: that.core.sanitize(that.core.funcs.ads_clear(that.core.funcs.html_clear(that.xml_get_author(e.author || e['dc:creator'] || e['lj:poster'] || "", 'name')))),
                            		"author_url"	: that.core.sanitize(that.core.funcs.ads_clear(that.core.funcs.html_clear(that.xml_get_author(e.author || e['dc:creator'] || "", 'uri')))),
                            		"author_email"	: that.core.sanitize(that.core.funcs.ads_clear(that.core.funcs.html_clear(that.xml_get_author(e.author || e['dc:creator'] || "", 'email')))),

                            		"comments_count": comments_count,
                            		"comments_link"	: comments_link,
                            		"comments_rss"	: comments_rss,

                            		"category"		: category,
                            		"enclosure"		: enclosure,
                            		"geo"			: geo,
                            		"time_load"		: currTime
                            	});
                    		}
                		}
                	}
                }
            }
        }

        //that.core.mprint(items);

        return {
        	"feedInfo" : feedInfo,
        	"guid_index" : guid_index,
        	"items" : items,

        	"xml" : o
        };
    },

    html_search_feeds : function(html, feed_url, base_domain) {
        var that = this;

    	var list = [];
   		var l, i, j, e, type, title, href;
		var href_parsed, href_index;

		html = html+'';
    	var mm = html.match(/<link[^>]+rel="*alternate"*[^>]+>/img);

    	//<link rel="alternate" type="application/atom+xml" title="W3C News" href="/News/atom.xml" />
    	//<link rel="alternate" type="application/rss+xml" href="http://natashadurley.tumblr.com/rss" />
    	//<link href=/news/feed/ rel=alternate title="Joe Gregorio | BitWorking" type=application/atom+xml>
    	if (mm && mm.length) {
    		l = mm.length;
    		for (i=0; i < l; i++) {
    			e = mm[i];

    			type = "";
        		f = e.match(/type="*([^"\s>]+)"*/i);
        		if (f) {
        			type = (f[1]+'').toLowerCase();
        		}

    			title = "";
        		f = e.match(/title="([^"]+)"/i);
        		if (f) {
        			title = f[1];
        		} else {
            		f = e.match(/title=([^"\s>]+)/i);
            		if (f) {
            			title = f[1];
            		}
        		}

    			href = "";
        		f = e.match(/href="*([^"\s>]+)"*/i);
        		if (f) {
        			href = f[1];
	        		href = that.url_base_set(href, base_domain);
        		}

        		if (href && type &&
   					this.xml_http_types.indexOf(type) != -1
        		) {

                    href_parsed = that.parse_url(href);
                    if (href_parsed.host.substr(0, 4) != 'www.') {
                    	href_parsed.host = 'www.'+href_parsed.host;
                    }
                    href_parsed.path = href_parsed.path || "";
                    if (href_parsed.path.substr(-1, 1) != '/') {
                    	href_parsed.path = href_parsed.path+'/';
                    }
                    href_index = href_parsed.host + href_parsed.path + (href_parsed.query || "");

    				j = that.core.get_el_by_field(list, 'href_index', href_index);
    				if (j == -1) {

    					if (href == feed_url && base_domain == 'feeds.feedburner.com' && href.indexOf('format=xml') == -1) {
    					    //!!! сделать функцию добавления параметра к url
    						if (href.indexOf('?') == -1) {
	    						href += '?format=xml';
	    					} else {
	    						href += '&format=xml';
	    					}
    					}

    					//http://feeds.feedburner.com/AeonMagazineEssays
    					if (href_parsed.host == 'www.feeds.feedburner.com' && href.indexOf('format=xml') == -1) {
    					    //!!! сделать функцию добавления параметра к url
    						if (href.indexOf('?') == -1) {
	    						href += '?format=xml';
	    					} else {
	    						href += '&format=xml';
	    					}
    					}

            			list.push({
            				"type" :	type,
            				"title" :	title || href,
            				"href" :	href,
            				"href_index" : href_index
            			});
            		}
        		}
    		}
    	}

    	return list;
    }
};
