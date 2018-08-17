var urls = require("./urls.json");
var request = require("request");
var slackbots = require("slackbots");
var sqlite3 = require("sqlite3").verbose();

var db = new sqlite3.Database("./sandboxversion.db");

function sandboxVersionAdd(sandboxModule, id) {
  request.get(sandboxModule, function (err, res, body) {
    if (err) {
      console.log("ERROR! : " + err + "\n");
    } else {
      if (res.statusCode == 200) {
        var json = JSON.parse(body);
        if (sandboxModule === urls.cms || sandboxModule === urls.api) {
          var branch = json.git.branch;
          if (branch.includes("QA")) {
            var splitBranch = branch.split("/");
            var sandboxVersion = splitBranch[2] + "_" + splitBranch[3];
            db.run("UPDATE sandboxserver SET version = ? WHERE id = ?", [
              sandboxVersion,
              id
            ]);
          } else {
            db.run("UPDATE sandboxserver SET version = ? WHERE id = ?", [
              branch,
              id
            ]);
          }
        } else if (sandboxModule === urls.exid) {
          var branch = json.data.git_branch;
          if (branch.includes("QA")) {
            var splitBranch = branch.split("/");
            var sandboxVersion = splitBranch[1] + "_" + splitBranch[2];
            db.run("UPDATE sandboxserver SET version = ? WHERE id = ?", [
              sandboxVersion,
              id
            ]);
          } else {
            db.run("UPDATE sandboxserver SET version = ? WHERE id = ?", [
              branch,
              id
            ]);
          }
        }
      } else {
        console.log("Response Code : " + res.statusCode + "\n");
      }
    }
  });
}

function sandboxDeployDone(id) {
  var doneMessage = "배포완료" + "\n";
  db.get(
    "SELECT module, version FROM sandboxserver WHERE id = ?",
    [id],
    function (err, row) {
      doneMessage +=
        " *" + row.module + "* :" + " `" + row.version + "`" + "\n";
      console.log(doneMessage);
    }
  );
  bot.postMessageToChannel("qa_bot_test", doneMessage);
}

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
  sandboxServerList();
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
        valueInformation.includes("NICOLAS-BUILD-DEPLOY-TEST-KRANES") &&
        splitInformation[3].includes("SANDBOX")
      ) {
        if (splitInformation[1].includes("CMS")) {
          console.log(
            "NICOLAS DEPLOY SUCCESS" +
            "\n" +
            "SERVER : SANDBOX" +
            "\n" +
            "MODULE : CMS" +
            "\n"
          );
          sandboxVersionAdd(urls.cms, 1);
          const abc = sandboxDeployDone(1);
          console.log(abc);
        } else if (splitInformation[1].includes("API")) {
          console.log(
            "NICOLAS DEPLOY SUCCESS" +
            "\n" +
            "SERVER : SANDBOX" +
            "\n" +
            "MODULE : API" +
            "\n"
          );
          sandboxVersionAdd(urls.api, 3);
          sandboxDeployDone(3);
        }
      } else if (
        valueInformation.includes("EXID_SANDBOX") &&
        valueInformation.includes("SUCCESS")
      ) {
        sandboxVersionAdd(urls.exid, 2);
        sandboxDeployDone(2);
      } else if (
        valueInformation.includes("SUCCESSFUL") &&
        valueInformation.includes("SLIDE_TEST_KRANE") &&
        splitInformation[2].includes("SANDBOX")
      ) {
        console.log("SLIDE DEPLOY SUCCESS" + "\n" + "SERVER : SANDBOX" + "\n");
        var slideBranchSplit = splitInformation[1].split("/");
        var slideSandboxVersion =
          slideBranchSplit[1] + "_" + slideBranchSplit[2];

        db.run(
          "UPDATE sandboxserver SET version = ? WHERE id = ?",
          [slideSandboxVersion, 4],
          function () {
            bot.postMessageToChannel(
              "qa_bot_test",
              "배포완료 *SLIDE* : `" + slideSandboxVersion + "`"
            );
          }
        );
      } else if (
        valueInformation.includes("SUCCESS") &&
        valueInformation.includes("PAGEWEB") &&
        splitInformation[2].includes("SANDBOX")
      ) {
        console.log("WEB DEPLOY SUCCESS" + "\n" + "SERVER : SANDBOX" + "\n");
        var slideBranchSplit = splitInformation[2].split("/");
        var webSandboxVersion =
          slideBranchSplit[1] + "_" + slideBranchSplit[2];

        db.run(
          "UPDATE sandboxserver SET version = ? WHERE id = ?",
          [webSandboxVersion, 5],
          function () {
            bot.postMessageToChannel(
              "qa_bot_test",
              "배포완료 *WEB* : `" + webSandboxVersion + "`"
            );
          }
        );
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
