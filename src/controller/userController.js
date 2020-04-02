/**
 * @file userController.js
 * @author Rahul Handoo
 * @version 1.0
 * createdDate: 02/04/2020
 */

//Declare the file name
const FILE_NAME = 'userController.js'
//import constants file
const CONSTANTS = require('../CONSTANTS/constants')
//import mongoose
const mongoose = require('mongoose')
//import Schema
const UserSchema = require('../model/userModel')
//Create a variable of type mongoose schema for Researcher
const User = mongoose.model('UserSchema', UserSchema)
//importing bcrypt to hash the user entered password for security.
const bcrypt = require('bcrypt')
//importing file system to get the public and private key for creating public and private keys.
const fs = require('fs')
//private key path
var researcherprivateKEY = fs.readFileSync(
  './.env/researcher_keys/private.key',
  'utf8'
)
//public key path
var researcherpublicKEY = fs.readFileSync(
  './.env/researcher_keys/public.key',
  'utf8'
)
//private key path
var volunteerprivateKEY = fs.readFileSync(
  './.env/researcher_keys/private.key',
  'utf8'
)
//public key path
var volunteerpublicKEY = fs.readFileSync(
  './.env/researcher_keys/public.key',
  'utf8'
)
//import mongoose queries
const mongooseMiddleware = require('../middleware/mongooseMiddleware')
//import login controller
const loginController = require('./common_controllers/loginController')
//import add user queries
const adduser = require('./common_controllers/addUserController')
//import post authentication controller
const postAuthentication = require('./common_controllers/postAuthenticationController')
//import login constants
const loginMiddleware = require('../middleware/loginMiddleware')

//This functionality adds a new researcher with all the required fields from the body.
const addNewUser = (req, res, next) => {
  var searchcriteria = { email: req.body.email }
  if (req.body.skills.toString().includes(',')) {
    var skills = req.body.skills
    var skillsArr = skills.split(',')
  } else {
    var skillsArr = req.body.skills.toString()
  }
  let newUser = new User({
    firstName: req.body.firstName,
    lastName: req.body.lastName,
    email: req.body.email,
    age: req.body.age,
    gender: req.body.gender,
    institute: req.body.institute,
    skills: skillsArr,
    type: req.body.type,
    portfolioLink: req.body.portfolioLink
  })
  adduser.addnewUser(
    res,
    next,
    User,
    searchcriteria,
    FILE_NAME,
    req.body.password,
    newUser
  )
}

//This function gets all the researchers currently in the database.
const getAllUsers = (res, next) => {
  mongooseMiddleware.findALL(User, res, next, FILE_NAME)
}

//This function will retrieve a researchers info based on it's ID which is auto generated in mongoDB.
const getUserWithID = (req, res, next) => {
  var searchCriteria = { _id: req.params.userID }
  loginMiddleware
    .checkifDataExists(User, searchCriteria, FILE_NAME)
    .then(result => {
      if (result != undefined && result != null) {
        if (result.type.toString() === 'Volunteer') {
          var publicKEY = volunteerpublicKEY
        } else {
          var publicKEY = researcherpublicKEY
        }
        postAuthentication.postAuthentication(
          req,
          res,
          next,
          publicKEY,
          FILE_NAME,
          result._id,
          mongooseMiddleware.findbyID,
          User,
          null
        )
      } else {
        //Create the log message
        CONSTANTS.createLogMessage(FILE_NAME, 'No data Found', 'NODATA')
        //Send the response
        CONSTANTS.createResponses(
          res,
          CONSTANTS.ERROR_CODE.NOT_FOUND,
          CONSTANTS.ERROR_DESCRIPTION.NOT_FOUND,
          next
        )
      }
    })
}

//Updates the researchers information.
const updateUser = (req, res, next) => {
  let hash = bcrypt.hash(req.body.password, 10)
  if (req.body.skills.toString().includes(',')) {
    var skills = req.body.skills
    var skillsArr = skills.split(',')
  } else {
    var skillsArr = req.body.skills.toString()
  }
  let newUser = new User({
    firstName: req.body.firstName,
    lastName: req.body.lastName,
    email: req.body.email,
    age: req.body.age,
    gender: req.body.gender,
    institute: req.body.institute,
    skills: skillsArr,
    type: req.body.type,
    portfolioLink: req.body.portfolioLink,
    password: hash
  })
  var upsertData = newUser.toObject()
  delete upsertData._id
  var searchCriteria = { _id: req.params.userID }
  loginMiddleware
    .checkifDataExists(User, searchCriteria, FILE_NAME)
    .then(result => {
      if (result != undefined && result != null) {
        if (result.type.toString() === 'Volunteer') {
          var publicKEY = volunteerpublicKEY
        } else {
          var publicKEY = researcherpublicKEY
        }
        postAuthentication.postAuthentication(
          req,
          res,
          next,
          publicKEY,
          FILE_NAME,
          req.params.userID,
          mongooseMiddleware.updateData,
          User,
          upsertData
        )
      } else {
        //Create the log message
        CONSTANTS.createLogMessage(FILE_NAME, 'No data Found', 'NODATA')
        //Send the response
        CONSTANTS.createResponses(
          res,
          CONSTANTS.ERROR_CODE.NOT_FOUND,
          CONSTANTS.ERROR_DESCRIPTION.NOT_FOUND,
          next
        )
      }
    })
}

