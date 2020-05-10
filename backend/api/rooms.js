const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const passport = require('passport');

// Load validation
const isEmpty = require('../validation/is-empty');
const containsElement = require('../validation/containsElement');

// Load Models
const User = require('../models/User');
const Room = require('../models/Room');
var ObjectId = require('mongoose').Types.ObjectId;

// Create a room
router.post('/', 
  passport.authenticate('jwt', { session: false }),
  (req, res) => {
    let { name } = req.body;

    Room.findOne({ name }).then(room => {

      if (room) {
        let errors = { name: 'Room name already exists' };
        res.status(404).json(errors);
        
      } else {
        const newRoom = new Room({
          name,
          owner: req.user.id
        });

        newRoom
          .save()
          .then(savedRoom => res.json(savedRoom));
        }

    })
    .catch(err => console.log(err))
})

// Check if room exists
router.get('/:id', (req, res) => {
  let classId = req.params.id;

  if (isEmpty(classId) || !ObjectId.isValid(classId)) {
    res.status(404).json({ roomId: 'Invalid room ID' });
    return;
  }

  Room.findById(classId).then(room => {
    if (room) {
      res.json({ success: true, room });

    } else {
      res.status(404).json({ roomId: 'Room not found' });
    }
  })
  .catch(err => console.log(err))
})


/*  @route      GET api/content
    @desc       Get all content
    @access     Public
 */
router.get('/daf', (req, res) => {
  Content.find()
    .populate('user', ['name', 'pic', 'colourCode'])
    .populate('comments')
    .sort({ date: -1 })
    .then(allContent => res.json(allContent))
    .catch(err => res.status(404).json({ noContentFound: 'No content was found' }));
});
//.populate({ path: 'comments', populate: { path: 'user', select: ['name', 'pic']}, populate: { path: 'replies' }})

/*  @route      GET api/content/:id
    @desc       Get content by id
    @access     Public
 */// c.populate({ path: 'comments', populate: { path: 'user' }, populate: { path: 'replies' }}).populate('user', ['name', 'pic'], (err , content) => {
router.get('/ff/:id', (req, res) => {
  Content.findById(req.params.id)
    .populate('user', ['name', 'pic', 'colourCode'])
    .populate({ path: 'comments', populate: { path: 'replies'}})
    .then(content => {
      content.views = content.views + 1;
      content.save().then(c => res.json(content)).catch(err => console.log(err))
    })
    .catch(err =>
      res.status(404).json({ msg: 'No content was found' })
    );
});

/*  @route      POST api/content
    @desc       Create content
    @access     Private
 */
router.post(
  '/ffdsfs',
  passport.authenticate('jwt', { session: false }),
  (req, res) => {
    console.log(req.body);
    //const { errors, isValid } = validatePostInput(req.body);

    // Check Validation
    // if (!isValid) {
    //   // Return any errors with 400 status
    //   return res.status(400).json(errors);
    // }

    // Create content
    const newContent = new Content({
      user: req.user.id,
      title: req.body.title,
      description: req.body.description,
      content: req.body.content,
      image: req.body.image
    });

    newContent
      .save()
      .then(content => res.json(content));
  }
);


/*  @route      POST api/content/:id
    @desc       Edit content
    @access     Private
 */
router.post('/dad/:id', passport.authenticate('jwt', { session: false }),
(req, res) => {
  const contentId = req.params.id;
  const userId = req.user.id;
 
  User.findById(userId).then(user => {
    Content.findById(contentId).then(c => {
      
      if (c.user.toString() !== user._id.toString()) {
        return res.status(401).json({ msg: 'User not authorized' });
      }

      if (c.title != req.body.title) c.title = req.body.title;
      if (c.description != req.body.description) c.description = req.body.description;
      if (c.image != req.body.image) c.image = req.body.image;
      c.content = req.body.content;
      c.lastUpdated = Date.now();
      c.views = c.views + 1;

      // Save
      c.save()
      .then(c => {
        c.populate({ path: 'comments', populate: { path:'replies' }}).populate('user', ['name', 'pic', 'colourCode'], (err , content) => {
          if (err) {
            console.log(err);
          } else {
            res.json(content);
          }
        })
      })
      .catch(err => {
        console.log(err);
        res.status(404).json({ msg: 'Unable to save' })
      });
      
    })
  })
});

/*  @route      DELETE api/content/:id
    @desc       Delete content
    @access     Private
 */
router.delete(
  '/dsa/:id',
  passport.authenticate('jwt', { session: false }),
  (req, res) => {

    const contentId = req.params.id;
    const userId = req.user.id;

    User.findOne({ user: userId }).then(user => {
      Content.findById(contentId)
        .then(c => {

          // Check content owner
          if (c.user.toString() !== req.user.id) {
            return res
              .status(401)
              .json({ msg: 'User not authorized' });
          }

          // Delete content
          c.remove().then(d => res.json({ success: 'true' }));
            
        })
        .catch(err => res.status(404).json({ msg: 'No content found' }));
    });
  }
);

