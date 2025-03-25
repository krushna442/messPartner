import mongoose from "mongoose";
 const mealrecordschema= mongoose.Schema({
    Vendor_id:{type:String,required:true},
    date: {type:Date,required:true},
    breakfast:{type:Array},
    lunch:{type:Array},
    dinner:{type:Array}
    });
const Mealrecord=mongoose.model("Mealrecord",mealrecordschema);
export default Mealrecord;