import express from 'express';
import Client from '../../models/Client.js';
import isAuthenticated from '../../utils/clientauth.js';

const router = express.Router();
router.post ('/user/update/details',isAuthenticated,async(req,res)=>{
    try{
    const {user_id}= req.user;
    const {name,email,number,password}= req.body;

    const user = await Client.findOne({user_id});
    if(name)
        user.name=name;
    if(email)
        user.email=email;
    if(number)
        user.number=number;
    if(password)
        user.password= password;
    await user.save();
    res.status(200).json({message:"details updated",
        updatedDetails :user
    })
    }catch(error){
        res.status(400).json(error.message);
    }

})
export default router;
