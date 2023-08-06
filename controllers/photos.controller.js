const Photo = require('../models/Photo.model');
const Voter = require('../models/Voter.model');
const requestIp = require('request-ip');

/****** SUBMIT PHOTO ********/

exports.add = async (req, res) => {
  try {
    let { title, author, email } = req.fields;
    const file = req.files.file;

    // Regular expression to remove any HTML tags
    const htmlRegex = /<[^>]*>?/gm;

    // Remove HTML tags from input fields
    title = title.replace(htmlRegex, "");
    author = author.replace(htmlRegex, "");
    email = email.replace(htmlRegex, "");

    if(title && author && email && file) { // if fields are not empty...
      const fileName = file.path.split('/').slice(-1)[0]; // cut only filename from full path, e.g. C:/test/abc.jpg -> abc.jpg
      const fileExt = fileName.split('.').slice(-1)[0];
      const allowedExtensions = ['jpg', 'png', 'gif'];

      if (allowedExtensions.includes(fileExt) && title.length <= 25) {
        const newPhoto = new Photo({ title, author, email, src: fileName, votes: 0 });
        await newPhoto.save(); // ...save new photo in DB
        res.json(newPhoto);
      } else {
        console.log('Bad data provided to the server');
        res.status(415).send({ message: 'Bad data provided to the server.' });
      }

    } else {
      throw new Error('Wrong input!');
    }

  } catch(err) {
    res.status(500).json(err);
  }
};

/****** LOAD ALL PHOTOS ********/

exports.loadAll = async (req, res) => {

  try {
    res.json(await Photo.find());
  } catch(err) {
    res.status(500).json(err);
  }

};

/****** VOTE FOR PHOTO ********/

exports.vote = async (req, res) => {
  try {
    const photoId = req.params.id;
    const userIp = requestIp.getClientIp(req); 

    // Check if voter with this IP exists
    let voter = await Voter.findOne({ user: userIp });

    if (!voter) {
      // If the voter doesn't exist, create a new one
      voter = new Voter({ user: userIp, votes: [photoId] });
    } else {
      // Check if this photo is already in voter's votes
      if (voter.votes.includes(photoId)) {
        return res.status(500).json({ message: 'You have already voted for this photo' });
      }

      // If the voter already exists, add this photo to their votes
      voter.votes.push(photoId);
    }

    await voter.save(); // Save the voter document

    // Now update the photo's votes
    const photoToUpdate = await Photo.findOne({ _id: req.params.id });
    if (!photoToUpdate) {
      return res.status(404).json({ message: 'Not found' });
    } else {
      photoToUpdate.votes++;
      await photoToUpdate.save();
      return res.json({ message: 'Thanks for voting!' });
    }
  } catch(err) {
    return res.status(500).json(err);
  }
};

