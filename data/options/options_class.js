var ei_read_rss_Options = function(coreInfo) {
    var that = this;

    that.groups = [
    	{"name" : "general",	"title" : "Общие"}
    ];

    Popup.messages_callbacks.push({
        "type"		: "",
        "under_type": "",
        "func"		: "storage_get_element_value",
    	"field" 	: "options",
    	"callback" 	: function(options) {

            Popup.messages_callbacks.push({
                "type"		: "",
                "under_type": "",
                "func"		: "optionsList_get",
            	"field" 	: "",
            	"callback" 	: function(optionsList) {
            		that.options_render($('#options-container'), optionsList, options);
            	}
            });
        	port_sendMessage({"doing": "function", "func" : "optionsList_get", "field" : "", "value" : {}, "type" : "", "under_type" : ""});
    	}
    });
    port_sendMessage({"doing": "function", "func" : "storage_get_element_value", "field" : "options", "value" : {}, "type" : "", "under_type" : ""});

    that.func_sendMessage = function(msg, field, value, callback) {
    	Popup.messages_callbacks.push({
    	    "type"		: "",
    	    "under_type": "",
    	    "func"		: msg,
    		"field" 	: field,
    		"callback" 	: callback
    	});

		port_sendMessage({"doing": "function", "func" : msg, "field" : field, "value" : value, "type" : "", "under_type" : ""});
    };

	that.options_render = function(root, optionsList, options) {
        var s = [];
        var i, c, len, e, is_checked;
        var gi, gc, gl, ge;


        $('body').css({"min-width" : 400, "width" : 620, "text-align" : 'left'});

        s.push('<div id="content">');
        s.push('<h1>readRss - настройки</h1>');
        s.push('<a id="button_about" target="_blank" href="http://e-ivanov.ru/read_rss/">about</a>');

        s.push('<ul id="toolbar">');
        gc = that.groups;
        gl = gc.length;
        for (gi=0; gi < gl; gi++) {
        	ge = gc[gi];
	        s.push('<li id="'+ge.name+'-toolbar">'+ge.title+'</li>');
        }
        s.push('</ul>');

        for (gi=0; gi < gl; gi++) {
        	ge = gc[gi];
	        s.push('<ul id="'+ge.name+'-menu" class="menu">');

            c = optionsList;
            len = c.length;
            for (i=0; i < len; i++) {
            	e = c[i];

            	if (ge.name != e.group) continue;

            	if (e.type == 'checkbox') {
    	        	is_checked = options[e.name];
    		        s.push('<div class="option-item"><input type="checkbox" name="'+e.name+'" id="options-'+e.name+'" '+(!is_checked ? '' : 'checked="checked"')+' title="'+e.help+'" /><label title="'+e.help+'" for="options-'+e.name+'">'+e.title+'</label></div>');
    		    }
            	if (e.type == 'text') {
    	        	val = options[e.name];
    	        	if (!val) val = e.def;
    		        s.push('<div class="option-item"><input type="text" name="'+e.name+'" id="options-'+e.name+'" value="'+val+'" title="'+e.help+'" /><label title="'+e.help+'" for="options-'+e.name+'">'+e.title+'</label></div>');
    		    }
            }

	        s.push('</ul>');
        }

        s.push('</div>');

        if (window.location.search.match(/popup/i) || Popup.isFF) {
	        s.push('<a class="button options-button-close" href="../popup/popup.html">Закрыть</a>');
	    }

        root.html(s.join(''));

        if (Popup.isFF) {
        	$('.options-button-close').bind('click', function() {
    			port_sendMessage({"doing": "function", "func" : "options_close", "field" : "", "value" : ""});
        		return false;
        	});
        }

        var menu = 'general';
        var toolbar = null;

        $("#toolbar li").removeClass("selected");
        $(".menu").hide();

        var el_menu = $("#" + menu + '-menu');
        toolbar = $("#" + el_menu.attr("id").replace("menu", "toolbar"));

        toolbar.addClass("selected");
        el_menu.show();

        //-------
        $('.tabs li').removeClass('selected');
        $('.tabs-content > li').addClass('dn');


        $("#toolbar li").unbind('click').bind('click', function() {
            var toolbar = $(this);

            var menu = toolbar.attr("id").replace(/-toolbar/i, '');

            var el_menu = $("#" + menu + '-menu');

            $("#toolbar li").not(toolbar).removeClass("selected");
            $(".menu").not(el_menu).hide();

            toolbar.addClass("selected");
            el_menu.show();
        });


        $('#button_about').attr("title", 'Версия '+coreInfo.version+', '+coreInfo.copyright);

        $("input:checkbox", root).bind('change', function() {
			var name = $(this).attr('name');

			options[name] = !this.checked ? 0 : 1;

			port_sendMessage({"doing": "storage_set_element_value", "field" : "options", "value" : options});

		    var loadAdded = [];
            if (loadAdded.length) {
           	    that.func_sendMessage("cron_update", 0, loadAdded, function() {});
	        }
        });

        $("input:text", root).bind('keyup', function() {
			var name = $(this).attr('name');

			options[name] = this.value;

			port_sendMessage({"doing": "storage_set_element_value", "field" : "options", "value" : options});

		    var loadAdded = [];
            if (loadAdded.length) {
           	    that.func_sendMessage("cron_update", 0, loadAdded, function() {});
	        }
        });
	};
}