var slacktoken = require("./token.json");
var request = require("request");
var slackbots = require("slackbots");
var sqlite3 = require("sqlite3").verbose();

var db = new sqlite3.Database("./sandboxversion.db");

var cmsUrl = "http://sandbox-cms.kakaopage.com/info";
var apiUrl = "https://sandbox-api2-page.kakao.com/api/info";

request(cmsUrl, function(err, res, body) {
  if (!err) {
    var cmsJson = JSON.parse(body);
    var cmsBranch = cmsJson.git.branch;
    if (cmsBranch === "develop") {
      var cmsDevelop = cmsBranch;
      console.log("CMS : " + apiDevelop);
    } else if (cmsBranch === "master") {
      var cmsMaster = cmsBranch;
      console.log("CMS : " + cmsMaster);
    } else {
      var cmsBranchSplit = cmsBranch.split("/");
      var cmsSandboxVersion = cmsBranchSplit[2] + "_" + cmsBranchSplit[3];
      console.log("CMS : " + cmsSandboxVersion);
    }
  }
  db.run("UPDATE sandboxserver SET version = ? WHERE id = ?", [
    cmsSandboxVersion,
    1
  ]);
});

db.get("SELECT module, version FROM sandboxserver WHERE id = 2", function(
  err,
  row
) {
  console.log(row.module + " : " + row.version);
});

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
    3
  ]);
});

db.get("SELECT module, version FROM sandboxserver WHERE id = 4", function(
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

      if (
        valueInformation.includes("SUCCESSFUL") &&
        valueInformation.includes("nicolas-build-deploy-test-kranes")
      ) {
        var valueInformation = valueInformation.toUpperCase();
        var splitInformation = valueInformation.split("\n");
        var deployServer = splitInformation[3].slice(12, 19);
        var deployModule = splitInformation[1].slice(8);
        var serverVersion = splitInformation[2].slice(10);

        if (deployServer == "SANDBOX" && deployModule == "CMS") {
          request(cmsUrl, function(err, res, body) {
            if (!err) {
              var cmsJson = JSON.parse(body);
              var cmsBranch = cmsJson.git.branch;
              if (cmsBranch === "develop") {
                var cmsDevelop = cmsBranch;
                console.log("CMS : " + apiDevelop);
              } else if (cmsBranch === "master") {
                var cmsMaster = cmsBranch;
                console.log("CMS : " + cmsMaster);
              } else {
                var cmsBranchSplit = cmsBranch.split("/");
                var cmsSandboxVersion =
                  cmsBranchSplit[2] + "_" + cmsBranchSplit[3];
                console.log("CMS : " + cmsSandboxVersion);
              }
            }
            db.run(
              "UPDATE sandboxserver SET version = ? WHERE id = ?",
              [apiSandboxVersion, 1],
              function() {
                bot.postMessageToChannel(
                  "qa_bot_test",
                  "배포완료 *" +
                    deployModule +
                    "* : `" +
                    apiSandboxVersion +
                    "`"
                );
              }
            );
          });
        } else if (deployServer == "SANDBOX" && deployModule == "API") {
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
                var apiSandboxVersion =
                  apiBranchSplit[2] + "_" + apiBranchSplit[3];
                console.log("API : " + apiSandboxVersion);
              }
            }
            db.run(
              "UPDATE sandboxserver SET version = ? WHERE id = ?",
              [apiSandboxVersion, 3],
              function() {
                bot.postMessageToChannel(
                  "qa_bot_test",
                  "배포완료 *" +
                    deployModule +
                    "* : `" +
                    apiSandboxVersion +
                    "`"
                );
              }
            );
          });
        }
      } else if (
        valueInformation.includes("SUCCESSFUL") &&
        valueInformation.includes("slide_test_krane")
      ) {
        var valueInformation = valueInformation.toUpperCase();
        var splitInformation = valueInformation.split("\n");
        var deployServer = splitInformation[2].slice(10, 16);
        var slideBranchSplit = splitInformation[2].split("/");
        var slideSandboxVersion =
          slideBranchSplit[1] + "_" + slideBranchSplit[2];
        console.log("SLIDE : " + slideSandboxVersion);
      }
      db.run(
        "UPDATE sandboxserver SET version = ? WHERE id = ?",
        [slideSandboxVersion, 4],
        function() {
          bot.postMessageToChannel(
            "qa_bot_test",
            "배포완료 *" + deployModule + "* : `" + apiSandboxVersion + "`"
          );
        }
      );
    }

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
