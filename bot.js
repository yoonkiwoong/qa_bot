require('dotenv').config();

var slackbots = require("slackbots");
var sqlite3 = require("sqlite3").verbose();

var db = new sqlite3.Database("./sandboxversion.db");

function deployedServerUpdate(deployedServer, version, id) {
  deployedServer = deployedServer.toUpperCase();
  db.run(
    "UPDATE sandboxserver SET version = ? WHERE id = ?",
    [version, id],
    function () {
      bot.postMessageToChannel(
        "qa_bot_test",
        "배포완료" + "\n" + "*" + deployedServer + "* : `" + version + "`"
      );
    }
  );
};

function sandboxServerList() {
  var checkMessage = "SANDBOX" + "\n";
  db.each(
    "SELECT module, version FROM sandboxserver",
    function (err, rows) {
      checkMessage += "*" + rows.module + "* : `" + rows.version + "`" + "\n";
    },
    function () {
      console.log(checkMessage);
      bot.postMessageToChannel("qa_bot_test", checkMessage);
    }
  );
}

var bot = new slackbots({
  token: process.env.SLACK_TOKEN,
  name: process.env.SLACK_NAME
});

bot.on("start", function () {
  console.log("BOT START" + "\n");
});

bot.on("message", function (data) {

  if (data.type === "message") {
    var botId = data.bot_id;

    //jenkins_bot : B3SS13WEL
    //exid_bot : B44CU1B7B
    //qa_bot : B7H8GG57X
    if (botId === "B3SS13WEL" && data.attachments) {
      var valueInformation = data.attachments[0].fields[0].value;
      var valueInformation = valueInformation.toUpperCase();
      var splitInformation = valueInformation.split("\n");
      console.log("DEPLOY MESSAGE : " + "\n" + splitInformation);

      if (
        valueInformation.includes("SUCCESSFUL") &&
        valueInformation.includes("NICOLAS-BUILD-PUBLISH")
      ) {
        var nicolasBranchSplit = splitInformation[1].split("/");
        var version = nicolasBranchSplit[2] + "_" + nicolasBranchSplit[3];
        console.log(version);
        if (
          valueInformation.includes("SUCCESSFUL") &&
          valueInformation.includes("NICOLAS-BUILD-DEPLOY-TEST-KRANES") &&
          splitInformation[3].includes("SANDBOX")
        ) {
          console.log("SANDBOX NICOLAS DEPLOY SUCCESS" + "\n");
          if (splitInformation[1].includes("CMS")) {
            console.log("SANDBOX CMS DEPLOY SUCCESS" + "\n");
            var deployedServer = "cms"
            deployedServerUpdate(deployedServer, version, 1);
          } else if (splitInformation[1].includes("API")) {
            console.log("SANDBOX API DEPLOY SUCCESS" + "\n");
            var deployedServer = "api"
            deployedServerUpdate(deployedServer, version, 3);
          }
        }
      } else if (
        valueInformation.includes("EXID_SANDBOX") &&
        valueInformation.includes("SUCCESS")
      ) {
        console.log("SANDBOX EXID DEPLOY SUCCESS" + "\n");
        var exidBranchSplit = splitInformation[2].split("/");
        var version = exidBranchSplit[1] + "_" + exidBranchSplit[2];
        var deployedServer = "exid"
        deployedServerUpdate(deployedServer, version, 2);
      } else if (
        valueInformation.includes("SUCCESSFUL") &&
        valueInformation.includes("SLIDE_TEST_KRANE") &&
        splitInformation[2].includes("SANDBOX")
      ) {
        console.log("SANDBOX SLIDE DEPLOY SUCCESS" + "\n");
        var slideBranchSplit = splitInformation[1].split("/");
        var version = slideBranchSplit[1] + "_" + slideBranchSplit[2];
        var deployedServer = "slide"
        deployedServerUpdate(deployedServer, version, 4)
      } else if (
        valueInformation.includes("PAGEWEB") &&
        valueInformation.includes("SUCCESS") &&
        splitInformation[1].includes("SANDBOX")
      ) {
        console.log("SANDBOX WEB DEPLOY SUCCESS" + "\n");
        var webBranchSplit = splitInformation[2].split("/");
        var version = webBranchSplit[1] + "_" + webBranchSplit[2];
        var deployedServer = "web"
        deployedServerUpdate(deployedServer, version, 5)
      }
    }
    if (data.text) {
      var checkServerVersion = data.text;
      console.log(checkServerVersion);
      var checkServerVersion = checkServerVersion.toLowerCase();
      if (checkServerVersion === "!sandbox") {
        sandboxServerList();
      }
    }
  }
});
