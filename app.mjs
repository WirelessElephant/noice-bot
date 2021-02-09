require('dotenv').config()

const snoowrap = require('snoowrap')

const wrap = new snoowrap({
  userAgent: 'nodejs:noice-bot:v0.1 (by /u/kriswithakthatplays)',
  clientId: process.env.CLIENT_ID,
  clientSecret: process.env.CLIENT_SECRET,
  username: process.env.REDDIT_USER,
  password: process.env.REDDIT_PASS
})

const standardBotDescription = "****^(I am a bot. *bleep bloop*)"

const uniqueReplies = [
    "Noice, you say? To that, I raise you a noice.",
    "Ha! Noice my dude.",
    "Oh yeah? That is pretty noice.",
    "Noice.",
    "Quite noice.",
    "Very noice."
]

let seenCommentList = []
let seenSubmissionList = []
let doNotReplyTo = []
let stalkingReddits = [
    'testingground4bots',
    'AwesomeBots',
    'AInotHuman',
    'scp',
    'kriswithak'
]

function* replyGenerator() {
    let replyList = [...uniqueReplies]
    let replyCount = 0
    while (true) {
        yield `${replyList[replyCount]}

${standardBotDescription}`

        replyCount++
        if (replyCount >= replyList.length) {
            replyCount = 0
        }
    }
}

const getNextReply = replyGenerator()

function nextReply() {
    return getNextReply.next()['value']
}

function haveWeSeenThisComment(comment) {
    return seenCommentList.includes(comment.id)
}

function haveWeSeenThisSubmission(submission) {
    return seenSubmissionList.includes(submission.id)
}

function checkIfShouldReply (instance) {
    return (
        (
          (instance.body && ~instance.body.toLowerCase().indexOf('noice')) ||
          (instance.selftext && ~instance.selftext.toLowerCase().indexOf('noice')) || 
          (instance.title && ~instance.title.toLowerCase().indexOf('noice'))
        ) &&
        (!doNotReplyTo.includes(instance.author.id)) &&
        (!haveWeSeenThisComment(instance) || !haveWeSeenThisSubmission(instance))
    ) 
}

async function lookForTargets() {
    /*
    We're going to take the list of subreddits, map them to a long list of comments,
    then filter them down to the ones we need to reply to. Then, we shove the ones
    we need to reply to to the function that replies.

    Ezpz
    */
    const rawCommentsList = await Promise.all(
        stalkingReddits.map(subRedditName => {
            return wrap.getSubreddit(subRedditName).getNewComments()
        })
    )
    const commentsToReplyTo = rawCommentsList
        // Reduce the list of lists to a flat list
        .reduce((allComments, subredditComments) => [...allComments, ...subredditComments])
        // Look at the post and check a bunch of criteria in the check function
        .filter(checkIfShouldReply)

    if (commentsToReplyTo.length > 0) {
        // Time to reply to posts and make sure we don't do it twice
        // replyToComments(commentsToReplyTo)

    }
    return
}

function replyToComments(commentList) {
    for (const comment of commentsToReplyTo) {
        console.log(comment)
        comment.reply(nextReply()).then(done => {
            seenCommentList.push(comment.id)
        })
    }
}

async function init () {
    let me = await wrap.getMe()
    doNotReplyTo.push(me.id)
    console.log("Initial loading done. Start polling for comments and posts")
    setInterval(lookForTargets, 5000)
}

export {
    init,
    checkIfShouldReply,
    lookForTargets,
    wrap
}