/*  @route      POST api/content/like/unlike/:id
    @desc       Like/unlike content
    @access     Private
 */
router.post(
  '/like/unlike/:id',
  passport.authenticate('jwt', { session: false }),
  (req, res) => {

    User.findOne({ user: req.user.id }).then(user => {
      Content.findById(req.params.id)
        .then(c => {

          const hasLiked = c.likes.map(item => item.toString()).indexOf(req.user.id);

          // unlike
          if (hasLiked !== -1) {
            // remove user from likes
            c.likes.splice(hasLiked, 1);

          } else {
            // Add user id to the likes array
            c.likes.unshift(req.user.id);
          }

          // Save
          c.save().then(c => res.json(c)).catch(err => console.log(err))
        })
        .catch(err => res.status(404).json({ msg: 'Content not found' }));
    });
  }
);


/*  @route      POST api/content/comment/:id
    @desc       Add a comment to a content
    @access     Private
 */
router.post(
  '/comment/:id',
  passport.authenticate('jwt', { session: false }),
  (req, res) => {
    User.findById(req.user.id).then(user => {
      Content.findById(req.params.id)
        .then(content => {

          const newComment = new Comment ({
            user: req.user.id,
            username: req.user.name,
            content: req.params.id,
            text: req.body.text
          });
          
          // Save comment to model and append comment id to list of content comments
          newComment.save().then(comment => {
            content.comments.unshift(comment._id);
            // Save
            content.save()
              .then(c => {
                c.populate({ path: 'comments', populate: { path:'replies' }}).populate('user', ['name', 'pic', 'colourCode'], (err , content) => {
                  if (err) {
                    console.log(err);
                  } else {
                    res.json(content);
                  }
                })
              })
              .catch(err => {
                console.log(err);
                res.status(404).json({ msg: 'Unable to save' })
              });
            });

        })
        .catch(err => res.status(404).json({ msg: 'Content not found'}))
    })
  }
);

/*  @route      DELETE api/content/comment/:id/
    @desc       Remove a comment from content
    @access     Private
 */
router.delete(
  '/comment/:id',
  passport.authenticate('jwt', { session: false }),
  (req, res) => {

    User.findById(req.user.id).then(user => {
      Comment.findById(req.params.id).populate('content').then(comment => {
        if (comment.user.toString() === user._id.toString() || comment.content.user.toString() === user._id.toString()) {
          comment.remove().then(c => {
            c.content.populate({ path: 'comments', populate: { path:'replies' }}).populate('user', ['name', 'pic', 'colourCode'], (err , content) => {
              console.log(content);
              res.json(content);
            })

          }).catch(err => console.log(err))
        }
      })
    })
  }
);


/*  @route      POST api/content/like/comment/:id
    @desc       Like/unlike a comment
    @access     Private
 */
router.post(
  '/like/comment/:id',
  passport.authenticate('jwt', { session: false }),
  (req, res) => {

    User.findOne({ user: req.user.id }).then(user => {
      Comment.findById(req.params.id)
        .then(c => {
          // fillter will loop through the array
          if (c.likes.filter(likedBy => likedBy.toString() === req.user.id).length > 0) {
            c.likes.splice(c.likes.indexOf(req.user.id), 1);
          } else {
            c.likes.unshift(req.user.id);
          }

          // Save
          c.save().then(c => res.json(c)).catch(err => console.log(err))
        .catch(err => res.status(404).json({ msg: 'Comment not found' }));
    });
  })
});

router.post(
  '/reply/:commentId/:contentId',
  passport.authenticate('jwt', { session: false }),
  (req, res) => {
    // find the parent comment and add the reply to it
    Comment.findById(req.params.commentId)
      .then(c => {

        const newComment = new Comment ({
          user: req.user.id,
          username: req.user.name,
          content: req.params.contentId,
          text: req.body.text
        });

        newComment.save().then(newComment => {
          c.replies.push(newComment._id);
          c.save()
            .then(c => c.populate('replies', (err , parentComment) => {
              if (err) {
                console.log(err);
              } else {
                console.log(parentComment);
                res.json(parentComment);
              }
            }))
            .catch(err => console.log(err))
        }).catch(err => console.log(err))

      .catch(err => res.status(404).json({ msg: 'Comment not found' }));
  });
});

router.get(
  '/replies/:commentId',
  passport.authenticate('jwt', { session: false }),
  (req, res) => {
    Comment.findById(req.params.commentId).populate('replies')
      .then(c => {
        console.log(c);
        res.json(c);
      })
      .catch(err => res.status(404).json({ msg: 'Comment not found' }));
});

module.exports = router;
