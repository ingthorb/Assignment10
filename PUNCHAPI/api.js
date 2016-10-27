"use strict";

const express = require("express");
const app = express();
const entities = require("./entities");
const uuid = require("node-uuid");
var bodyParser = require('body-parser');
var jsonParser = bodyParser.json();

var adminToken = "Batman";
var contentType = "application/json";

/**
* Fetches a list of companies that have been added to MongoDB
*/
app.get("/companies", function GetCompanies(req, res) {
  entities.Company.find(function (err, docs) {
    if (err) {
      res.statusCode = 500
      return res.json(err);
    }
    else {
      var CompanyArray = [];
      for (i = 0; i < docs.length; i++) {
        var temp = docs[i];
        var company =
        {
          _id: temp._id,
          name: temp.name,
          punchCount: temp.punchCount
        };
        CompanyArray.push(company);
      }
      res.json(CompanyArray);
    }
  }
);
});
/**
* Fetches a given company that has been added to MongoDB by id.
* if the the we can not finde the id of the company in the db we return 404
*/
app.get("/companies/:id", function (req, res) {
  entities.Company.find({ _id: req.params.id }, function (err, docs) {
    if (err) {
      res.statusCode = 404
      return res.json(err);
    }
    else {
      if (docs != null && docs.length > 0) {
        var company = {
          _id: docs[0]._id,
          name: docs[0].name,
          punchCount: docs[0].punchCount
        }
        res.json(company);
      }
      else {
        res.statusCode = 404
        return res.json("Company not found");
      }
    }
  });
});

/**
* Returns a list of all users that are in the MongoDB.
*/
app.get("/users", function(req, res) {
  entities.User.find(function (err, docs) {
    if (err) {
      res.statusCode = 500
      return res.json(err);
    }
    else {
      var UserArray = [];
      for (var i = 0; i < docs.length; i++) {
        var temp = docs[i];
        var user =
        {
          _id: temp._id,
          name: temp.name,
          gender: temp.gender
        };
        UserArray.push(user);
      }
      res.json(UserArray);
    }
  }
);
});
/**
* Allows administrators to add new companies to MongoDB
*/
app.post("/companies", jsonParser, function (req, res) {
  if (req.headers.authorization !== adminToken) {
    res.statusCode = 401;
    return res.json("Not Authorized");
  }
  if(req.get('Content-Type') !== contentType)
  {
    res.statusCode = 415;
    return res.json("Unsupported Media Type");
  }
  entities.Company.find({ name: req.body.name }, function (err, docs) {
    //No company found
    console.log(err);
    console.log(docs);

    if(err || err == null)
    {
      //Else we can add a company
      var Company = {
        name: req.body.name,
        punchCount: req.body.punchCount
      };

      var entity = new entities.Company(Company);
      entity.validate(function (err) {
        if (err) {
          res.statusCode = 412;
          return res.json("Precondition failed");
        }
        entity.save(function (err) {
          if (err) {
            res.statusCode = 500;
            return res.json("Server error");
          }
          else {
            res.statusCode = 201;
            return res.json({
              _id: entity._id,
            });
          }
        });
      });
    }
    if(docs[0] != null)
    {
        if(docs[0].name !== undefined )
        {
          res.statusCode = 409;
          return res.json("Conflict");
        }
    }
  });

});
/**
* Allows administrators to add new users to MongoDB
*/
app.post("/users", jsonParser, function (req, res) {
  if (req.headers.authorization !== adminToken) {
    res.statusCode = 401;
    return res.json("Not Authorized");
  }

  var User = {
    name: req.body.name,
    gender: req.body.gender,
    token: uuid.v1()
  };
  var entity = new entities.User(User);
  entity.validate(function (err) {
    if (err) {
      res.statusCode = 412;
      return res.json("Precondition failed");
    }
    entity.save(function (err) {
      if (err) {
        res.statusCode = 500;
        return res.json("Server error");
      }
      else {
        res.statusCode = 201;
        return res.json({
          _id: entity._id,
          token: User.token
        });
      }
    });
  });
});
/**
* Creates a new punch for the "current user" for a given company
*/
app.post("/my/punches", jsonParser, function (req, res) {
  var tempToken = req.headers.authorization;

  if (tempToken == undefined) {
    res.statusCode = 401
    return res.json("The token is missing");
  }

  var Punchlength = false;
  var PunchesCount = [];
  var UserArray = {};
  entities.User.find({ token: tempToken }, function (err, docs) {

    if (err) {
      res.statusCode = 401
      return res.json(err);
    }
    else {
      if (docs == null || docs.length == 0) {
        res.statusCode = 404
        return res.json("User not found");
      }
      UserArray = docs[0];
      entities.Company.find({ _id: req.body.company_id }, function (err, docs) {
        if (err) {
          res.statusCode = 404
          return res.json(err);
        }
        else {
          if (docs == null || docs.length == 0) {
            res.statusCode = 404
            return res.json("Company not found");
          }
          var CompanyArray = docs[0];
          var punch = {
            user_id: UserArray._id,
            company_id: req.body.company_id
          }
          var entity = new entities.Punches(punch);
          entity.validate(function (err) {
            if (err) {
              res.statusCode = 412;
              return res.json("Precondition failed");
            }
          });
        }
        entity.save(function (err) {
          if (err) {
            res.statusCode = 500;
            return res.json("Server error");
          }
          else {
            entities.Punches.find({ company_id: req.body.company_id , used: false}, function (err, docs) {
              if (err) {
                res.statusCode = 404
                return res.json(err);
              }
              else {
                PunchesCount = docs;
                if (PunchesCount.length == CompanyArray.punchCount) {
                  Punchlength = true;
                  //Update the punches
                  var query = { company_id: req.body.company_id, used: false };
                  var options;
                  entities.Punches.update(query, { $set: { used: true } },options = {multi:true}, function (err,res) {
                    if (err) {
                      res.statusCode = 500;
                      return res.json("Server error");
                    }
                    else {
                    //  console.log(res);
                    }
                  });
                }
                if (Punchlength) {
                  //If the punch count has been reached
                  res.statusCode = 201;
                  return res.json({
                    _id: entity._id,
                    discount: true
                  });
                }
                //If the punch count hasn't been reached
                res.statusCode = 201;
                return res.json({
                  _id: entity._id,
                });
              }
            });
          }
        });
      });
    }
  });
});
module.exports = app;
