'use strict';
const Mongoose = require('mongoose')
const rq = require('request-promise')
const discordBase = 'https://discordapp.com/api'
// const User = require('../../models/user')
Mongoose.Promise = global.Promise

module.exports.login = (event, context, callback) => {
  
};

module.exports.oauthCallback = (event, context, callback) => {
  // console.log('hit callback:', event, context)
  const mongoose = Mongoose.createConnection(process.env.DB_URI)
  const User = require('../../models/user')(mongoose)
  const query = event.queryStringParameters
  const ClientOAuth2 = require('client-oauth2')

  // console.log('event:', event)
  // console.log('context:', context)
  const discordAuth = new ClientOAuth2({
    clientId: process.env.client_ID,
    clientSecret: process.env.client_secret,
    accessTokenUri: 'https://discordapp.com/api/oauth2/token',
    authorizationUri: 'https://discordapp.com/api/oauth2/authorize',
    redirectUri: 'http://127.0.0.1:3001/auth/login/callback',
    scopes: ['email', 'identity']
  })

  discordAuth.code.getToken(event.path + '?code=' + query.code)
  .then(usr => {
    const options = {
      uri: discordBase + '/users/@me',
      headers: {
        'Authorization': 'Bearer ' + usr.data.access_token
      },
      json: true
    }
    rq(options)
    .then(res => {
      console.log('user:', res)
      User.findOrCreate({email: res.email})
      .then(user => {
        user.doc.discord = res
        user.doc.access_token = usr.data.access_token
        return user.doc.save()
      })
      .then(user => {
        const response = {
          statusCode: 200,
          body: user,
        };
        callback(null, response);
        return user
      })
      .catch(err => {
        throw new Error('something went wrong signing up or logging in:' + err)
      })
    
    }).catch((e) => {
      console.error(e);
    });
  })
  .catch(err => {
    console.log('err', err)
    const response = {
      statusCode: 401,
      body: JSON.stringify({
      }),
    };
    callback(null, response);
  })
}
