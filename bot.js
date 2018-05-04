var slacktoken = require("./token.json");
var request = require("request");
var slackbots = require("slackbots");
var sqlite3 = require("sqlite3").verbose();

var db = new sqlite3.Database("./sandboxversion.db");

var apiUrl = "https://sandbox-api2-page.kakao.com/api/info";
var cmsUrl = "http://sandbox-cms.kakaopage.com/info";
var pointUrl = "https://sandbox-point-page.kakao.com/api/info";

request(apiUrl, function(err, res, body) {
  if (!err) {
    var apiJson = JSON.parse(body);
    var apiBranch = apiJson.git.branch;
    if (apiBranch === "develop") {
      var apiDevelop = apiBranch;
      console.log("API : " + apiDevelop);
    } else if (apiBranch === "master") {
      var apiMaster = apiBranch;
      console.log("API : " + apiMaster);
    } else {
      var apiBranchSplit = apiBranch.split("/");
      var apiSandboxVersion = apiBranchSplit[2] + "_" + apiBranchSplit[3];
      console.log("API : " + apiSandboxVersion);
    }
  }
  db.run("UPDATE sandboxserver SET version = ? WHERE id = ?", [
    apiSandboxVersion,
    1
  ]);
});

request(pointUrl, function(err, res, body) {
  if (!err) {
    var pointJson = JSON.parse(body);
    var pointBranch = pointJson.git.branch;
    if (pointBranch === "develop") {
      var pointDevelop = pointBranch;
      console.log("POINT : " + pointDevelop);
    } else if (pointBranch === "master") {
      var pointMaster = pointBranch;
      console.log("POINT : " + pointMaster);
    } else {
      var pointBranchSplit = pointBranch.split("/");
      var pointSandboxVersion = pointBranchSplit[2] + "_" + pointBranchSplit[3];
      console.log("POINT : " + pointSandboxVersion);
    }
  }
  // db.run("UPDATE sandboxserver SET version = ? WHERE id = ?", [
  //   apiSandboxVersion,
  //   1
  // ]);
});

db.get("SELECT module, version FROM sandboxserver WHERE id = 2", function(
  err,
  row
) {
  console.log(row.module + " : " + row.version);
});

db.get("SELECT module, version FROM sandboxserver WHERE id = 3", function(
  err,
  row
) {
  console.log(row.module + " : " + row.version);
});

var bot = new slackbots(slacktoken);

bot.on("start", function() {
  console.log("BOT START" + "\n");
});

bot.on("message", function(data) {
  if (data.type === "message") {
    console.log(data);
    var botId = data.bot_id;

    //jenkins_bot : B3SS13WEL
    //exid_bot : B44CU1B7B
    //qa_bot : B7H8GG57X
    if (botId === "B3SS13WEL" && data.attachments) {
      var valueInformation = data.attachments[0].fields[0].value;
      var splitInformation = valueInformation.split("\n");
      var deployResult = splitInformation[0].slice(0, 10);
      var deployServer = splitInformation[3].slice(12, 19);
      var deployServer = deployServer.toUpperCase();
      var deployModule = splitInformation[1].slice(8);
      var deployModule = deployModule.toUpperCase();
      var serverVersion = splitInformation[2].slice(10);

      if (
        deployResult == "SUCCESSFUL" &&
        deployServer == "SANDBOX" &&
        deployModule == "API"
      ) {
        request(apiUrl, function(err, res, body) {
          if (!err) {
            var apiJson = JSON.parse(body);
            var apiBranch = apiJson.git.branch;
            var apiBranchSplit = apiBranch.split("/");
            var apiSandboxVersion = apiBranchSplit[2] + "_" + apiBranchSplit[3];
            console.log("API : " + apiSandboxVersion);
          }
          db.run("UPDATE sandboxserver SET version = ? WHERE id = ?", [
            apiSandboxVersion,
            1
          ]);
          bot.postMessageToChannel(
            "qa_bot_test",
            "배포완료 *" + deployModule + "* : `" + apiSandboxVersion + "`"
          );
        });
      } else if (
        deployResult == "SUCCESSFUL" &&
        deployServer == "SANDBOX" &&
        deployModule == "CMS"
      ) {
        db.run("UPDATE sandboxserver SET version = ? WHERE id = ?", [
          serverVersion,
          2
        ]);
        bot.postMessageToChannel(
          "qa_bot_test",
          "배포완료 *" + deployModule + "* : `" + serverVersion + "`"
        );
      }
    } // else if (botId === B44CU1B7B && ) {
    //}
    var checkServerVersion = data.text;
    var checkServerVersion = checkServerVersion.toLowerCase();
    if (checkServerVersion === "!sandbox") {
      var sandboxVersionList = "*SANDBOX*" + "\n";
      db.each(
        "SELECT module, version FROM sandboxserver",
        function(err, row) {
          sandboxVersionList +=
            "*" + row.module + "* : `" + row.version + "`" + "\n";
        },
        function() {
          bot.postMessageToChannel("qa_bot_test", sandboxVersionList);
        }
      );
    }
  }
});
