import mongoose from "mongoose";
import { type } from "os";
import { json } from "stream/consumers";
mealrecordschema= mongoose.Schema({
    Vendor_id:{type:String,required:true},
    date: {type:Date,required:true},
    b
    });
    Mealrecord=mongoose.model("Mealrecord",mealrecordschema);
