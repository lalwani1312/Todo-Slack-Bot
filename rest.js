var mysql = require('mysql');

function restRouter(router, connection) {
  console.log("router set in rest.js");
  handleApiRequests(router, connection);
}

// function sendJson(response, text) {
//   console.log(text);
//   response.json({
//     "response_type": "in_channel",
//     "username": "TODO Bot",
//     "text": text
//   });
// }

function sendAllTodosJson(response, headerText, text) {
  console.log("Message: " + text);
  response.json({
    "response_type": "in_channel",
    "username": "TODO Bot",
    "text": "_" + headerText + "_",
    "attachments": [
      {
        "color": "good",
        "mrkdwn_in": [
          "text",
          "pretext"
        ],
        "text": text
      }
    ]
  });
}

function sendSuccessJson(response, headerText, text) {
  console.log("Success message: " + text);
  response.json({
    "response_type": "in_channel",
    "username": "TODO Bot",
    "text": "_" + headerText + "_",
    "attachments": [
      {
        "color": "good",
        "mrkdwn_in": [
          "text",
          "pretext"
        ],
        "text": "*" + text + "*"
      }
    ]
  });
}

function sendErrorJson(response, errorText) {
  console.log("error: " + errorText);
  response.json({
    "response_type": "in_channel",
    "username": "TODO Bot",
    "attachments": [
      {
        "color": "danger",
        "mrkdwn_in": [
          "text",
          "pretext"
        ],
        "text": "_" + errorText + "_"
      }
    ]
  });
}

function sendWarningJson(response, warningText) {
  console.log("warning: " + warningText);
  response.json({
    "response_type": "in_channel",
    "username": "TODO Bot",
    "attachments": [
      {
        "color": "warning",
        "mrkdwn_in": [
          "text",
          "pretext"
        ],
        "text": "_"  + warningText + "_"
      }
    ]
  });
}

function handleApiRequests(router, connection) {
  router.post("/", function(req, res) {
    console.log("handling /");
    res.json({
      "Message" : "param1 : " + req.query.param1
    });
  });

  router.post("/addTask", function(req, res) {
    console.log("handling /addTask req url : " + req.originalUrl);
    console.log("response_url: " + req.body.response_url);
    console.log("text: " + req.body.text);
    console.log("channel: " + req.body.channel_id);
    console.log("user_id: " + req.body.user_id);
    console.log("user_name: " + req.body.user_name);
    var taskDescription = req.body.text;
    if(taskDescription === undefined || taskDescription === "") {
      sendErrorJson(res, "Please define a TODO to add");
      return;
    }
    var channelPostedIn = req.body.channel_id;
    var userPostedBy = req.body.user_id;
    var userName = req.body.user_name;
    var status = "0";

    console.log("taskDescription: " + taskDescription);
    console.log("channelPostedIn: " + channelPostedIn);
    console.log("userPostedBy: " + userPostedBy);
    console.log("userName: " + userName);

    //first check if task is present in db or not.
    var countQuery = "SELECT * from ?? WHERE ??=? AND ??=?";
    var tableCountQuery = ["tasks", "task_description", taskDescription,
    "channel_posted_in", channelPostedIn];
    countQuery = mysql.format(countQuery, tableCountQuery);
    console.log(countQuery);
    connection.query(countQuery, function(err, result) {
      if(err) {
        console.log(err);
        sendErrorJson(res, "Sorry!! unable to add TODO");
      } else {
        if(result.length === 0) {
          var query = "INSERT INTO ??(??,??,??,??,??) VALUES (?,?,?,?,?)";
          var table = ["tasks",
            "task_description", "channel_posted_in", "user_posted_by", "user_name", "status",
            taskDescription, channelPostedIn, userPostedBy, userName, status];
          query = mysql.format(query, table);
          console.log(query);
          connection.query(query, function(err, rows) {
            if(err) {
              sendErrorJson(res, "Sorry!! unable to add TODO");
            } else {
              sendSuccessJson(res, "TODO added", taskDescription);
            }
          });
        } else {
          console.log("result: " + JSON.stringify(result));
          if(result[0].status === 1) {
            var updateStatusQuery = "UPDATE ?? SET ?? = ? WHERE ?? = ?";
            var updateStatusTable = ["tasks", "status", "0", "task_description", taskDescription];
            updateStatusQuery = mysql.format(updateStatusQuery, updateStatusTable);
            console.log(updateStatusQuery);
            connection.query(updateStatusQuery, function(err, rows) {
              if(err) {
                sendErrorJson(res, "Sorry!! unable to add TODO");
              } else {
                sendSuccessJson(res, "TODO added", taskDescription);
              }
            });
          } else {
            sendWarningJson(res, "TODO already added");
          }
        }
      }
    });
  });

  router.post("/getAllTasks", function(req, res) {
    console.log("handling /getAllTasks");
    var channelPostedIn = req.body.channel_id;
    var query = "SELECT * FROM ?? WHERE ??=? AND ??=?";
    var table = ["tasks", "status", "0", "channel_posted_in", channelPostedIn];
    query = mysql.format(query,table);
    console.log(query);
    connection.query(query, function(err,rows) {
      if(err) {
        console.log(err);
        sendErrorJson(res, "Sorry!! unable to retrieve all TODOs from our database");
      } else {
        //If row count == 0, then show "No TODOs"
        if(rows.length === 0) {
          sendWarningJson(res, "No TODOs");
        } else {
          //else show all the tasks.
          console.log("todos : " + JSON.stringify(rows));
          var text = "";
          for(i = 0; i < rows.length; ++i) {
            text += "*- " + rows[i].task_description + "*\n";
          }
          sendAllTodosJson(res, "TODO list", text);
        }
      }
    });
  });

  router.post("/taskCompleted", function(req, res) {
    console.log("handling /taskCompleted");
    console.log("task: " + req.body.text);
    var taskDescription = req.body.text;
    var channelPostedIn = req.body.channel_id;
    if(taskDescription === undefined || taskDescription === "") {
      sendErrorJson(res, "Please define a TODO to mark");
      return;
    }
    var checkStatusQuery = "SELECT * FROM ?? WHERE ??=? AND ??=? AND ??=?";
    var checkStatusTable = ["tasks", "task_description", taskDescription,
      "status", "0", "channel_posted_in", channelPostedIn];
    checkStatusQuery = mysql.format(checkStatusQuery, checkStatusTable);
    console.log(checkStatusQuery);
    connection.query(checkStatusQuery, function(err, rows) {
      if(err) {
        sendErrorJson(res, "Sorry!! unable to remove TODO");
      } else {
        //if there is any task with status == 1, then this task has been completed.
        if(rows.length > 0) {
          var query = "UPDATE ?? SET ?? = ? WHERE ?? = ?";
    	    var table = ["tasks", "status", "1", "task_description", taskDescription];
   	      query = mysql.format(query,table);
    	    console.log(query);
   	      connection.query(query, function(err, rows) {
            if(err) {
              sendErrorJson(res, "Sorry!! unable to remove TODO");
            } else {
              sendSuccessJson(res, "Removed TODO", taskDescription);
            }
          });
        } else {
          sendWarningJson(res, "No such TODO found in our database");
          return;
        }
      }
    });
  });
}

module.exports = restRouter;
