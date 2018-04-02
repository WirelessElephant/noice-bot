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

const standardBotDescription = '\n\n*****\n^(I am a bot. *bleep bloop*)'

let uniqueReplies = [
    "Noice, you say? To that, I raise you a noice.",
    "Ha! Noice my dude.",
    "Oh yeah? That is pretty noice."],
    recentlyUsedList = [],
    seenCommentList = [],
    seenSubmissionList = [],
    doNotReplyTo = []
    stalkingReddits = [
        'testingground4bots',
        'AwesomeBots',
        'AInotHuman',
        'scp'
    ]

function generateReply() {
    if (!uniqueReplies.length) {
        uniqueReplies = replyList
        recentlyUsedList = []
    }
    let chosenEntry = uniqueReplies[Math.floor(Math.random() * uniqueReplies.length)]
    recentlyUsedList = recentlyUsedList.filter(elem => elem != chosenEntry)
    return chosenEntry + standardBotDescription
}

function weHaveSeenThisComment(comment) {
    if (~seenCommentList.indexOf(comment.id)) return true
    seenCommentList.push(comment.id)
    if (seenCommentList.length >= (25 * stalkingReddits.length)) {
        //seenCommentList.reverse().pop()
        //seenCommentList.reverse()
    }
    return false
}

function weHaveSeenThisSubmission(submission) {
    if (~seenSubmissionList.indexOf(submission.id)) return true
    seenSubmissionList.push(submission.id)
    if (seenSubmissionList.length >= (25 * stalkingReddits.length)) {
        //seenSubmissionList.reverse().pop()
        //seenSubmissionList.reverse()
    }
    return false
}

function checkIfShouldReply (instance) {
    return (
        ((instance.body && ~instance.body.indexOf('noice')) ||
        (instance.selftext && ~instance.selftext.indexOf('noice')) || 
        (instance.title && ~instance.title.indexOf('noice'))) &&
        (!~doNotReplyTo.indexOf(instance.author.id)) &&
        (!weHaveSeenThisComment(instance) && !weHaveSeenThisSubmission(instance))
    ) 
}

async function HandleRedditEvent(instance) {
  if (checkIfShouldReply(instance)) {
      setTimeout(async () => {
          try {
              console.log("Found a matching comment. Woo!")
              await instance.upvote()
              let response = await instance.reply(generateReply())
              weHaveSeenThisComment(response)
          } catch (err) {
              console.warn(err)
          }
      }, 2000)
  }
}


function runCommentsCheck () {
    stalkingReddits.forEach(function(subreddit) {
        wrap.getNewComments(subreddit, {limit: 25}).then(function(comment_list) {
            comment_list.forEach(HandleRedditEvent)
        }, function (err) {
            console.log(err)
        })
        wrap.getNew(subreddit, {limit: 25}).then(function(comment_list) {
            comment_list.forEach(HandleRedditEvent)
        }, function (err) {
            console.log(err)
        })
    })
}


async function init () {
    let me = await wrap.getMe()
    doNotReplyTo.push(me.id)
    let promiseArr = stalkingReddits.map(async function (subR) {
        let initialCommentList = await wrap.getNewComments(subR, {limit: 25})
        initialCommentList.forEach(comment => weHaveSeenThisComment(comment))
        let initialSubmissionList = await wrap.getNew(subR, {limit:25})
        initialSubmissionList.forEach(submission => weHaveSeenThisSubmission(submission))
    })
    await Promise.all(promiseArr)
    console.log("Initial loading done. Resume polling...")
    setInterval(runCommentsCheck, 5000)
}

init()
