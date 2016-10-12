exports.main = function(options, callbacks)  {
    var Storage = require("background/storage").init();
    var core = require("background/core").init();

    core.escape = function(str) {
        return escape(str);
    };

    core.preInit(Storage);
};
