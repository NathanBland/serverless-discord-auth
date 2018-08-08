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
  const selfURL = event.requestContext.stage === 'dev' ? ' https://t4jgu9l4n7.execute-api.us-east-1.amazonaws.com' : 'http://127.0.0.1:3001'
  const mongoose = Mongoose.createConnection(process.env.DB_URI)
  const User = require('../../models/user')(mongoose)
  const query = event.queryStringParameters
  const ClientOAuth2 = require('client-oauth2')

  // console.log('stage:', event)
  // console.log('context:', context)
  const discordAuth = new ClientOAuth2({
    clientId: process.env.client_ID,
    clientSecret: process.env.client_secret,
    accessTokenUri: 'https://discordapp.com/api/oauth2/token',
    authorizationUri: 'https://discordapp.com/api/oauth2/authorize',
    redirectUri: selfURL + '/auth/login/callback',
    scopes: ['email', 'identity', 'messages.read', 'guilds']
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
        return rq({
          uri: discordBase + '/users/@me/guilds',
          headers: {
            'Authorization': 'Bearer ' + usr.data.access_token
          },
          json: true
        })
        .then(channels => {
          user.channels = channels
          return user.save()
        })
        .catch(err => {
          console.log('err', err.message)
        })
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
        err
      }),
    };
    callback(null, response);
  })
}
