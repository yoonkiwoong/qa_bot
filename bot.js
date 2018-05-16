var slacktoken = require("./token.json");
var urls = require("./urls.json")
var request = require("request");
var slackbots = require("slackbots");
var sqlite3 = require("sqlite3").verbose();

var db = new sqlite3.Database("./sandboxversion.db");

function sandboxVersionAdd(sandboxModule, id) {
  request.get(sandboxModule, function (err, res, body) {
    if (err) {
      console.log(err + "\n")
    } else {
      if (res.statusCode == 200) {
        var json = JSON.parse(body);
        if (sandboxModule === urls.cms || sandboxModule === urls.api) {
          var branch = json.git.branch;
          if (branch.includes("QA")) {
            var sandboxVersion = branchSplit[2] + "_" + branchSplit[3];
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
        } else if (sandboxModule === urls.exidOptions) {
          var branch = json.data.git_branch;
          if (branch.includes("QA")) {
            var sandboxVersion = branchSplit[1] + "_" + branchSplit[2];
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
    "SELECT module, version FROM sandboxserver WHERE id = ?", [
      id
    ],
    function (err, row) {
      doneMessage +=
        " *" + row.module + "* :" + " `" + row.version + "`" + "\n"
      bot.postMessageToChannel("qa_bot_test", doneMessage);
    }
  );
}

function sandboxServerList() {
  var checkMessage = "SANDBOX" + "\n";
  db.each(
    "SELECT module, version FROM sandboxserver",
    function (err, rows) {
      checkMessage +=
        "*" + rows.module + "* : `" + rows.version + "`" + "\n";
    },
    function () {
      console.log(checkMessage);
      bot.postMessageToChannel("qa_bot_test", checkMessage);
    }
  );
}

var bot = new slackbots(slacktoken);

bot.on("start", function () {
  console.log("BOT START" + "\n");
  sandboxServerList()
});

bot.on("message", function (data) {
  if (data.type === "message") {
    var botId = data.bot_id;

    //jenkins_bot : B3SS13WEL
    //exid_bot : B44CU1B7B
    //qa_bot : B7H8GG57X
    if (botId === "B7H8GG57X" && data.attachments) {
      var valueInformation = data.attachments[0].fields[0].value;
      var valueInformation = valueInformation.toUpperCase();
      var splitInformation = valueInformation.split("\n");
      console.log(splitInformation + "\n");

      if (
        valueInformation.includes("SUCCESSFUL") &&
        valueInformation.includes("NICOLAS-BUILD-DEPLOY-TEST-KRANES")
      ) {
        console.log("NICOLAS DEPLOY SUCCESS");
        if (
          splitInformation[3].includes("SANDBOX") &&
          splitInformation[1].includes("CMS")
        ) {
          sandboxVersionAdd(urls.cms, 1);
          sandboxDeployDone(1);
        } else if (
          splitInformation[3].includes("SANDBOX") &&
          splitInformation[1].includes("API")
        ) {
          sandboxVersionAdd(urls.api, 3);
          sandboxDeployDone(3)
        }
      } else if (valueInformation.includes("SUCCESS") &&
        valueInformation.includes("EXID")) {
        if (splitInformation[1].includes("SANDBOX")) {
          sandboxVersionAdd(urls.exidOptions, 2);
          sandboxDeployDone(2)
        }
      } else if (
        valueInformation.includes("SUCCESSFUL") &&
        valueInformation.includes("SLIDE_TEST_KRANE")
      ) {
        console.log("SLIDE DEPLOY SECCUESS" + "\n");
        if (splitInformation[2].includes("SANDBOX")) {
          var splitInformation = valueInformation.split("\n");
          console.log(deploySlideServer);
          var slideBranchSplit = splitInformation[1].split("/");
          console.log(slideSandboxVersion + "\n");
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
    if (checkServerVersion === "!sandbox" && checkServerVersion === "!샌박") {
      sandboxServerList()
    }
  }
});