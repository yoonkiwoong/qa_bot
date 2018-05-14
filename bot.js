var slacktoken = require("./token.json");
var request = require("request");
var slackbots = require("slackbots");
var sqlite3 = require("sqlite3").verbose();

var db = new sqlite3.Database("./sandboxversion.db");

var cmsUrl = "http://sandbox-cms.kakaopage.com/info";
var apiUrl = "https://sandbox-api2-page.kakao.com/api/info";
var exidUrl = "https://sandbox-charlie.kakaopage.com/exid/api/server-info/";

request(cmsUrl, function(err, res, body) {
  if (!err) {
    var cmsJson = JSON.parse(body);
    var cmsBranch = cmsJson.git.branch;
    if (cmsBranch === "develop") {
      var cmsDevelop = cmsBranch;
    } else if (cmsBranch === "master") {
      var cmsMaster = cmsBranch;
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
    } else if (apiBranch === "master") {
      var apiMaster = apiBranch;
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
    // console.log(data);
    var botId = data.bot_id;

    //jenkins_bot : B3SS13WEL
    //exid_bot : B44CU1B7B
    //qa_bot : B7H8GG57X
    if (botId === "B3SS13WEL" && data.attachments) {
      attachmentsInformation = data.attachments;
      // console.log(attachmentsInformation);
      var valueInformation = data.attachments[0].fallback;
      // console.log(valueInformation);
      var valueInformation = data.attachments[0].fields[0].value;
      console.log(valueInformation + "\n");
      if (
        valueInformation.includes("SUCCESSFUL") &&
        valueInformation.includes("nicolas-build-deploy-test-kranes")
      ) {
        console.log("NICOLAS SERVER DEPLOY SUCCESSFUL");
        var valueInformation = valueInformation.toUpperCase();
        var splitInformation = valueInformation.split("\n");
        var deployNicolasServer = splitInformation[3].slice(12, 19);
        console.log(deployNicolasServer);
        var deployNicolasModule = splitInformation[1].slice(8, 11);
        console.log(deployNicolasModule);

        if (deployNicolasServer == "SANDBOX" && deployNicolasModule == "CMS") {
          request(cmsUrl, function(err, res, body) {
            if (!err) {
              var cmsJson = JSON.parse(body);
              var cmsBranch = cmsJson.git.branch;
              if (cmsBranch === "develop") {
                var cmsDevelop = cmsBranch;
              } else if (cmsBranch === "master") {
                var cmsMaster = cmsBranch;
              } else {
                var cmsBranchSplit = cmsBranch.split("/");
                var cmsSandboxVersion =
                  cmsBranchSplit[2] + "_" + cmsBranchSplit[3];
                console.log("CMS : " + cmsSandboxVersion + "\n");
              }
            }
            db.run(
              "UPDATE sandboxserver SET version = ? WHERE id = ?",
              [cmsSandboxVersion, 1],
              function() {
                bot.postMessageToChannel(
                  "qa_bot_test",
                  "배포완료 *" +
                    deployNicolasModule +
                    "* : `" +
                    cmsSandboxVersion +
                    "`"
                );
                bot.postMessageToUser(
                  "jina",
                  "qa_bot_test",
                  "배포완료 *" +
                    deployNicolasModule +
                    "* : `" +
                    cmsSandboxVersion +
                    "`"
                );
              }
            );
          });
        } else if (
          deployNicolasServer == "SANDBOX" &&
          deployNicolasModule == "API"
        ) {
          request(apiUrl, function(err, res, body) {
            if (!err) {
              var apiJson = JSON.parse(body);
              var apiBranch = apiJson.git.branch;
              if (apiBranch === "develop") {
                var apiDevelop = apiBranch;
              } else if (apiBranch === "master") {
                var apiMaster = apiBranch;
              } else {
                var apiBranchSplit = apiBranch.split("/");
                var apiSandboxVersion =
                  apiBranchSplit[2] + "_" + apiBranchSplit[3];
                console.log("API : " + apiSandboxVersion + "\n");
              }
            }
            db.run(
              "UPDATE sandboxserver SET version = ? WHERE id = ?",
              [apiSandboxVersion, 3],
              function() {
                bot.postMessageToChannel(
                  "qa_bot_test",
                  "배포완료 *" +
                    deployNicolasModule +
                    "* : `" +
                    apiSandboxVersion +
                    "`"
                );
                bot.postMessageToUser(
                  "jina",
                  "qa_bot_test",
                  "배포완료 *" +
                    deployNicolasModule +
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
        console.log("SLIDE SERVER DEPLOY SUCCESSFUL");
        var valueInformation = valueInformation.toUpperCase();
        var splitInformation = valueInformation.split("\n");
        var deploySlideServer = splitInformation[2].slice(10, 17);
        console.log(deploySlideServer);
        var slideBranchSplit = splitInformation[1].split("/");
        var slideSandboxVersion =
          slideBranchSplit[1] + "_" + slideBranchSplit[2];
        console.log(slideSandboxVersion + "\n");
        if (deploySlideServer == "SANDBOX") {
          db.run(
            "UPDATE sandboxserver SET version = ? WHERE id = ?",
            [slideSandboxVersion, 4],
            function() {
              bot.postMessageToChannel(
                "qa_bot_test",
                "배포완료 *SLIDE* : `" + slideSandboxVersion + "`"
              );
            }
          );
        }
      }
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
          bot.postMessageToUser("jina", sandboxVersionList);
        }
      );
    }
  }
});
