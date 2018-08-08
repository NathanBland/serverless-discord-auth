const uuid = require('uuid')
const mongoose = require('mongoose')
const findOrCreate = require('mongoose-findorcreate')
module.exports = (db) => {
  let user = new mongoose.Schema({
    // also tried new mongoose.Schema('user')...
    _id: {
      type: String,
      default: uuid.v4()
    },

    // displayName: String,
    email: String,
    discord: mongoose.Schema.Types.Mixed,
    acess_token: String,
    channels: [mongoose.Schema.Types.Mixed]
    // username: {
    //   type: String,
    //   unique: true
    // },
    // role: String
  })
  user.plugin(findOrCreate)
  return db.model('user', user)
}