//Delete the researchers information.
const deleteUser = (req, res, next) => {
  var searchCriteria = { _id: req.params.userID }
  loginMiddleware
    .checkifDataExists(User, searchCriteria, FILE_NAME)
    .then(result => {
      if (result != undefined && result != null) {
        if (result.type.toString() === 'Volunteer') {
          var publicKEY = volunteerpublicKEY
        } else {
          var publicKEY = researcherpublicKEY
        }
        postAuthentication.postAuthentication(
          req,
          res,
          next,
          publicKEY,
          FILE_NAME,
          req.params.userID,
          mongooseMiddleware.deleteData,
          User,
          null
        )
      } else {
        //Create the log message
        CONSTANTS.createLogMessage(FILE_NAME, 'No data Found', 'NODATA')
        //Send the response
        CONSTANTS.createResponses(
          res,
          CONSTANTS.ERROR_CODE.NOT_FOUND,
          CONSTANTS.ERROR_DESCRIPTION.NOT_FOUND,
          next
        )
      }
    })
}

//Authenticate the researcher.
const getUserLogin = (req, res, next) => {
  //Check of the researcher exists using their email ID.
  if (req.params === undefined) {
    CONSTANTS.createLogMessage(FILE_NAME, 'Parameter not found', 'ERROR')
    CONSTANTS.createResponses(
      res,
      CONSTANTS.ERROR_CODE.NOT_FOUND,
      'Parameter not found',
      next
    )
  } else {
    var searchCriteria = { email: req.body.email }
    loginMiddleware
      .checkifDataExists(User, searchCriteria, FILE_NAME)
      .then(result => {       
        if (result != undefined && result != null) {
          if (result.type === 'Volunteer') {
            privateKEY = volunteerprivateKEY
          } else {
            privateKEY = researcherprivateKEY
          }
          loginController.loginAuthentication(
            User,
            req,
            res,
            next,
            req.body.password,
            FILE_NAME,
            privateKEY
          )
        } else {
          //Create the log message
          CONSTANTS.createLogMessage(FILE_NAME, 'No data Found', 'NODATA')
          //Send the response
          CONSTANTS.createResponses(
            res,
            CONSTANTS.ERROR_CODE.NOT_FOUND,
            CONSTANTS.ERROR_DESCRIPTION.NOT_FOUND,
            next
          )
        }
      })
  }
}

//This can be used if a volunteer wants to pull up a Researcher info before applying for the job.
const getUserinfoWithID = (req, res, next) => {
  if (req.params === undefined) {
    CONSTANTS.createLogMessage(FILE_NAME, 'Parameter not found', 'ERROR')
    CONSTANTS.createResponses(
      res,
      CONSTANTS.ERROR_CODE.NOT_FOUND,
      'Parameter not found',
      next
    )
  } else {
    mongooseMiddleware.findbyID(User, res, next, FILE_NAME, req.params.userID)
  }
}
//Function to find user based on name or email
const findUser = (req, res, next) => {
  if (req.params === undefined) {
    CONSTANTS.createLogMessage(FILE_NAME, 'Parameter not found', 'ERROR')
    CONSTANTS.createResponses(
      res,
      CONSTANTS.ERROR_CODE.NOT_FOUND,
      'Parameter not found',
      next
    )
  } else {
    if (req.params.search.toString().includes(' ')) {
      var name = req.params.search.toString().split(' ')
      var searchcriteria = { firstName: name[0], lastName: name[1] }
    } else if (req.params.search.toString().includes('@')) {
      var searchcriteria = { email: req.params.search.toString() }
    } else {
      var searchcriteria = {
        $or: [
          { firstName: req.params.search.toString() },
          { lastName: req.params.search.toString() },
          { skills: { $in: [req.params.search.toString()] } }
        ]
      }
    }
    mongooseMiddleware.findOne(User, res, next, FILE_NAME, searchcriteria)
  }
}
module.exports = {
  addNewUser,
  getAllUsers,
  getUserLogin,
  getUserWithID,
  deleteUser,
  getAllUsers,
  updateUser,
  getUserinfoWithID,
  findUser
}
