var slacktoken = require("./token.json");
var urls = require("./urls.json")
var request = require("request");
var slackbots = require("slackbots");
var sqlite3 = require("sqlite3").verbose();

var db = new sqlite3.Database("./sandboxversion.db");

function cmsSandboxAdd() {
  request.get(urls.cms, function (err, res, body) {
    if (!err) {
      if (res.statusCode == 200) {
        var cmsJson = JSON.parse(body);
        var cmsBranch = cmsJson.git.branch;
        if (cmsBranch === "develop") {
          db.run("UPDATE sandboxserver SET version = ? WHERE id = ?", [
            "Develop",
            1
          ]);
        } else if (cmsBranch === "master") {
          db.run("UPDATE sandboxserver SET version = ? WHERE id = ?", [
            "Master",
            1
          ]);
        } else {
          var cmsBranchSplit = cmsBranch.split("/");
          var cmsSandboxVersion = cmsBranchSplit[2] + "_" + cmsBranchSplit[3];

          db.run("UPDATE sandboxserver SET version = ? WHERE id = ?", [
            cmsSandboxVersion,
            1
          ]);
        }
      } else {
        console.log("CMS Response Code : " + res.statusCode + "\n");
      }
    }
  });
}

function exidSandboxAdd() {
  request.get(exidOptions, function (err, res, body) {
    if (!err) {
      if (res.statusCode == 200) {
        var exidJson = JSON.parse(body);
        var exidBranch = exidJson.data.git_branch;
        if (exidBranch === "develop") {
          db.run("UPDATE sandboxserver SET version = ? WHERE id = ?", [
            "Develop",
            1
          ]);
        } else if (exidBranch === "master") {
          db.run("UPDATE sandboxserver SET version = ? WHERE id = ?", [
            "Master",
            1
          ]);
        } else {
          var exidBranchSplit = exidBranch.split("/");
          var exidSandboxVersion = exidBranchSplit[1] + "_" + exidBranchSplit[2];

          db.run("UPDATE sandboxserver SET version = ? WHERE id = ?", [
            exidSandboxVersion,
            2
          ]);
        }
      } else {
        console.log("EXID Response Code : " + res.statusCode + "\n");
      }
    }
  });
}

function apiSandboxAdd() {
  request.get(urls.api, function (err, res, body) {
    if (!err) {
      if (res.statusCode == 200) {
        console.log("API SANDBOX VERSION ADDED")
        var apiJson = JSON.parse(body);
        var apiBranch = apiJson.git.branch;
        if (apiBranch === "develop") {
          db.run("UPDATE sandboxserver SET version = ? WHERE id = ?", [
            "Develop",
            3
          ]);
        } else if (apiBranch === "master") {
          db.run("UPDATE sandboxserver SET version = ? WHERE id = ?", [
            "Master",
            3
          ]);
        } else {
          var apiBranchSplit = apiBranch.split("/");
          var apiSandboxVersion = apiBranchSplit[2] + "_" + apiBranchSplit[3];

          db.run("UPDATE sandboxserver SET version = ? WHERE id = ?", [
            apiSandboxVersion,
            3
          ]);
        }
      } else {
        console.log("CMS Response Code : " + res.statusCode + "\n");
      }
    }
  });
}

function cmsSandboxDeploy() {
  var cmsSandboxDeployDone = "*배포완료* ";
  db.get(
    "SELECT version FROM sandboxserver WHERE id = 1",
    function (err, row) {
      console.log("*CMS* : `" + row.version + "`" + "\n");
      cmsSandboxDeployDone +=
        "*CMS* : `" + row.version + "`" + "\n";
      bot.postMessageToChannel("qa_bot_test", cmsSandboxDeployDone);
    }
  );
}

function exidSandboxDeploy() {
  var exidSandboxDeployDone = "*배포완료* ";
  db.get(
    "SELECT version FROM sandboxserver WHERE id = 2",
    function (err, row) {
      console.log("*EXID* : `" + row.version + "`" + "\n");
      exidSandboxDeployDone +=
        "*CMS* : `" + row.version + "`" + "\n";
      bot.postMessageToChannel("qa_bot_test", exidSandboxDeployDone);
    }
  );
}

function apiSandboxDeploy() {
  var apiSandboxDeployDone = "*배포완료* ";
  db.get(
    "SELECT version FROM sandboxserver WHERE id = 3",
    function (err, row) {
      console.log("*API* : `" + row.version + "`" + "\n");
      apiSandboxDeployDone +=
        "*API* : `" + row.version + "`" + "\n";
      bot.postMessageToChannel("qa_bot_test", apiSandboxDeployDone);
    }
  );
}

function botStart() {
  var botStartCheckList = "SANDBOX" + "\n";
  db.each(
    "SELECT module, version FROM sandboxserver",
    function (err, row) {
      botStartCheckList += row.module + " : " + row.version + "\n";
    },
    function () {
      console.log(botStartCheckList);
    }
  );
}

var bot = new slackbots(slacktoken);

bot.on("start", function () {
  botStart(console.log("BOT START" + "\n"));
});

bot.on("message", function (data) {
  if (data.type === "message") {
    var botId = data.bot_id;
    console.log(data);

    //jenkins_bot : B3SS13WEL
    //exid_bot : B44CU1B7B
    //qa_bot : B7H8GG57X
    if (botId === "B3SS13WEL" && data.attachments) {
      var valueInformation = data.attachments[0].fields[0].value;
      var valueInformation = valueInformation.toUpperCase();
      var splitInformation = valueInformation.split("\n");

      if (
        valueInformation.includes("SUCCESSFUL") &&
        valueInformation.includes("NICOLAS-BUILD-DEPLOY-TEST-KRANES")
      ) {
        console.log("NICOLAS DEPLOY SUCCESS");
        if (
          splitInformation[3].includes("SANDBOX") &&
          splitInformation[1].includes("CMS")
        ) {
          cmsSandboxAdd();
          cmsSandboxDeploy();
        } else if (
          splitInformation[3].includes("SANDBOX") &&
          splitInformation[1].includes("API")
        ) {
          apiSandboxAdd();
          apiSandboxDeploy();
        }
      } else if (
        valueInformation.includes("SUCCESSFUL") &&
        valueInformation.includes("SLIDE_TEST_KRANE")
      ) {
        console.log("SLIDE DEPLOY SECCUESS" + "\n");
        if (splitInformation[2].includes("SANDBOX")) {
          var slideSandboxVersion =
            slideBranchSplit[1] + "_" + slideBranchSplit[2];

          db.run(
            "UPDATE sandboxserver SET version = ? WHERE id = ?", [slideSandboxVersion, 4],
            function () {
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
        function (err, rows) {
          sandboxVersionList +=
            "*" + rows.module + "* : `" + rows.version + "`" + "\n";
        },
        function () {
          bot.postMessageToChannel("qa_bot_test", sandboxVersionList);
        }
      );
    }
  }
});