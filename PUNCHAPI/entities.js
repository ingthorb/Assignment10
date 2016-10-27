const mongoose = require("mongoose");

/***
* Documents which describe users
* name: String which represents the name of the user.
* token: The token value for this user
* gender: String with a single character m, f or o. These character stand for male, female or other respectively.
*/
const UsersScheme = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  token: String,
  gender: {
    type: String,
    validate: function(value){
      return /m|f|o/i.test(value);
    },
    required: true
  }
});


/**
* Documents representing companies that have been added to the system and can give out punch cards.
* name: String for the company name
* punchCount: The number of punches a user needs to obtain in order to be given a discount
*/
const CompaniesScheme = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  punchCount: {
    type: Number,
    required: true,
    default: 10
  },
  description: {
    type: String,
    required:true
  }
});


/**
* Documents which represents punches
* company_id: company id
* user_id: user id
* created: time stamp when this punch was created
* used: this value indicates if the user has used up the discount given to him/her after reaching the punchCount for the given company.
*/
const PunchSchema = new mongoose.Schema({
  created: {
    type: Date,
    default: new Date()
  },
  used: {
    type: Boolean,
    default: false
  },
  user_id: {
    type: String,
    required: true
  },
  company_id: {
    type: String,
    required: true
  }
});


const UserEntity = mongoose.model("Users", UsersScheme);
const PunchEntity = mongoose.model("Punches", PunchSchema);
const CompanyEntity = mongoose.model("Companies", CompaniesScheme);

const entities = {
  User: UserEntity,
  Company: CompanyEntity,
  Punches: PunchEntity
}

module.exports = entities;
