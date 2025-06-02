const router = require("express").Router();

const { getUsers, 
        registerUser, 
        loginUser ,
        getUser,
        updateUser
    } = require("../controllers/userController");

router.get('/get-users', getUsers);
router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/get-user', getUser)
router.put('/update-user', updateUser)

module.exports = router;
