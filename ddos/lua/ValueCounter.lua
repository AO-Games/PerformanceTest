local json = require("json")
local count = count or 0

Handlers.add(
    "Count",
    Handlers.utils.hasMatchingTag("Action", "Count"),
    function (msg)
        count = count + 1
    end
)

Handlers.add(
    "GetCount",
    Handlers.utils.hasMatchingTag("Action", "GetCount"),
    function(msg)
        Handlers.utils.reply(json.encode(count))(msg)
    end
)

Handlers.add(
    "ResetCount",
    Handlers.utils.hasMatchingTag("Action", "ResetCount"),
    function(msg)
        count = 0
    end
)