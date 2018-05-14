var slacktoken = require("./token.json");
var request = require("request");
var slackbots = require("slackbots");
var sqlite3 = require("sqlite3").verbose();

var db = new sqlite3.Database("./sandboxversion.db");

var cmsUrl = "http://sandbox-cms.kakaopage.com/info";
var apiUrl = "https://sandbox-api2-page.kakao.com/api/info";
var exidUrl = "https://sandbox-charlie.kakaopage.com/exid/api/server-info";
var botStartCheckList = "\n" + "SANDBOX" + "\n";

request(cmsUrl, function (err, res, body) {
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
      console.log("CMS Response Code : " +
        res.statusCode + "\n")
    }
  }
});

request(exidUrl, function (err, res, body) {
  if (!err) {
    if (res.statusCode == 200) {
      console.log(body);
    } else {
      console.log("EXID Response Code : " +
        res.statusCode + "\n")
    }
  }
})

request(apiUrl, function (err, res, body) {
  if (!err) {
    if (res.statusCode == 200) {
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
      console.log("CMS Response Code : " +
        res.statusCode + "\n")
    }
  }
});

db.each(
  "SELECT module, version FROM sandboxserver",
  function (err, row) {
    botStartCheckList +=
      row.module + " : " + row.version + "\n";
  },
  function () {
    console.log(botStartCheckList)
  }
);

var bot = new slackbots(slacktoken);

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

      if (
        valueInformation.includes("SUCCESSFUL") &&
        valueInformation.includes("NICOLAS-BUILD-DEPLOY-TEST-KRANES")
      ) {
        if (splitInformation[3].includes("SANDBOX") && splitInformation[1].includes("CMS")) {
          request(cmsUrl, function (err, res, body) {
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
                  ], function () {
                    bot.postMessageToChannel(
                      "qa_bot_test",
                      "배포완료 *CMS* : `" +
                      apiSandboxVersion +
                      "`"
                    );
                  });
                }
              } else {
                console.log("CMS Response Code : " +
                  res.statusCode + "\n")
              }
            }
          });
        } else if (splitInformation[3].includes("SANDBOX") && splitInformation[1].includes("API")) {
          request(apiUrl, function (err, res, body) {
            if (!err) {
              if (res.statusCode == 200) {
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
                  ], function () {
                    bot.postMessageToChannel(
                      "qa_bot_test",
                      "배포완료 *API* : `" +
                      apiSandboxVersion +
                      "`"
                    );
                  });
                }
              } else {
                console.log("CMS Response Code : " +
                  res.statusCode + "\n")
              }
            }
          });
        }
      } else if (
        valueInformation.includes("SUCCESSFUL") &&
        valueInformation.includes("SLIDE_TEST_KRANE")
      ) {
        if (splitInformation[2].includes("SANDBOX")) {
          var slideSandboxVersion =
            slideBranchSplit[1] + "_" + slideBranchSplit[2];

          db.run(
            "UPDATE sandboxserver SET version = ? WHERE id = ?", [slideSandboxVersion, 4],
            function () {
              bot.postMessageToChannel(
                "qa_bot_test",
                "배포완료 *SLIDE* : `" +
                slideSandboxVersion +
                "`"
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
        function (err, row) {
          sandboxVersionList +=
            "*" + row.module + "* : `" + row.version + "`" + "\n";
        },
        function () {
          bot.postMessageToChannel("qa_bot_test", sandboxVersionList);
        }
      );
    }
  }
});