var express = require("express");
var app = express();

//rounter
app.get("/", function (req, res) {
    return res.send("Hello World");
});

var server = app.listen(process.env.PORT || 3000 || 8080, function () {
    var host = server.address().address;
    var port = server.address().port;

    console.log("Web server started at http://%s:%s", host, port);
});
