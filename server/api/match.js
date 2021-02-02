/* eslint-disable max-statements */
const router = require('express').Router();
const nodemailer = require('nodemailer');
const { User, Relationship, Preference, Dog } = require('../db')
const { filterMatchesWithUserSpecifiedFilters } = require('../matchAlg/userFilters')
const {findMatch} = require('../matchAlg/match')
const updatePref = require('./updatePref')

router.get('/:userId', async(req, res, next) => {
    try {
        const { userId } = req.params
        const currUser = (await User.findByPk(userId, { include: {all: true} })).dataValues
        const allUsers = await User.findAll({ include: {all: true} });

        // first find relationships with matches that have already liked this user
        let matchesAlreadyLikedUserRelationships = await Relationship.findAll({
            where: {
                matchId: userId,
                result: 'UserLikedMatch'
            }
        });
        let matchesAlreadyLikedUser = [];
        if (matchesAlreadyLikedUserRelationships.length) {
            // create an array that contains ids of matches that already liked this user
            const matchesAlreadyLikedUserIds = matchesAlreadyLikedUserRelationships.reduce((acc, relp) => {
                acc.push(relp.userId)
                return acc
            }, []);

            // create array of Matches based on the match id array from above
            matchesAlreadyLikedUser = allUsers.filter(user => matchesAlreadyLikedUserIds.includes(user.id));
            // filter these matches with user specified filters using function
            matchesAlreadyLikedUser = filterMatchesWithUserSpecifiedFilters(currUser, matchesAlreadyLikedUser)
        }
        // if after filtering by user-specified filters, matches still remain...
        if (matchesAlreadyLikedUser.length) {
            // send one match at a time so algo can update with each decision by user
            // sending 1st element in matches array for now, but this would be sorted based on algorithm
            const bestMatch = findMatch(currUser, matchesAlreadyLikedUser)
            bestMatch.dataValues.liked = true;
            res.send(bestMatch)
            }
        // if there are no filtered matches that have already liked this user...
        else {
            // first find IDs of matches that this user should not see in their feed, defined 2 ways:
            // all matches that this user has seen already
            const seenMatches = await Relationship.findAll({
                where: {
                    userId,
                }
            });
            // users that have already seen this user as a match
            // we check for UserLikedMatch above so don't need result condition; we may get UserLikedMatch that were filtered out based on user-specified prefs but those will be filtered out again below
            const matchesThatHaveSeenThisUser = await Relationship.findAll({
                where: {
                    matchId: userId,
                }
            })
            let matchesToExcludeId = []
            seenMatches.forEach(match => matchesToExcludeId.push(match.matchId))
            matchesThatHaveSeenThisUser.forEach(match => matchesToExcludeId.push(match.userId))

            let unseenMatches = allUsers.filter(user => {
                return (!matchesToExcludeId.includes(user.id) && user.id !== userId * 1)
            })
            unseenMatches = filterMatchesWithUserSpecifiedFilters(currUser, unseenMatches)

            if (!unseenMatches.length) {
                res.send( { message: 'You have no matches that fit your criteria. Try broadening it in your settings!'})
            }
            else {
                const bestMatch = findMatch(currUser, unseenMatches)
                bestMatch.dataValues.liked = false;
                res.send(bestMatch)
            }
        }
    } catch (err) { next(err) }
})

router.put('/:userId', async(req, res, next) => {
    try {
        const { userId } = req.params
        const { decision, matchId } = req.body
        // first check to see if match has already liked user
        const currUserPref = await Preference.findOne({
            where:
            {
                userId: userId
            }
        })
        const match = await User.findByPk(matchId, {include: Dog})
        const existingRelationship = await Relationship.findOne({
            where:
                {
                    userId: matchId,
                    matchId: parseInt(userId)
                }
        })
        if (decision === 'like'){
            updatePref(currUserPref, match.dataValues, match.dog.dataValues)
        }
        if (existingRelationship) {
            if (decision === 'like') {
                await existingRelationship.update({ result: 'Matched' })
            }
            if (decision === 'reject') {
                await existingRelationship.update({ result: 'MatchRejectedUser' })
            }
            res.send(existingRelationship);

        }

        // if match has not yet seen user, create a new relationship
        else {
                const result = decision === 'like' ? 'UserLikedMatch' : 'UserRejectedMatch'
                const newRelationship = await Relationship.create({
                    userId,
                    matchId,
                    result
                })
                res.send(newRelationship);
        }
    } catch (err) { next(err); }
})

router.post('/email', async (req, res, next) => {
    try {
        const { matchEmail, matchEmailText } = req.body;
        const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: 'woofmates.matching@gmail.com',
            pass: 'Woofmates123',
        },
        });
        // send mail with defined transport object
        await transporter.sendMail({
        from: '"WoofMates 🐶" <woofmates.matching@gmail.com>',
        to: matchEmail,
        subject: 'You have a new match!!',
        html: matchEmailText,
        });

        res.sendStatus(200);
    } catch (err) { next(err); }
});

module.exports = router;
