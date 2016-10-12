var Popup = {};

Popup.firstTime = true;
Popup.drawed = {};
Popup.messages_callbacks = [];

//------------------------
$(document).ready(function() {
    var msg_handler = function(msg) {
        if (msg.doing == 'ignition_ok') {
	        ei_read_rss_Options(msg.coreInfo);
        }

        if (msg.doing == 'answer_function') {
            var c = Popup.messages_callbacks;
            var j = get_el_by_fields(c, {
        	    "type"		: msg.type,
        	    "under_type": msg.under_type,
        		"func" 		: msg.func,
        		"field" 	: msg.field
        		}
        	);

        	if (j != -1) {
        		var callback = c.splice(j, 1);
        		callback[0]['callback'](msg.value);
        	}
        }

    }

    Popup.isOpera = typeof window.opera != 'undefined';
    Popup.isFF = typeof window.opera == 'undefined' && typeof window.chrome == 'undefined';

    if (!Popup.isFF) {
        if (Popup.isOpera) {
            opera.extension.onmessage = function(event) {
                msg_handler(event.data);
            };
        } else {
            chrome.extension.onConnect.addListener(function(port) {
                if (port.name == 'ei_core') {
                    port.onMessage.addListener(function(msg) {
                        msg_handler(msg);
                    });
                }
            });
        }
    } else {
        addon.port.on("message", function (message) {
            msg_handler(message);
        });
    }

   	port_sendMessage({doing: "popup_ignition"});
});
