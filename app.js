require('dotenv').config()

const snoowrap = require('snoowrap')
const snoostorm = require('snoostorm')

const wrap = new snoowrap({
  userAgent: 'nodejs:noice-bot:v0.1 (by /u/kriswithakthatplays)',
  clientId: process.env.CLIENT_ID,
  clientSecret: process.env.CLIENT_SECRET,
  username: process.env.REDDIT_USER,
  password: process.env.REDDIT_PASS
})

const client = new snoostorm(wrap)

const commentStream = client.CommentStream({
  subreddit: 'testingground4bots',
  results: 25
})

commentStream.on('comment', (comment) => {
  if (~comment.body.indexOf('noice')) {
    comment.reply('noice')
  }
})
