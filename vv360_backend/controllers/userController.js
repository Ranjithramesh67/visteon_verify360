const { query } = require('../config/db');

const multer = require('multer');
const path = require('path');
const fs = require('fs');

const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

const getUsers = async (req, res) => {
  try {
    const result = await query('SELECT * FROM users');
    res.status(200).json({ status: true, data: result });
  } catch (err) {
    console.error('Error fetching users:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};


const generateOtp = () => {
  return Math.floor(100000 + Math.random() * 900000);
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.fieldname.startsWith('carImage')) {
      cb(null, 'uploads/car_uploads/');
    } else if (file.fieldname.startsWith('rcFile')) {
      cb(null, 'uploads/rc_uploads/');
    } else {
      cb(null, 'uploads/profile_photos/');
    }
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}_${file.originalname}`);
  }
});

const upload = multer({ storage }).any();

// const upload = multer({
//   storage: storage,
//   limits: { fileSize: 5 * 1024 * 1024 }, // Limit file size to 5MB
//   fileFilter: (req, file, cb) => {
//     if (!file.mimetype.startsWith('image/')) {
//       return cb(new Error('Only image files are allowed!'), false);
//     }
//     cb(null, true);
//   },
// }).single('profile_photo');

const registerUser = async (req, res) => {
    upload(req, res, async (err) => {
      if (err) return res.status(400).json({ error: 'File upload failed', details: err.message });
  
      const { fullname, dob, email, mobile, gender, username, password } = req.body;
  
      if (!fullname || !email || !mobile || !username || !password) {
        return res.status(400).json({ error: 'Required fields are missing' });
      }
  
      const profileImageFile = req.files?.find(f => f.fieldname === 'profileImage');
      const profilePhotoPath = profileImageFile
        ? `/${profileImageFile.path}`
        : `https://ui-avatars.com/api/?name=${fullname}`;
  
      try {
        const hashedPassword = await bcrypt.hash(password, 10); // 10 salt rounds
  
        const result = await query(
          `INSERT INTO users (fullname, email, mobile, username, password, profile_photo) 
           VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
          [fullname, email, mobile, username, hashedPassword, profilePhotoPath]
        );
  
        const newUser = result[0];
        res.status(201).json({
          status: true,
          message: 'User registered successfully',
          data: {
            id: newUser.id,
            fullname: newUser.fullname,
            username: newUser.username,
            email: newUser.email
          }
        });
      } catch (err) {
        console.error('Error registering user:', err);
        res.status(500).json({ error: 'Internal server error' });
      }
    });
  };


  const loginUser = async (req, res) => {
    const { username, password } = req.body;
  
    if (!username || !password) return res.status(400).json({ message: 'Username and password required' });
  
    try {
      const result = await query(`SELECT * FROM users WHERE username = $1`, [username]);
  
      if (result.length === 0) return res.status(404).json({ message: 'User not found' });
  
      const user = result[0];
      const isPasswordValid = await bcrypt.compare(password, user.password);
  
      if (!isPasswordValid) return res.status(401).json({ message: 'Invalid credentials' });
  
      const token = jwt.sign(
        { id: user.id, username: user.username, email: user.email },
        process.env.JWT_SECRET_KEY,
        { expiresIn: '1h' }
      );
  
      res.status(200).json({
        status: true,
        message: 'Login successful',
        data: {
          id: user.id,
          fullname: user.fullname,
          username: user.username,
          email: user.email,
          profile_photo: user.profile_photo,
          token
        }
      });
    } catch (err) {
      console.error('Login error:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  };
  

const getUser = async (req, res) => {
  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({ message: "User ID is required" })
    }

    const qry = "SELECT * FROM users WHERE id=$1";

    const result = await query(qry, [userId]);

    if (result.length === 0) {
      return res.status(404).json({ message: "No user found on this id" })
    }

    res.status(200).json({
      status: true,
      data: result[0],
    });
  } catch (err) {
    console.error('Error fetching user detail:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

const updateUser = async (req, res) => {
  upload(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ error: 'Error uploading file', details: err.message });
    }

    const { userId, full_name, dob, email, mobile, gender } = req.body;

    if (!userId || !full_name || !dob || !email || !mobile || !gender) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const profileImageFile = req.files.find(f => f.fieldname === 'profile_photo');
    const profilePhotoPath = profileImageFile ? `/${profileImageFile.path}` : `https://ui-avatars.com/api/?name=${full_name}`;

    const queryParams = [full_name, dob, email, mobile, gender];
    let qry = `
      UPDATE users 
      SET full_name = $1, dob = $2, email = $3, mobile = $4, gender = $5`;

    if (profilePhotoPath) {
      qry += `, profile_photo = $6`;
      queryParams.push(profilePhotoPath);
    }

    qry += ` WHERE id = $${queryParams.length + 1} RETURNING *`;
    queryParams.push(userId);

    try {
      const result = await query(qry, queryParams);

      const updatedUser = result ? result[0] : null;

      if (!updatedUser) {
        return res.status(500).json({ error: 'User update failed. No user data returned.' });
      }

      res.status(200).json({
        status: true,
        message: 'User updated successfully',
        data: {
          id: updatedUser.id,
          full_name: updatedUser.full_name,
          dob: updatedUser.dob,
          email: updatedUser.email,
          mobile: updatedUser.mobile,
          gender: updatedUser.gender,
          otp: updatedUser.otp,
          profile_photo: updatedUser.profile_photo
        }
      });
    } catch (err) {
      console.error('Error updating user:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  });
};




module.exports = { getUsers, registerUser, loginUser, getUser, updateUser };